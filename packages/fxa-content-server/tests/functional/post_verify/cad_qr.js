/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

const { registerSuite } = intern.getInterface('object');
const { assert } = intern.getPlugin('chai');
const FunctionalHelpers = require('./../lib/helpers');
const selectors = require('./../lib/selectors');
const config = intern._config;

const ENTER_EMAIL_URL = `${config.fxaContentRoot}?context=fx_desktop_v3&service=sync`;
const CAD_QR_URL = `${config.fxaContentRoot}post_verify/cad_qr/get_started?context=fx_desktop_v3&service=sync`;

const PASSWORD = 'password1234567';
const TEST_DEVICE_NAME = 'Test Runner Session Device';
const TEST_DEVICE_TYPE = 'mobile';
let email, accountData, client;

const {
  clearBrowserState,
  click,
  createEmail,
  createUser,
  fillOutEmailFirstSignIn,
  openPage,
  testElementExists,
} = FunctionalHelpers;

registerSuite('cad_qr', {
  beforeEach: function () {
    email = createEmail();
    client = FunctionalHelpers.getFxaClient();
    return this.remote
      .then(clearBrowserState({ force: true }))
      .then(createUser(email, PASSWORD, { preVerified: true }))
      .then((result) => {
        accountData = result;
      });
  },

  tests: {
    'CAD via QR code': function () {
      return (
        this.remote
          .then(openPage(ENTER_EMAIL_URL, selectors.ENTER_EMAIL.HEADER))
          .then(fillOutEmailFirstSignIn(email, PASSWORD))
          .then(testElementExists(selectors.CONNECT_ANOTHER_DEVICE.HEADER))
          .then(
            openPage(
              CAD_QR_URL,
              selectors.POST_VERIFY_CAD_QR_GET_STARTED.HEADER
            )
          )
          .then(click(selectors.POST_VERIFY_CAD_QR_GET_STARTED.LATER))
          .getCurrentUrl()
          .then(function (url) {
            assert.isTrue(url.includes('mozilla.org'));
          })
          .goBack()
          .then(click(selectors.POST_VERIFY_CAD_QR_GET_STARTED.SUBMIT))

          .then(click(selectors.POST_VERIFY_CAD_QR_READY_TO_SCAN.LATER))
          .getCurrentUrl()
          .then(function (url) {
            assert.isTrue(url.includes('mozilla.org'));
          })
          .goBack()
          .then(
            testElementExists(selectors.POST_VERIFY_CAD_QR_READY_TO_SCAN.HEADER)
          )
          .then(click(selectors.POST_VERIFY_CAD_QR_READY_TO_SCAN.SUBMIT))

          .then(
            testElementExists(selectors.POST_VERIFY_CAD_QR_SCAN_CODE.HEADER)
          )

          // This page will be polling for a new device record. This typically
          // happens when the user successfully authenticates on a new
          // device.
          .then(function () {
            return client.deviceRegister(
              accountData.sessionToken,
              TEST_DEVICE_NAME,
              TEST_DEVICE_TYPE
            );
          })

          .then(
            testElementExists(selectors.POST_VERIFY_CAD_QR_CONNECTED.HEADER)
          )
      );
    },
  },
});
