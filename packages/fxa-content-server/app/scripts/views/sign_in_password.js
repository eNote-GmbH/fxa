/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import AccountResetMixin from './mixins/account-reset-mixin';
import { assign } from 'underscore';
import AuthErrors from '../lib/auth-errors';
import CachedCredentialsMixin from './mixins/cached-credentials-mixin';
import Cocktail from 'cocktail';
import FlowEventsMixin from './mixins/flow-events-mixin';
import FormPrefillMixin from './mixins/form-prefill-mixin';
import FormView from './form';
import GleanMetrics from '../lib/glean';
import PasswordMixin from './mixins/password-mixin';
import preventDefaultThen from './decorators/prevent_default_then';
import ServiceMixin from './mixins/service-mixin';
import SignedInNotificationMixin from './mixins/signed-in-notification-mixin';
import SignInMixin from './mixins/signin-mixin';
import Template from 'templates/sign_in_password.mustache';
import ThirdPartyAuthMixin from './mixins/third-party-auth-mixin';
import ThirdPartyAuth from '../templates/partial/third-party-auth.mustache';
import UserCardMixin from './mixins/user-card-mixin';
import PocketMigrationMixin from './mixins/pocket-migration-mixin';

const SignInPasswordView = FormView.extend({
  template: Template,

  events: assign({}, FormView.prototype.events, {
    'click #use-different': preventDefaultThen('useDifferentAccount'),
  }),

  useDifferentAccount() {
    // a user who came from an OAuth relier and was
    // directed directly to /signin will not be able
    // to go back. Send them directly to `/` with the
    // account. The email will be prefilled on that page.
    this.clearInput();
    this.navigate('/', { account: this.getAccount() });
  },

  getAccount() {
    return this.model.get('account');
  },

  beforeRender() {
    const account = this.getAccount();
    if (!account || !account.get('email')) {
      this.navigate('/');
    }

    // If a previously authenticated account was found locally and it had opted
    // out of data collection
    if (account && account.get('metricsEnabled') === false) {
      GleanMetrics.setEnabled(false);
    }
  },

  setInitialContext(context) {
    const account = this.getAccount();
    // TODO: account status call after implementation in FXA-7332 and retrieve if the
    // user has a third party auth linked account and which providerId(s), and if no
    // password is set (`verifierSetAt`). We will need an explicit call here in case
    // a user directly navigates to /signin or they're redirected, e.g. when directly
    // accessing settings
    const linkedAccounts = [{ providerId: 1 }];
    const hasNoPassword = true;

    const hasLinkedAccount = linkedAccounts.length > 0;
    let hasLinkedGoogleAccount = false;
    let hasLinkedAppleAccount = false;

    const hasLinkedAccountAndNoPassword = hasLinkedAccount && hasNoPassword;
    linkedAccounts.forEach((linkedAccount) => {
      if (linkedAccount.providerId === 1) {
        hasLinkedGoogleAccount = true;
      } else if (linkedAccount.providerId === 2) {
        hasLinkedAppleAccount = true;
      }
    });

    context.set({
      email: account.get('email'),
      isPasswordNeeded: this.isPasswordNeededForAccount(account),
      hasLinkedAccountAndNoPassword,
      unsafeThirdPartyAuthHTML: this.renderTemplate(ThirdPartyAuth, {
        isSignup: false,
        showGoogleLogin: hasNoPassword && hasLinkedGoogleAccount,
        showAppleLogin: hasNoPassword && hasLinkedAppleAccount,
      }),
    });
  },

  submit() {
    const account = this.getAccount();
    if (this.isPasswordNeededForAccount(account)) {
      const password = this.getElementValue('input[type=password]');
      return this.signIn(account, password).catch((error) =>
        this.onSignInError(account, password, error)
      );
    } else {
      return this.useLoggedInAccount(account);
    }
  },

  onSignInError(account, password, err) {
    if (AuthErrors.is(err, 'USER_CANCELED_LOGIN')) {
      this.logViewEvent('canceled');
      // if user canceled login, just stop
      return;
    } else if (AuthErrors.is(err, 'ACCOUNT_RESET')) {
      return this.notifyOfResetAccount(account);
    } else if (AuthErrors.is(err, 'INCORRECT_PASSWORD')) {
      return this.showValidationError(this.$('input[type=password]'), err);
    } else if (AuthErrors.is(err, 'UNABLE_TO_LOGIN_NO_PASSWORD_SET')) {
      return this.unsafeDisplayError(err);
    }

    // re-throw error, it will be handled at a lower level.
    throw err;
  },
});

Cocktail.mixin(
  SignInPasswordView,
  AccountResetMixin,
  CachedCredentialsMixin,
  FlowEventsMixin,
  FormPrefillMixin,
  PasswordMixin,
  ServiceMixin,
  SignInMixin,
  SignedInNotificationMixin,
  ThirdPartyAuthMixin,
  UserCardMixin,
  PocketMigrationMixin
);

export default SignInPasswordView;
