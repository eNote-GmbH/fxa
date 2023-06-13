/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { test, expect } from '../../lib/fixtures/standard';

const password = 'password12345678';
let email;

test.describe('signin here', () => {
  test.beforeEach(async ({ target, pages: { login } }) => {
    test.slow();
    email = login.createEmail();
    await target.auth.signUp(email, password, {
      lang: 'en',
      preVerified: 'true',
    });
  });

  test.afterEach(async ({ target }) => {
    if (email) {
      // Cleanup any accounts created during the test
      try {
        await target.auth.accountDestroy(email, password);
      } catch (e) {
        // Handle the error here
        console.error('An error occurred during account cleanup:', e);
        // Optionally, rethrow the error to propagate it further
        throw e;
      }
    }
  });

  test('signin verified with incorrect password, click `forgot password?`', async ({
    target,
    page,
    pages: { login, resetPassword },
  }) => {
    await page.goto(target.contentServerUrl);
    await login.setEmail(email);
    await login.clickSubmit();
    await login.setPassword('incorrect password');
    await login.clickSubmit();

    // Verify the error
    expect(await login.getTooltipError()).toContain('Incorrect password');

    //Click forgot password link
    await login.clickForgotPassword();

    //Verify reset password header
    expect(await resetPassword.resetPasswordHeader()).toBe(true);
  });

  test('signin with email with leading/trailing whitespace on the email', async ({
    target,
    page,
    pages: { login },
  }) => {
    const emailWithSpace = '   ' + email;
    await page.goto(target.contentServerUrl);
    await login.fillOutEmailFirstSignIn(emailWithSpace, password);

    // Verify the header after login
    expect(await login.loginHeader()).toBe(true);

    // Need to clear the cache to get the new email
    await login.clearCache();

    await page.goto(target.contentServerUrl);
    const emailWithoutSpace = email + '  ';
    await login.fillOutEmailFirstSignIn(emailWithoutSpace, password);

    // Verify the header after login
    expect(await login.loginHeader()).toBe(true);
  });

  test('signin verified with password that incorrectly has leading whitespace', async ({
    target,
    page,
    pages: { login },
  }) => {
    await page.goto(target.contentServerUrl);
    await login.setEmail(email);
    await login.clickSubmit();
    await login.setPassword(' ' + password);
    await login.clickSubmit();

    // Verify the error
    expect(await login.getTooltipError()).toContain('Incorrect password');
  });

  test('login as an existing user', async ({
    target,
    page,
    pages: { login, settings },
  }) => {
    await page.goto(target.contentServerUrl);
    await login.fillOutEmailFirstSignIn(email, password);

    // Verify the header after login
    expect(await login.loginHeader()).toBe(true);

    // Sign out
    await settings.signOut();

    // Login as existing user
    await login.setEmail(email);
    await login.clickSubmit();
    await login.setPassword(password);
    await login.clickSubmit();

    // Verify the header after login
    expect(await login.loginHeader()).toBe(true);
  });
});
