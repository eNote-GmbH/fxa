/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

const { registerSuite } = intern.getInterface('object');
const FunctionalHelpers = require('./lib/helpers');
const selectors = require('./lib/selectors');

const ENTER_EMAIL_URL = intern._config.fxaContentRoot;

const {
  clearBrowserState,
  click,
  createEmail,
  openPage,
  type,
} = FunctionalHelpers;

registerSuite('privacy policy', {
  beforeEach: function () {
    return this.remote.then(clearBrowserState());
  },

  tests: {
    'from signup': function () {
      return this.remote
        .then(openPage(ENTER_EMAIL_URL, selectors.ENTER_EMAIL.HEADER))
        .then(type(selectors.ENTER_EMAIL.EMAIL, createEmail()))
        .then(
          click(selectors.ENTER_EMAIL.SUBMIT, selectors.SIGNUP_PASSWORD.HEADER)
        )

        .then(
          click(
            selectors.SIGNUP_PASSWORD.PRIVACY_POLICY,
            selectors.PRIVACY_POLICY.HEADER
          )
        )
        .then(
          click(
            selectors.PRIVACY_POLICY.LINK_BACK,
            selectors.SIGNUP_PASSWORD.HEADER
          )
        );
    },
  },
});
