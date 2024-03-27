/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { test, expect, password } from '../../lib/fixtures/standard';

test.describe('severity-2 #smoke', () => {
  test.describe('signin blocked', () => {
    test.use({
      emailOptions: [
        { password: '' },
        { prefix: 'blocked{id}', password: '' },
        { prefix: 'blocked{id}', password: '' },
        { prefix: 'blocked{id}', password: '' },
      ],
    });

    test.beforeEach(async ({ emails, target, pages: { login } }) => {
      test.slow(); //This test has steps for email rendering that runs slow on stage
      const [email, blockedEmail, newEmail, unverifiedEmail] = emails;
      await target.auth.signUp(blockedEmail, password, {
        lang: 'en',
        preVerified: 'true',
      });
      await target.auth.signUp(email, password, {
        lang: 'en',
        preVerified: 'true',
      });
      await target.auth.signUp(unverifiedEmail, password, {
        lang: 'en',
        preVerified: 'false',
      });
    });

    test('valid code entered', async ({
      emails,
      target,
      page,
      pages: { login },
    }) => {
      const [email, blockedEmail, newEmail, unverifiedEmail] = emails;
      await page.goto(target.contentServerUrl, {
        waitUntil: 'load',
      });
      await login.fillOutEmailFirstSignIn(blockedEmail, password);

      //Verify sign in block header
      expect(login.signInUnblockHeader()).toBeVisible();
      expect(await login.getUnblockEmail()).toContain(blockedEmail);

      //Unblock the email
      await login.unblock(blockedEmail);

      //Verify logged in on Settings page
      expect(await login.isUserLoggedIn()).toBe(true);
    });

    test('incorrect code entered', async ({
      emails,
      target,
      page,
      pages: { login },
    }) => {
      const [email, blockedEmail, newEmail, unverifiedEmail] = emails;
      await page.goto(target.contentServerUrl, {
        waitUntil: 'load',
      });
      await login.fillOutEmailFirstSignIn(blockedEmail, password);

      //Verify sign in block header
      expect(login.signInUnblockHeader()).toBeVisible();
      expect(await login.getUnblockEmail()).toContain(blockedEmail);
      await login.enterUnblockCode('incorrect');

      //Verify tooltip error
      expect(await login.getTooltipError()).toContain(
        'Invalid authorization code'
      );

      //Unblock the email
      await login.unblock(blockedEmail);

      //Verify logged in on Settings page
      expect(await login.isUserLoggedIn()).toBe(true);
    });

    test('resend', async ({
      emails,
      target,
      page,
      pages: { login, resetPassword },
    }) => {
      const [email, blockedEmail, newEmail, unverifiedEmail] = emails;
      await page.goto(target.contentServerUrl, {
        waitUntil: 'load',
      });
      await login.fillOutEmailFirstSignIn(blockedEmail, password);

      //Verify sign in block header
      expect(login.signInUnblockHeader()).toBeVisible();
      expect(await login.getUnblockEmail()).toContain(blockedEmail);

      //Click resend link
      await resetPassword.clickResend();

      //Verify success message
      expect(await resetPassword.resendSuccessMessage()).toContain(
        'Email resent. Add accounts@firefox.com to your contacts to ensure a smooth delivery.'
      );

      //Unblock the email
      await login.unblock(blockedEmail);

      //Verify logged in on Settings page
      expect(await login.isUserLoggedIn()).toBe(true);
    });

    test('with primary email changed', async ({
      emails,
      target,
      page,
      pages: { login, settings, secondaryEmail },
    }) => {
      const [email, blockedEmail, newEmail, unverifiedEmail] = emails;
      await page.goto(target.contentServerUrl, {
        waitUntil: 'load',
      });
      await login.fillOutEmailFirstSignIn(email, password);

      //Verify logged in on Settings page
      expect(await login.isUserLoggedIn()).toBe(true);

      await settings.goto();
      await settings.secondaryEmail.clickAdd();
      await secondaryEmail.addAndVerify(newEmail);
      await settings.secondaryEmail.clickMakePrimary();
      await settings.signOut();

      await page.goto(target.contentServerUrl, {
        waitUntil: 'load',
      });
      await login.fillOutEmailFirstSignIn(newEmail, password);

      //Verify sign in block header
      expect(login.signInUnblockHeader()).toBeVisible();
      expect(await login.getUnblockEmail()).toContain(newEmail);

      //Unblock the email
      await login.unblock(newEmail);

      //Verify logged in on Settings page
      expect(await login.isUserLoggedIn()).toBe(true);
    });

    test('unverified', async ({ emails, target, page, pages: { login } }) => {
      test.fixme(true, 'FXA-9226');
      const [email, blockedEmail, newEmail, unverifiedEmail] = emails;
      await page.goto(target.contentServerUrl, {
        waitUntil: 'load',
      });
      await login.fillOutEmailFirstSignIn(unverifiedEmail, password);

      //Verify sign in block header
      expect(login.signInUnblockHeader()).toBeVisible();
      expect(await login.getUnblockEmail()).toContain(unverifiedEmail);

      //Unblock the email
      await login.unblock(unverifiedEmail);

      //Verify confirm code header
      expect(login.signUpCodeHeader()).toBeVisible();

      await login.fillOutSignInCode(unverifiedEmail);

      //Verify logged in on Settings page
      expect(await login.isUserLoggedIn()).toBe(true);
    });
  });
});
