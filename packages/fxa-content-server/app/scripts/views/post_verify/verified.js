/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 *  Generic view to handle different post verify success screens.
 */
import Cocktail from 'cocktail';
import FlowEventsMixin from './../mixins/flow-events-mixin';
import FormView from '../form';
import ServiceMixin from '../mixins/service-mixin';
import Template from 'templates/post_verify/verified.mustache';
import VerificationReasonMixin from '../mixins/verification-reason-mixin';

const t = (msg) => msg;

const TEMPLATE_INFO = {
  SECONDARY_EMAIL_VERIFIED: {
    readyText: t(
      'Account notifications will now also be sent to %(secondaryEmail)s.'
    ),
    buttonText: t('Continue to %(serviceName)s '),
    headerId: 'fxa-secondary-email-complete-header',
    headerTitle: t('Secondary email confirmed'),
  },
};

class Verified extends FormView {
  template = Template;

  initialize(options = {}) {
    this._templateInfo =
      TEMPLATE_INFO[this.keyOfVerificationReason(options.type)];
    this.type = options.type;
  }

  setInitialContext(context) {
    const opts = {
      headerId: this._getHeaderId(),
      headerTitle: this._getEscapedHeaderTitle(),
      readyText: this._getReadyText(),
      buttonText: this._getButtonText(),
    };
    context.set(opts);
  }

  submit() {
    const account = this.getSignedInAccount();

    // TODO: We should be able to make this a little more cleaner. Ideally, we should
    // be able to pass options we need into the broker and have it transistion to correct
    // view.
    // if (this.type === 'recovery_key') {
    //   return this.invokeBrokerMethod(
    //     'afterCompleteAddPostVerifyRecovery',
    //     account
    //   );
    // }

    return this.invokeBrokerMethod('afterCompleteSignIn', account);
  }

  _getHeaderId() {
    return this._templateInfo.headerId;
  }

  _getEscapedHeaderTitle() {
    const title = this._templateInfo.headerTitle;
    // translateInTemplate HTML escapes
    return this.translateInTemplate(title);
  }

  _getReadyText() {
    const readyText = this._templateInfo.readyText;
    // translateInTemplate HTML escapes
    return this.translateInTemplate(readyText);
  }

  _getButtonText() {
    const buttonText = this._templateInfo.buttonText;
    // translateInTemplate HTML escapes
    return this.translateInTemplate(buttonText);
  }
}

Cocktail.mixin(
  Verified,
  FlowEventsMixin,
  ServiceMixin,
  VerificationReasonMixin
);

export default Verified;
