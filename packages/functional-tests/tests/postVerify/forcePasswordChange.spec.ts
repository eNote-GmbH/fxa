/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { test, expect, password } from '../../lib/fixtures/standard';

const newPassword = 'new_password';
let emailUserCreds;

test.describe('severity-2 #smoke', () => {
  test.describe('post verify - force password change', () => {
    test.use({
      emailOptions: [
        { prefix: 'forcepwdchange{id}', password: 'passwordzxcv' },
      ],
    });
    test.beforeEach(async ({ emails, target, pages: { login } }) => {
      test.slow();
      const [email] = emails;
      emailUserCreds = await target.auth.signUp(email, password, {
        lang: 'en',
        preVerified: 'true',
      });
    });

    test('navigate to page directly and can change password', async ({
      emails,
      target,
      pages: { page, login, postVerify },
    }) => {
      const [email] = emails;
      await page.goto(target.contentServerUrl, {
        waitUntil: 'load',
      });
      await login.fillOutEmailFirstSignIn(email, password);
      await login.fillOutSignInCode(email);

      //Verify force password change header
      expect(await postVerify.isForcePasswordChangeHeader()).toBe(true);

      //Fill out change password
      await postVerify.fillOutChangePassword(password, newPassword);
      await postVerify.submit();

      //Verify logged in on Settings page
      expect(await login.isUserLoggedIn()).toBe(true);
    });

    test('force change password on login - oauth', async ({
      emails,
      pages: { login, postVerify, relier },
    }) => {
      const [email] = emails;
      await relier.goto();
      await relier.clickEmailFirst();
      await login.fillOutEmailFirstSignIn(email, password);
      await login.fillOutSignInCode(email);

      //Verify force password change header
      expect(await postVerify.isForcePasswordChangeHeader()).toBe(true);

      //Fill out change password
      await postVerify.fillOutChangePassword(password, newPassword);
      await postVerify.submit();

      //Verify logged in on relier page
      expect(await relier.isLoggedIn()).toBe(true);
    });
  });
});
