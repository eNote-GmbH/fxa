/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

const { registerSuite } = intern.getInterface('object');
const FunctionalHelpers = require('./lib/helpers');
const FxDesktopHelpers = require('./lib/fx-desktop');
const selectors = require('./lib/selectors');
const UA_STRINGS = require('./lib/ua-strings');

const config = intern._config;
const ENTER_EMAIL_URL = `${config.fxaContentRoot}?context=fx_ios_v1&service=sync`;
const SIGNIN_URL = `${config.fxaContentRoot}signin?context=fx_ios_v1&service=sync`;

let email;
const PASSWORD = '12345678';

const {
  clearBrowserState,
  click,
  createEmail,
  createUser,
  fillOutEmailFirstSignIn,
  fillOutSignInTokenCode,
  fillOutSignInUnblock,
  noPageTransition,
  openPage,
  testElementExists,
  testElementTextInclude,
  testElementValueEquals,
  thenify,
  type,
  visibleByQSA,
} = FunctionalHelpers;

const {
  listenForFxaCommands,
  testIsBrowserNotifiedOfMessage: testIsBrowserNotified,
  testIsBrowserNotifiedOfLogin,
} = FxDesktopHelpers;

const setupTest = thenify(function (options = {}) {
  const successSelector = options.blocked
    ? selectors.SIGNIN_UNBLOCK.HEADER
    : options.preVerified
    ? selectors.SIGNIN_TOKEN_CODE.HEADER
    : selectors.CONFIRM_SIGNUP_CODE.HEADER;

  return this.parent
    .then(createUser(email, PASSWORD, { preVerified: options.preVerified }))
    .then(
      openPage(ENTER_EMAIL_URL, selectors.ENTER_EMAIL.HEADER, {
        query: options.query,
      })
    )
    .execute(listenForFxaCommands)
    .then(fillOutEmailFirstSignIn(email, PASSWORD))
    .then(testElementExists(successSelector))
    .then(testIsBrowserNotified('can_link_account'));
});

registerSuite('FxiOS v1 signin', {
  beforeEach: function () {
    email = createEmail('sync{id}');

    return this.remote.then(clearBrowserState({ force: true }));
  },

  tests: {
    'open directly to /signin page': function () {
      return (
        this.remote
          .then(createUser(email, PASSWORD, { preVerified: true }))
          // redirected immediately to the / page
          .then(openPage(SIGNIN_URL, selectors.ENTER_EMAIL.HEADER))
      );
    },

    verified: function () {
      const forceUA = UA_STRINGS['ios_firefox_6_1'];
      const query = { forceUA };

      return (
        this.remote
          .then(createUser(email, PASSWORD, { preVerified: true }))
          .then(
            openPage(ENTER_EMAIL_URL, selectors.ENTER_EMAIL.HEADER, { query })
          )
          .execute(listenForFxaCommands)

          .then(visibleByQSA(selectors.ENTER_EMAIL.SYNC_DESCRIPTION))
          .then(type(selectors.ENTER_EMAIL.EMAIL, email))
          .then(
            click(
              selectors.ENTER_EMAIL.SUBMIT,
              selectors.SIGNIN_PASSWORD.HEADER
            )
          )
          .then(testIsBrowserNotified('can_link_account'))

          // user thinks they mistyped their email
          .then(
            click(
              selectors.SIGNIN_PASSWORD.LINK_USE_DIFFERENT,
              selectors.ENTER_EMAIL.HEADER
            )
          )
          .then(testElementValueEquals(selectors.ENTER_EMAIL.EMAIL, email))
          .then(
            click(
              selectors.ENTER_EMAIL.SUBMIT,
              selectors.SIGNIN_PASSWORD.HEADER
            )
          )

          .then(testElementValueEquals(selectors.SIGNIN_PASSWORD.EMAIL, email))
          .then(type(selectors.SIGNIN_PASSWORD.PASSWORD, PASSWORD))
          .then(testElementExists(selectors.SIGNIN_PASSWORD.SHOW_PASSWORD))
          .then(
            click(
              selectors.SIGNIN_PASSWORD.SUBMIT,
              selectors.SIGNIN_TOKEN_CODE.HEADER
            )
          )
          .then(fillOutSignInTokenCode(email, 0))
          .then(testIsBrowserNotifiedOfLogin(email, { expectVerified: false }))

          .then(testElementExists(selectors.SIGNIN_COMPLETE.HEADER))
      );
    },

    unverified: function () {
      const forceUA = UA_STRINGS['ios_firefox_6_1'];
      const query = { forceUA };

      return (
        this.remote
          .then(setupTest({ preVerified: false, query }))

          // email 0 - initial sign up email
          // email 1 - sign in w/ unverified address email
          // email 2 - "You have verified your Firefox Account"
          .then(fillOutSignInTokenCode(email, 1, { query }))

          // In Fx for iOS >= 6.1, user should redirect to the signup-complete
          // page after verification.
          .then(testElementExists(selectors.SIGNUP_COMPLETE.HEADER))
      );
    },

    'blocked, valid code entered': function () {
      email = createEmail('block{id}');
      const forceUA = UA_STRINGS['ios_firefox_6_1'];
      const query = { forceUA };

      return (
        this.remote
          .then(setupTest({ blocked: true, preVerified: true, query }))

          .then(testElementExists(selectors.SIGNIN_UNBLOCK.HEADER))
          .then(
            testElementTextInclude(selectors.SIGNIN_UNBLOCK.EMAIL_FIELD, email)
          )
          .then(fillOutSignInUnblock(email, 0))

          // about:accounts will take over post-unblock, no transition
          .then(noPageTransition(selectors.SIGNIN_UNBLOCK.HEADER))
          .then(testIsBrowserNotifiedOfLogin(email, { expectVerified: true }))
      );
    },
  },
});
