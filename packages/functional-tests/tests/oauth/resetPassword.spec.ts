/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { test, expect } from '../../lib/fixtures/standard';
import { EmailHeader, EmailType } from '../../lib/email';

let email;
const password = 'passwordzxcv';
const newPassword = 'Newpassword@';

test.describe('oauth reset password', () => {
  test.beforeEach(async ({ target, pages: { login } }) => {
    test.slow();
    email = login.createEmail();
    await target.auth.signUp(email, password, {
      lang: 'en',
      preVerified: 'true',
    });
    await login.clearCache();
  });

  test.afterEach(async ({ target }) => {
    if (email) {
      // Cleanup any accounts created during the test
      try {
        await target.auth.accountDestroy(email, newPassword);
      } catch (e) {
        // Handle the error here
        console.error('An error occurred during account cleanup:', e);
        // Optionally, rethrow the error to propagate it further
        throw e;
      }
    }
  });

  test('reset password happy path', async ({
    target,
    page,
    pages: { login, relier, resetPassword },
  }) => {
    await relier.goto();
    await relier.clickEmailFirst();
    await login.setEmail(email);
    await login.submit();
    await login.clickForgotPassword();

    // Verify reset password header
    expect(await resetPassword.resetPasswordHeader()).toBe(true);

    await resetPassword.fillOutResetPassword(email);

    const link = await target.email.waitForEmail(
      email,
      EmailType.recovery,
      EmailHeader.link
    );
    await page.goto(link);

    await resetPassword.resetNewPassword(newPassword);
    expect(await resetPassword.completeResetPasswordHeader()).toBe(true);

    // Verify logged in
    expect(await relier.isLoggedIn()).toBe(true);
  });
});
