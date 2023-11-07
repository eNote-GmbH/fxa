/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

const { registerSuite } = intern.getInterface('object');
const FunctionalHelpers = require('../lib/helpers');
const selectors = require('../lib/selectors');
const config = intern._config;

const ENTER_EMAIL_URL = config.fxaContentRoot;
const DELETE_ACCOUNT_URL = `${config.fxaContentRoot}settings/delete_account` ;

const PASSWORD = 'password1234567';
let email;

const {
  clearBrowserState,
  click,
  createEmail,
  createUser,
  type,
  fillOutEmailFirstSignIn,
  testElementTextInclude,
  openPage,
  pollUntilHiddenByQSA,
  visibleByQSA,
  testElementExists,
} = FunctionalHelpers;

registerSuite('delete_account', {
  beforeEach: function () {
    email = createEmail();

    return this.remote
      .then(clearBrowserState({ force: true }))
      .then(createUser(email, PASSWORD, { preVerified: true }));
  },

  tests: {
    'sign in, delete account': function () {
      return (
        this.remote
          .then(openPage(ENTER_EMAIL_URL, selectors.ENTER_EMAIL.HEADER))
          .then(fillOutEmailFirstSignIn(email, PASSWORD))
          .then(testElementExists(selectors.SETTINGS.HEADER))

          // Go to delete account screen
          .then(click(selectors.SETTINGS_DELETE_ACCOUNT.DELETE_ACCOUNT_BUTTON))
          .then(testElementExists(selectors.SETTINGS_DELETE_ACCOUNT.DETAILS))

          // Intern won't click on checkboxes with SVGs on top. So click the
          // checkbox labels instead :-\
          .findAllByCssSelector(selectors.SETTINGS_DELETE_ACCOUNT.CHECKBOXES)
          .then((labels) => labels.map((label) => label.click()))
          .end()
          .then(click(selectors.SETTINGS.DELETE_ACCOUNT.SUBMIT_BUTTON))

          // enter incorrect password
          // but first, click the label to get it out of the way.
          .then(
            testElementExists(
              selectors.SETTINGS.DELETE_ACCOUNT.INPUT_PASSWORD_LABEL
            )
          )
          .then(click(selectors.SETTINGS.DELETE_ACCOUNT.INPUT_PASSWORD_LABEL))
          .then(
            type(
              selectors.SETTINGS_DELETE_ACCOUNT.INPUT_PASSWORD,
              'incorrect password'
            )
          )
          .then(click(selectors.SETTINGS_DELETE_ACCOUNT.CONFIRM))
          .then(
            visibleByQSA(
              selectors.SETTINGS_DELETE_ACCOUNT.TOOLTIP_INCORRECT_PASSWORD
            )
          )

          //enter correct password
          .then(
            type(selectors.SETTINGS_DELETE_ACCOUNT.INPUT_PASSWORD, PASSWORD)
          )
          .then(click(selectors.SETTINGS_DELETE_ACCOUNT.CONFIRM))
          .then(testElementExists(selectors.ENTER_EMAIL.HEADER))
          .then(type(selectors.ENTER_EMAIL.EMAIL, email))
          .then(click(selectors.ENTER_EMAIL.SUBMIT))
      );
    },

    'sign in, cancel delete account': function () {
      return (
        this.remote
          .then(openPage(ENTER_EMAIL_URL, selectors.ENTER_EMAIL.HEADER))
          .then(fillOutEmailFirstSignIn(email, PASSWORD))

          // Go to delete account screen
          .then(click(selectors.SETTINGS_DELETE_ACCOUNT.DELETE_ACCOUNT_BUTTON))
          .then(testElementExists(selectors.SETTINGS_DELETE_ACCOUNT.DETAILS))

          // Intern won't click on checkboxes with SVGs on top. So click the
          // checkbox labels instead :-\
          .findAllByCssSelector(selectors.SETTINGS_DELETE_ACCOUNT.CHECKBOXES)
          .then((labels) => labels.map((label) => label.click()))
          .end()
          .then(click(selectors.SETTINGS.DELETE_ACCOUNT.SUBMIT_BUTTON))

          .then(
            testElementExists(
              selectors.SETTINGS.DELETE_ACCOUNT.INPUT_PASSWORD_LABEL
            )
          )
          .then(click(selectors.SETTINGS.DELETE_ACCOUNT.INPUT_PASSWORD_LABEL))
          .then(
            type(selectors.SETTINGS_DELETE_ACCOUNT.INPUT_PASSWORD, PASSWORD)
          )
          .then(click(selectors.SETTINGS.DELETE_ACCOUNT.CANCEL_BUTTON))
          .then(pollUntilHiddenByQSA(selectors.SETTINGS_DELETE_ACCOUNT.DETAILS))
          .then(
            testElementTextInclude(selectors.SETTINGS.PROFILE_HEADER, email)
          )
      );
    },

    'navigate directly to delete account, sign in': function () {
      return (
        this.remote
          .then(openPage(DELETE_ACCOUNT_URL, selectors.ENTER_EMAIL.HEADER))
          .then(fillOutEmailFirstSignIn(email, PASSWORD))
          .then(testElementExists(selectors.SETTINGS_DELETE_ACCOUNT.DETAILS))

          // Intern won't click on checkboxes with SVGs on top. So click the
          // checkbox labels instead :-\
          .findAllByCssSelector(selectors.SETTINGS_DELETE_ACCOUNT.CHECKBOXES)
          .then((labels) => labels.map((label) => label.click()))
          .end()
          .then(click(selectors.SETTINGS.DELETE_ACCOUNT.SUBMIT_BUTTON))
          .then(
            testElementExists(
              selectors.SETTINGS.DELETE_ACCOUNT.INPUT_PASSWORD_LABEL
            )
          )
          .then(click(selectors.SETTINGS.DELETE_ACCOUNT.INPUT_PASSWORD_LABEL))
          .then(
            type(selectors.SETTINGS_DELETE_ACCOUNT.INPUT_PASSWORD, PASSWORD)
          )
          .then(click(selectors.SETTINGS_DELETE_ACCOUNT.CONFIRM))
          .then(testElementExists(selectors.ENTER_EMAIL.HEADER))
          .then(type(selectors.ENTER_EMAIL.EMAIL, email))
          .then(click(selectors.ENTER_EMAIL.SUBMIT))
      );
    },
  },
});
