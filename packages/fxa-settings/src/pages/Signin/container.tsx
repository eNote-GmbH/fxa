/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { ReactElement, useEffect, useState } from 'react';
import { RouteComponentProps } from '@reach/router';
import { Integration, useAuthClient } from '../../models';
import { useFinishOAuthFlowHandler } from '../../lib/oauth/hooks';
import Signin from '.';
import { MozServices } from '../../lib/types';
import { GET_BASIC_ACCOUNT } from './gql';
import { useLazyQuery } from '@apollo/client';
import LoadingSpinner from 'fxa-react/components/LoadingSpinner';
import { LoggedInAccountData, SigninSubmitData } from './interfaces';
import { logPageViewEvent, logViewEvent } from '../../lib/metrics';
import { REACT_ENTRYPOINT } from '../../constants';

export const viewName = 'signin';

const SigninContainer = ({
  // TODO figure out why getting the email from localStorage isn't working
  email = 'dummy@gmail.com',
  integration,
}: {
  email?: string;
  integration: Integration;
} & RouteComponentProps) => {
  // TODO change to Glean once enabled
  // GleanMetrics.login.view();

  logPageViewEvent(viewName, REACT_ENTRYPOINT);

  const authClient = useAuthClient();
  const { finishOAuthFlowHandler, oAuthDataError } = useFinishOAuthFlowHandler(
    authClient,
    integration
  );
  // Temporary values
  const serviceName = MozServices.Default;
  const [loggedInAccount, setLoggedInAccount] = useState<LoggedInAccountData>();
  const [bannerErrorMessage, setBannerErrorMessage] = useState<
    string | ReactElement
  >('');

  // TODO BEFORE RENDER
  // gather account from all possible sources (localStorage, params, gql)
  // if there's no account data/email - navigate to `/`
  // if we've retrieved account data but linkedAccount and/or hasPassword are undefined,
  // check account status

  // Retrieve account data from logged in account (if any)
  // This provides logged-in account's email, avatar, passwordCreated, linkedAccount, metricsEnabled
  // TODO replace with useQuery? lazyQuery might not be needed here
  // TODO will need polling to update/redirect if the user logs out from a different tab
  const [getBasicAccount, { data: basicAccount }] =
    useLazyQuery(GET_BASIC_ACCOUNT);

  useEffect(() => {
    !basicAccount && getBasicAccount();
    basicAccount && setLoggedInAccount(basicAccount.account);
  }, [getBasicAccount, basicAccount]);

  // TODO: Handle oAuthDataError in FXA-8106
  oAuthDataError && console.log(oAuthDataError);

  // If a previously authenticated account was found locally and it had opted
  // out of data collection
  if (loggedInAccount && loggedInAccount.metricsEnabled === false) {
    // TODO when FXA-8016 is merged
    //   GleanMetrics.setEnabled(false);
  }

  // From Lauren:
  // We’ll have to manually update the cache for auth-client API calls similar to what we’re doing now in Account.
  // I don’t think we can automatically read from the cache using auth-client, but we might be able to check
  // the cache first and perform the call if the data doesn’t exist and then store it in the cache

  // **NOTES FROM CONTENT_SERVER**
  // TODO Redirect to '/' if there is no account and/or no account email

  // We need an explicit call here in case a user directly navigates to
  // /signin or they're redirected, e.g. when directly accessing settings.
  // However, we don't want to call this if the previous enter email screen
  // already called this, verified the account exists, and set the third party
  // auth data because of rate limiting on the POST account/status endpoint.
  // We can't use account/status GET since we don't always have the uid.
  //     if (
  //       account &&
  //       (account.get('hasLinkedAccount') === undefined ||
  //         account.get('hasPassword') === undefined)
  //     ) {
  //       return account.checkAccountStatus().catch(() => {
  // Unlikely, but if this errors, it's probably due to rate limiting,
  // see note above. Regardless, don't block the user from proceeding
  // because this check failed, and assume they have a password set
  // (since most users do) via defaults set in setInitialContext.
  // See https://github.com/mozilla/fxa/pull/15456#discussion_r1237799514
  //       });
  //     }
  //   },

  //   logView() {
  //     GleanMetrics.login.view();
  //     return FormView.prototype.logView.call(this);
  //   },

  /**
   * Determine if the user must be asked for a password to use the logged in account
   */
  const isPasswordNeeded = () => {
    // TODO If the account doesn't have a sessionToken, we'll need a password

    // TODO If the account doesn't yet have an email address, we'll need a password too.
    // how do we get in this state of having a logged in account that doesn't have an email?
    if (loggedInAccount && !loggedInAccount.primaryEmail) {
      return true;
    }

    // TODO If the relier wants keys, then the user must authenticate and the password must be requested.
    // This includes sync, which must skip the login chooser at all cost

    // TODO If relier is OAuth and is requesting `prompt=login`, we'll need a password

    // TODO If a prefill email does not match the logged in account email, we'll need a password
    // TODO verify which email takes precedence (logged in trumps prefill?)

    // If none of that is true, it's safe to proceed without asking for the password.
    return false;
  };

  /**
   * Sign in without a password, when `isPasswordNeeded` returns false
   * Requires a sessionToken
   */
  const signinWithLoggedInAccount = () => {
    // TODO set the formPrefill email in case sign in fails
    // verify if this should still be done in React app

    // If there's no logged in account data, abort
    if (!loggedInAccount) {
      return;
    }

    try {
      // TODO check account.accountProfile
      // account.accountProfile()
      // TODO check if the profile has TOTP enabled for cached accounts -
      // if it does, set the verification method
      // if (
      //     profile.authenticationMethods &&
      //     profile.authenticationMethods.includes('otp')
      //   ) {
      //     account.set('verificationMethod', VerificationMethods.TOTP_2FA);
      //   }
      // TODO signin with account, null password and onSuccess option
      // When using a cached credential, the auth-server routes do not get hit,
      // completion event must be emitted here
      //   onSuccess: () => logEvent('cached.signin.success')
    } catch (err) {
      // Session was invalid. Set a SESSION EXPIRED error on the model
      // causing an error to be displayed when the view re-renders
      // due to the sessionToken update.
      // if (AuthErrors.is(err, 'INVALID_TOKEN')) {
      //     account.discardSessionToken();
      //     this.model.set('error', AuthErrors.toError('SESSION_EXPIRED'));
      //   } else {
      //     throw err;
      //   }
    }
  };

  /**
   * Sign in a user
   */
  const signIn = async () =>
    // account (incl sessionToken), password, options (incl unblockCode, onSuccess)
    {
      // TODO Handle Signin Impossible
      // IF:
      // - no account initialized
      // - default account
      // - no sessionToken or password
      // THEN throw unexpected error (or navigate to '/'?)

      try {
        // TODO invokeBrokerMethod('beforeSignIn', account)
        // TODO log metrics event for signin attempt (atte)
        // TODO check verification method
        // - either get the logged in account verification method
        // - default to EMAIL_2FA
        // - if OAuth client requesting 2FA, set to TOTP_2FA
        // TODO Discard session token if signin is expected to generate a fresh token
        // Some brokers (e.g. Sync) hand off control of the sessionToken, and hence expect
        // each signin to generate a fresh token.  Make sure that will happen.
        // if (account has sessionToken and integration does NOT allow 'reuseExistingSession')
        // then *discardSessionToken*
        // TODO *signInAccount* with account, password, integration, resume token, unblock code,
        // verification method
        // a resume token is passed in to allow unverified account or session users
        // to complete email verification
        // TODO clear formPrefill if it exists
        // TODO if accountNeedsPermission
        // navigate to 'signin_permissions' with account and onSignInSuccess
        // TODO if shouldOfferToSync
        // (flows that are part of the browser relier and do not pass a service
        // are asked if they want to sync, but don't ask to specify data choices via CWTS)
        // see https://github.com/mozilla/fxa/issues/3083 for details
        // then navigate to 'would_you_like_to_sync' with account, skipCWTS=true, onSignInSuccess
        // TODO execute onSuccess if it's a function
        // then execute *onSignInSuccess* with account
      } catch (err) {
        // TODO handle errors

        // if THROTTLED or REQUEST_BLOCKED
        // then *onSignInBlocked* with account, password, err

        // if EMAIL_HARD_BOUNCE or EMAIL_SENT_COMPLAINT
        // then navifate to signin_bounced with email

        // if TOTP_REQUIRED or INSUFFICIENT_ACR_VALUES or MISMATCH_ACR_VALUES
        // then navigate to 'inline_totp_setup' with account and onSignInSuccess

        // TODO error handling for other errors?
        // need to rethrow?
        throw err;
      }
    };

  // What to do if sign in is blocked
  const onSignInBlocked = async () =>
    // account, password, err
    {
      // IF err.verificationReason === VerificationReasons.SIGN_IN
      // or err.verificationReason === VerificationMethods.EMAIL_CAPTCHA
      // THEN signin is blocked AND can be unblocked
      // try *sendUnblockEmail* and navigate to 'signin_unblock' with account, currentPage path and password
      // catch sendUnblockEmail errors - could be rate limited
      // If it is, the error should be displayed on this screen
      // and the user shouldn't even have the chance to continue.
      // ELSE if error is something else, signin cannot be unblocked
      // throw err;
    };

  const onSignInSuccess = () =>
    // account
    {
      // IF account is not verified, get verificationMethod and verificationReason from account
      // - if reason === (SIGN_IN or CHANGE_PASSWORD) and method === EMAIL
      //   then navigate to 'confirm_signin' with account
      // - if reason === (SIGN_IN or CHANGE_PASSWORD) and method === EMAIL_OTP
      //   - if *isInPushLoginExperiment* navigate to '/push/send_login'
      //   - else navigate to 'signin_token_code' with account
      // - if reason === (SIGN_IN or CHANGE_PASSWORD) and method === TOTP_2FA
      //   then navigate to 'signin_totp_code' with account
      // - if reason === (SIGN_UP) and method === EMAIL_OTP
      //   then navigate to 'confirm_signup_code' with account
      // - if reason === SIGN_UP and method === 'undefined'
      //   // cached signin with an unverified account. A code
      //   // is not re-sent automatically, so send a new one
      //   // and then go to the confirm screen.
      //   then *verifySessionResendCode* and navigate to 'confirm_signup_code' with account
      // - else navigate to 'confirm' with account
      // // If the account's uid changed, update the relier model or else
      // // the user can end up in a permanent "Session Expired" state
      // // when signing into Sync via force_auth. This occurs because
      // // Sync opens force_auth with a uid. The uid could have changed. We
      // // sign the user in here with the new uid, then attempt to do
      // // other operations with the old uid. Not all brokers support
      // // uid changes, so only make the update if the broker supports
      // // the change. See #3057 and #3283
      // if (
      //   account.get('uid') !== this.relier.get('uid') &&
      //   this.broker.hasCapability('allowUidChange')
      // ) {
      //   this.relier.set('uid', account.get('uid'));
      // } else if (account.get('email') !== this.relier.get('email')) {
      //   // if the broker does not support `allowUidChange`, we still
      //   // need to update `email` and `uid` otherwise login will fail
      //   // for a deleted account. See #4316
      //   this.relier.set('email', account.get('email'));
      //   this.relier.set('uid', account.get('uid'));
      // }
      // if (account.get('metricsEnabled') === false) {
      //   GleanMetrics.setEnabled(false);
      // }
      // GleanMetrics.login.success();
      // // This is the generic signin.success metric. The one
      // // true signin success metric.
      // this.logEvent('signin.success');
      // // This event is emitted whenever a user skips login
      // // confirmation, whether it was required or not.
      // this.logEvent('signin.success.skip-confirm');
      // // This event ties the signin success to a screen.
      // // Currently, can be oauth, signin, signup, signin-unblock
      // this.logViewEvent('signin.success');
      // const brokerMethod = this.afterSignInBrokerMethod || 'afterSignIn';
      // const navigateData = this.afterSignInNavigateData || {};
      // if (this.relier.get('redirectTo')) {
      //   // If `redirectTo` is specified, override the default behavior and
      //   // redirect to the requested page.
      //   const behavior = new NavigateBehavior(this.relier.get('redirectTo'));
      //   this.relier.unset('redirectTo');
      //   this.broker.setBehavior(brokerMethod, behavior, navigateData);
      // }
      // // Brokers handle all next steps.
      // return this.invokeBrokerMethod(brokerMethod, account);
    };

  const onSubmit = async ({ email, password }: SigninSubmitData) => {
    if (loggedInAccount && isPasswordNeeded() === false) {
      signinWithLoggedInAccount();
    } else {
      // TODO log metrics for login.submit
      try {
        signIn();
      } catch (err) {
        // TODO handle error
        //     if (AuthErrors.is(err, 'USER_CANCELED_LOGIN')) {
        //       this.logViewEvent('canceled');
        //       // if user canceled login, just stop
        //       return;
        //     } else if (AuthErrors.is(err, 'ACCOUNT_RESET')) {
        //       return this.notifyOfResetAccount(account);
        //     } else if (AuthErrors.is(err, 'INCORRECT_PASSWORD')) {
        //       return this.showValidationError(this.$('input[type=password]'), err);
        //     } else if (AuthErrors.is(err, 'UNABLE_TO_LOGIN_NO_PASSWORD_SET')) {
        //       return this.unsafeDisplayError(err);
      }
    }
  };

  if (!email && !loggedInAccount) {
    return <LoadingSpinner />;
  }

  return (
    <Signin
      email={loggedInAccount?.primaryEmail.email || email}
      avatar={loggedInAccount?.avatar}
      isPasswordNeeded={isPasswordNeeded()}
      {...{
        bannerErrorMessage,
        serviceName,
        integration,
        finishOAuthFlowHandler,
      }}
    />
  );
};

export default SigninContainer;
