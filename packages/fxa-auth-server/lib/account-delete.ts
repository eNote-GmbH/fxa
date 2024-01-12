/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { Container } from 'typedi';
import OAuthDb from './oauth/db';
import { AppleIAP } from './payments/iap/apple-app-store/apple-iap';
import { PlayBilling } from './payments/iap/google-play/play-billing';
import { PayPalHelper } from './payments/paypal/helper';
import { StripeHelper } from './payments/stripe';
import push from './push';
import pushboxApi from './pushbox';
import { AuthLogger, AuthRequest } from './types';
import {
  deleteAllPayPalBAs,
  getAllPayPalBAByUid,
} from 'fxa-shared/db/models/auth';
import * as Sentry from '@sentry/node';
import error from './error';
import { ConfigType } from '../config';
import OtpUtils from './routes/utils/otp';

// type FxaDbDeleteAccount = Pick<
//   Awaited<ReturnType<ReturnType<typeof DB>['connect']>>,
//   'deleteAccount'
// >;
type OAuthDbDeleteAccount = Pick<typeof OAuthDb, 'removeTokensAndCodes'>;
type PushDeleteAccount = Pick<
  ReturnType<typeof push>,
  'notifyAccountDestroyed'
>;
type PushboxDeleteAccount = Pick<
  ReturnType<typeof pushboxApi>,
  'deleteAccount'
>;

export class AccountDeleteManager {
  private fxaDb: any;
  private oauthDb: OAuthDbDeleteAccount;
  private push: PushDeleteAccount;
  private pushbox: PushboxDeleteAccount;
  private customs: any;
  private stripeHelper?: StripeHelper;
  private paypalHelper?: PayPalHelper;
  private appleIap?: AppleIAP;
  private playBilling?: PlayBilling;
  private log: AuthLogger;
  private config: ConfigType;
  private otpUtils: any;
  private Password: any;
  private signinUtils: any;

  constructor({
    fxaDb,
    oauthDb,
    push,
    pushbox,
    customs,
    config,
    Password,
    signinUtils,
  }: {
    fxaDb: any;
    oauthDb: OAuthDbDeleteAccount;
    push: PushDeleteAccount;
    pushbox: PushboxDeleteAccount;
    customs: any;
    config: ConfigType;
    Password: any;
    signinUtils: any;
  }) {
    this.fxaDb = fxaDb;
    this.oauthDb = oauthDb;
    this.push = push;
    this.pushbox = pushbox;
    this.customs = customs;
    this.config = config;

    this.log = Container.get(AuthLogger);
    this.otpUtils = OtpUtils(this.log, config, this.fxaDb);
    this.Password = Password;
    this.signinUtils = signinUtils;

    if (Container.has(StripeHelper)) {
      this.stripeHelper = Container.get(StripeHelper);
    }
    if (Container.has(PayPalHelper)) {
      this.paypalHelper = Container.get(PayPalHelper);
    }
    if (Container.has(AppleIAP)) {
      this.appleIap = Container.get(AppleIAP);
    }
    if (Container.has(PlayBilling)) {
      this.playBilling = Container.get(PlayBilling);
    }
  }

  /**
   * This is the delete account method used primarily in `/account/destroy` route
   * @param request
   */
  async destroy(request: AuthRequest) {
    this.log.begin('Account.destroy', request);

    const { authPW, email: emailAddress } = request.payload as any;

    await this.customs.check(request, emailAddress, 'accountDestroy');

    let accountRecord;
    try {
      accountRecord = await this.fxaDb.accountRecord(emailAddress);
    } catch (err) {
      if (err.errno === error.ERRNO.ACCOUNT_UNKNOWN) {
        await this.customs.flag(request.app.clientAddress, {
          email: emailAddress,
          errno: err.errno,
        });
      }

      throw err;
    }

    const sessionToken = request.auth && request.auth.credentials;
    const hasTotpToken = await this.otpUtils.hasTotpToken(accountRecord);

    // Someone tried to delete an account with TOTP but did not specify a session.
    // This shouldn't happen in practice, but just in case we throw unverified session.
    if (!sessionToken && hasTotpToken) {
      throw error.unverifiedSession();
    }

    // If TOTP is enabled, ensure that the session has the correct assurance level before
    // deleting account.
    if (
      sessionToken &&
      hasTotpToken &&
      (sessionToken.tokenVerificationId ||
        (sessionToken.authenticatorAssuranceLevel as number) <= 1)
    ) {
      throw error.unverifiedSession();
    }

    // In other scenarios, fall back to the default behavior and let the user
    // delete the account. If they have a password set, we verify it here. Users
    // that don't have a password set will be able to delete their account without
    // this step.
    if (accountRecord.verifierSetAt > 0) {
      const password = new this.Password(
        authPW,
        accountRecord.authSalt,
        accountRecord.verifierVersion
      );

      const isMatchingPassword = await this.signinUtils.checkPassword(
        accountRecord,
        password,
        request.app.clientAddress
      );
      if (!isMatchingPassword) {
        throw error.incorrectPassword(accountRecord.email, emailAddress);
      }
    }

    const { uid } = accountRecord;

    if (this.config.subscriptions?.enabled && this.stripeHelper) {
      try {
        await this.stripeHelper.removeCustomer(uid, accountRecord.email);
      } catch (err) {
        if (err.message === 'Customer not available') {
          // if Stripe didn't know about the customer, no problem.
          // This should not stop the user from deleting their account.
          // See https://github.com/mozilla/fxa/issues/2900
          // https://github.com/mozilla/fxa/issues/2896
        } else {
          throw err;
        }
      }
      if (this.paypalHelper) {
        const agreementIds = await getAllPayPalBAByUid(uid);
        // Only cancelled and expired are terminal states, any others
        // should be canceled to ensure they can't be used again.
        const activeIds = agreementIds.filter((ba: any) =>
          ['active', 'pending', 'suspended'].includes(ba.status.toLowerCase())
        );
        await Promise.all(
          activeIds.map((ba) =>
            (this.paypalHelper as PayPalHelper).cancelBillingAgreement(
              ba.billingAgreementId
            )
          )
        );
        await deleteAllPayPalBAs(uid);
      }
    }

    // We fetch the devices to notify before deleteAccount()
    // because obviously we can't retrieve the devices list after!
    const devices = await this.fxaDb.devices(uid);

    await this.fxaDb.deleteAccount(accountRecord);
    this.log.info('accountDeleted.byRequest', { ...accountRecord });

    await this.oauthDb.removeTokensAndCodes(uid);

    // No need to await and block the other notifications.  The pushbox records
    // will be deleted once they expire even if they were not successfully
    // deleted here.
    this.pushbox.deleteAccount(uid).catch((err: Error) => {
      Sentry.withScope((scope) => {
        scope.setContext('pushboxDeleteAccount', { uid });
        Sentry.captureException(err);
      });
    });

    try {
      await this.push.notifyAccountDestroyed(uid, devices);
    } catch (err) {
      // Ignore notification errors since this account no longer exists
    }

    await Promise.all([
      this.log.notifyAttachedServices('delete', request, { uid }),
      request.emitMetricsEvent('account.deleted', { uid }),
    ]);

    return {};
  }
}
