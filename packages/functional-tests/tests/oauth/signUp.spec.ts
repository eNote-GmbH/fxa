/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { test, expect, password } from '../../lib/fixtures/standard';

test.describe('severity-1 #smoke', () => {
  test.describe('Oauth sign up', () => {
    test.use({
      emailOptions: [{ password }, { prefix: 'bounced{id}', password }],
    });
    test.beforeEach(async ({ pages: { configPage, login } }) => {
      const config = await configPage.getConfig();
      if (config.showReactApp.signUpRoutes === true) {
        test.skip(
          true,
          'this test is specific to backbone, skip if serving react'
        );
      } else {
        test.slow();
      }
    });

    test('sign up', async ({ emails, pages: { login, relier } }) => {
      const [email, bouncedEmail] = emails;
      await relier.goto();
      await relier.clickEmailFirst();
      await login.fillOutFirstSignUp(email, password, { verify: false });

      //Verify sign up code header
      expect(login.signUpCodeHeader()).toBeVisible();

      await login.fillOutSignUpCode(email);

      //Verify logged in on relier page
      expect(await relier.isLoggedIn()).toBe(true);
    });

    test('signup, bounce email, allow user to restart flow but force a different email', async ({
      emails,
      target,
      pages: { login, relier, page },
    }) => {
      const [email, bouncedEmail] = emails;
      const client = await login.getFxaClient(target);

      await relier.goto();
      await relier.clickEmailFirst();
      await login.fillOutFirstSignUp(bouncedEmail, password, { verify: false });

      //Verify sign up code header
      expect(login.signUpCodeHeader()).toBeVisible();

      try {
        const accounts = await page.evaluate(() => {
          return JSON.parse(
            localStorage.getItem('__fxa_storage.accounts') || '{}'
          );
        });
        let account;
        Object.keys(accounts).forEach((uid) => {
          const foundAccount = accounts[uid];
          if (foundAccount.email === bouncedEmail) {
            account = foundAccount;
          }
        });
        await client.accountDestroy(
          bouncedEmail,
          password,
          {},
          account.sessionToken
        );
      } catch (e) {
        // ignore
      }

      //Verify error message
      expect(await login.getTooltipError()).toContain(
        'Your confirmation email was just returned. Mistyped email?'
      );

      await login.setEmail('');

      await login.fillOutFirstSignUp(email, password, { verify: false });

      //Verify sign up code header
      expect(login.signUpCodeHeader()).toBeVisible();
      await login.fillOutSignUpCode(email);

      //Verify logged in on relier page
      expect(await relier.isLoggedIn()).toBe(true);
    });
  });

  test.describe('Oauth sign up success', () => {
    test.beforeEach(async ({ pages: { login } }) => {
      test.slow();
      await login.clearCache();
    });

    test('a success screen is available', async ({
      target,
      page,
      pages: { relier },
    }, { project }) => {
      // Our production clientId for 123Done is different from localhost and stage
      const clientId =
        project.name === 'production' ? '3c32bf6654542211' : 'dcdb5ae7add825d2';
      await page.goto(`${target.contentServerUrl}/oauth/success/${clientId}`);

      //Verify oauth success header
      expect(await relier.isOauthSuccessHeader()).toBe(true);
    });
  });
});
