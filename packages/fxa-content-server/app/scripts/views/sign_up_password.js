/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import Cocktail from 'cocktail';
import Template from 'templates/sign_up_password.mustache';
import { assign, debounce } from 'underscore';
import AuthErrors from '../lib/auth-errors';
import preventDefaultThen from './decorators/prevent_default_then';
import FormView from './form';
import AccountSuggestionMixin from './mixins/account-suggestion-mixin';
import CoppaMixin from './mixins/coppa-mixin';
import CWTSOnSignupPasswordMixin from './mixins/cwts-on-signup-password';
import EmailOptInMixin from './mixins/email-opt-in-mixin';
import FlowEventsMixin from './mixins/flow-events-mixin';
import FormPrefillMixin from './mixins/form-prefill-mixin';
import PasswordMixin from './mixins/password-mixin';
import PasswordStrengthMixin from './mixins/password-strength-mixin';
import PocketMigrationMixin from './mixins/pocket-migration-mixin';
import ServiceMixin from './mixins/service-mixin';
import SignedInNotificationMixin from './mixins/signed-in-notification-mixin';
import SignUpMixin from './mixins/signup-mixin';
import GleanMetrics from '../lib/glean';
import BrandMessagingMixin from './mixins/brand-messaging-mixin';
import MonitorClientMixin from './mixins/monitor-client-mixin';
import ThirdPartyAuth from '../templates/partial/third-party-auth.mustache';
import ThirdPartyAuthMixin from './mixins/third-party-auth-mixin';

const t = (msg) => msg;

const PASSWORD_INPUT_SELECTOR = '#password';
const VPASSWORD_INPUT_SELECTOR = '#vpassword';
const DELAY_BEFORE_PASSWORD_CHECK_MS = 1500;

const proto = FormView.prototype;
const SignUpPasswordView = FormView.extend({
  template: Template,

  events: assign({}, FormView.prototype.events, {
    'click #use-different': preventDefaultThen('useDifferentAccount'),
  }),

  _isEmailRelayDomain(email) {
    // Checks to see if the email is a Firefox Relay email mask. Current masks are
    // @mozmail.com
    // @relay.firefox.com
    // @<any sub>.mozmail.com
    const relayMail = /@([a-zA-Z0-9.-]+\.)?(mozmail|relay\.firefox)\.(com)$/i;
    return relayMail.test(email);
  },

  useDifferentAccount() {
    // a user who came from an OAuth relier and was
    // directed directly to /signin will not be able
    // to go back. Send them directly to `/` with the
    // account. The email will be prefilled on that page.
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
    const error = this.model.get('error');
    if (error && AuthErrors.is(error, 'DELETED_ACCOUNT')) {
      error.forceMessage = t('Account no longer exists. Recreate it?');
    }
    return proto.beforeRender.call(this);
  },

  logView() {
    GleanMetrics.registration.view();
    return proto.logView.call(this);
  },

  setInitialContext(context) {
    context.set({
      canChangeAccount: !this.model.get('forceEmail'),
      email: this.getAccount().get('email'),
      unsafeThirdPartyAuthHTML: this.renderTemplate(ThirdPartyAuth, {
        showSeparator: true,
      }),
    });

    // We debounce the password check function to give the password input
    // some smarts. There will be a slight delay to show the tooltip which
    // makes the experience less janky,
    this.checkPasswordsMatchDebounce = debounce(
      this._checkPasswordsMatch,
      DELAY_BEFORE_PASSWORD_CHECK_MS
    );
  },

  isValidEnd() {
    if (!this._doPasswordsMatch()) {
      return false;
    }

    return proto.isValidEnd.call(this);
  },

  onFormChange() {
    this.checkPasswordsMatchDebounce();

    return proto.onFormChange.call(this);
  },

  showValidationErrorsEnd() {
    if (
      this.validateFormField(PASSWORD_INPUT_SELECTOR) &&
      !this._doPasswordsMatch()
    ) {
      this.showValidationError(
        this.$(VPASSWORD_INPUT_SELECTOR),
        AuthErrors.toError('PASSWORDS_DO_NOT_MATCH'),
        false
      );
    } else {
      // Called to clear validation tooltips.
      this.$(VPASSWORD_INPUT_SELECTOR).change();
    }
  },

  submit() {
    return Promise.resolve().then(() => {
      if (!this.isUserOldEnough()) {
        return this.tooYoung();
      }

      const account = this.getAccount();
      if (this.isAnyNewsletterVisible()) {
        account.set({
          newsletters: this.getOptedIntoNewsletters(),
        });
      }

      // returns null if coppa enabled, otherwise will use submitted age
      // to determine if age is >=18 at time of sign up
      account.set({ atLeast18AtReg: this.isAgeAtLeast18() });

      return this.signUp(account, this._getPassword());
    });
  },

  _getPassword() {
    return this.getElementValue(PASSWORD_INPUT_SELECTOR);
  },

  _getVPassword() {
    return this.getElementValue(VPASSWORD_INPUT_SELECTOR);
  },

  _doPasswordsMatch() {
    return this._getPassword() === this._getVPassword();
  },

  _checkPasswordsMatch() {
    if (this._getVPassword() !== '' && this._getPassword() !== '') {
      this.showValidationErrorsEnd();
    }
  },
});

Cocktail.mixin(
  SignUpPasswordView,
  CoppaMixin({
    required: true,
  }),
  CWTSOnSignupPasswordMixin,
  EmailOptInMixin,
  FlowEventsMixin,
  FormPrefillMixin,
  PasswordMixin,
  PasswordStrengthMixin({
    balloonEl: '#password-strength-balloon-container',
    passwordEl: '#password',
  }),
  ServiceMixin,
  SignedInNotificationMixin,
  ThirdPartyAuthMixin,
  SignUpMixin,
  PocketMigrationMixin,
  AccountSuggestionMixin,
  BrandMessagingMixin,
  MonitorClientMixin
);

export default SignUpPasswordView;
