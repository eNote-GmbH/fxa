/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

const { registerSuite } = intern.getInterface('object');
const FunctionalHelpers = require('./lib/helpers');
const selectors = require('./lib/selectors');

const EMAIL_FIRST_FORM_URL = intern._config.fxaContentRoot + '?action=email';

const INVALID_EMAIL = `nofxauser${Math.random()}@asdfafexample.xyz`;

const {
  clearBrowserState,
  click,
  openPage,
  testElementTextInclude,
  type,
  visibleByQSA,
} = FunctionalHelpers;

registerSuite('email domain mx record validation', {
  beforeEach() {
    return this.remote.then(clearBrowserState());
  },

  tests: {
    'no validation on a popular domain': function () {
      const email = `coolfxauser${Math.random()}@gmail.com`;

      return this.remote
        .then(openPage(EMAIL_FIRST_FORM_URL, selectors.ENTER_EMAIL.HEADER))
        .then(type(selectors.ENTER_EMAIL.EMAIL, email))
        .then(
          click(selectors.ENTER_EMAIL.SUBMIT, selectors.SIGNUP_PASSWORD.HEADER)
        );
    },

    'show validation error on invalid domain': function () {
      return this.remote
        .then(openPage(EMAIL_FIRST_FORM_URL, selectors.ENTER_EMAIL.HEADER))
        .then(type(selectors.ENTER_EMAIL.EMAIL, INVALID_EMAIL))
        .then(
          click(selectors.ENTER_EMAIL.SUBMIT, selectors.ENTER_EMAIL.TOOLTIP)
        )
        .then(visibleByQSA(selectors.ENTER_EMAIL.TOOLTIP))
        .then(
          testElementTextInclude(
            selectors.ENTER_EMAIL.TOOLTIP,
            'Mistyped email? asdfafexample.xyz does not offer email.'
          )
        );
    },

    'show tooltip on domain with an A record': function () {
      const email = `coolfxauser${Math.random()}@mail.google.com`;

      return this.remote
        .then(openPage(EMAIL_FIRST_FORM_URL, selectors.ENTER_EMAIL.HEADER))
        .then(type(selectors.ENTER_EMAIL.EMAIL, email))
        .then(
          click(
            selectors.ENTER_EMAIL.SUBMIT,
            selectors.ENTER_EMAIL.SUGGEST_EMAIL_DOMAIN_CORRECTION
          )
        )
        .then(
          testElementTextInclude(
            selectors.ENTER_EMAIL.SUGGEST_EMAIL_DOMAIN_CORRECTION,
            'Mistyped email?'
          )
        )
        .then(
          click(selectors.ENTER_EMAIL.SUBMIT, selectors.SIGNUP_PASSWORD.HEADER)
        );
    },

    'allow submission on domain with an MX record': function () {
      const email = `coolfxauser${Math.random()}@mozilla.com`;

      return this.remote
        .then(openPage(EMAIL_FIRST_FORM_URL, selectors.ENTER_EMAIL.HEADER))
        .then(type(selectors.ENTER_EMAIL.EMAIL, email))
        .then(
          click(selectors.ENTER_EMAIL.SUBMIT, selectors.SIGNUP_PASSWORD.HEADER)
        );
    },
  },
});
