/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { expect, test, password } from '../../lib/fixtures/standard';

const newPassword = 'new_password';

test.describe('severity-2 #smoke', () => {
  test.describe('post verify - force password change sync', () => {
    test.use({
      emailOptions: [{ prefix: 'forcepwdchange{id}', password, newPassword }],
    });
    test.beforeEach(async ({ emails, target, syncBrowserPages: { login } }) => {
      const [email] = emails;
      await target.auth.signUp(email, password, {
        lang: 'en',
        preVerified: 'true',
      });
    });

    test('force change password on login - sync', async ({
      emails,
      target,
      syncBrowserPages,
    }) => {
      const [email] = emails;
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
