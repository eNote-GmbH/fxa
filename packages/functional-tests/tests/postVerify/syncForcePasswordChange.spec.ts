/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {
  test as base,
  expect,
  newPagesForSync,
} from '../../lib/fixtures/standard';
let email;
const password = 'password';
const newPassword = 'new_password';

const test = base.extend({
  syncBrowserPages: async ({ target }, use) => {
    const syncBrowserPages = await newPagesForSync(target);

    await use(syncBrowserPages);

    await syncBrowserPages.browser?.close();
  },
});

test.describe('severity-2 #smoke', () => {
  test.describe('post verify - force password change sync', () => {
    test.beforeEach(async ({ target, syncBrowserPages }) => {
      const { login } = syncBrowserPages;
      email = login.createEmail('forcepwdchange{id}');
      await target.auth.signUp(email, password, {
        lang: 'en',
        preVerified: 'true',
      });
    });

    test.afterEach(async ({ target }) => {
      if (email) {
        // Cleanup any accounts created during the test
        await target.auth.accountDestroy(email, newPassword);
      }
    });

    test('force change password on login - sync', async ({
      target,
      syncBrowserPages,
    }) => {
      const { page, login, postVerify, connectAnotherDevice } =
        syncBrowserPages;
      await page.goto(
        `${target.contentServerUrl}?context=fx_desktop_v3&service=sync`,
        {
          waitUntil: 'load',
        }
      );
      await login.fillOutEmailFirstSignIn(email, password);
      await login.fillOutSignInCode(email);

      //Verify force password change header
      expect(await postVerify.isForcePasswordChangeHeader()).toBe(true);

      //Fill out change password
      await postVerify.fillOutChangePassword(password, newPassword);
      await postVerify.submit();

      //Verify logged in on connect another device page
      await expect(connectAnotherDevice.fxaConnected).toBeEnabled();
    });
  });
});
