/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { test, expect, password } from '../../lib/fixtures/standard';

test.describe('severity-1 #smoke', () => {
  test.describe('oauth permissions for trusted reliers - sign up', () => {
    test.use({
      emailOptions: [{ password: '' }],
    });
    test.beforeEach(async ({ pages: { configPage, login } }) => {
      const config = await configPage.getConfig();
      test.skip(
        config.showReactApp.signUpRoutes === true,
        'these tests are specific to backbone, skip if seeing React version'
      );
      test.slow();
    });

    test('signup without `prompt=consent`', async ({
      emails,
      pages: { login, relier },
    }) => {
      const [email] = emails;
      console.log(password);
      await relier.goto();
      await relier.clickEmailFirst();
      await login.fillOutFirstSignUp(email, password, { verify: false });

      //no permissions asked for, straight to confirm
      await expect(login.signUpCodeHeader()).toBeVisible();
    });

    test('signup with `prompt=consent`', async ({
      emails,
      target,
      page,
      pages: { login, relier },
    }) => {
      const [email] = emails;
      const query = { prompt: 'consent' };
      const queryParam = new URLSearchParams(query);
      await page.goto(`${target.relierUrl}/?${queryParam.toString()}`, {
        waitUntil: 'load',
      });
      await relier.clickEmailFirst();
      await login.fillOutFirstSignUp(email, password, { verify: false });

      //Verify permissions header
      expect(await login.permissionsHeader()).toBe(true);
      await login.acceptOauthPermissions();

      //Verify sign up code header
      expect(login.signUpCodeHeader()).toBeVisible();
    });
  });

  test.describe('oauth permissions for trusted reliers - sign in', () => {
    test.beforeEach(async ({ pages: { login } }) => {
      test.slow();
      await login.clearCache();
    });

    test('signin without `prompt=consent`', async ({
      credentials,
      pages: { login, relier },
    }) => {
      await relier.goto();
      await relier.clickEmailFirst();
      await login.fillOutEmailFirstSignIn(
        credentials.email,
        credentials.password
      );

      //Verify logged in to relier
      expect(await relier.isLoggedIn()).toBe(true);
    });

    test('signin with `prompt=consent`', async ({
      target,
      page,
      credentials,
      pages: { login, relier },
    }) => {
      const query = { prompt: 'consent' };
      const queryParam = new URLSearchParams(query);
      await page.goto(`${target.relierUrl}/?${queryParam.toString()}`, {
        waitUntil: 'load',
      });
      await relier.clickEmailFirst();
      await login.fillOutEmailFirstSignIn(
        credentials.email,
        credentials.password
      );

      //Verify permissions header
      expect(await login.permissionsHeader()).toBe(true);
      await login.acceptOauthPermissions();

      //Verify logged in to relier
      expect(await relier.isLoggedIn()).toBe(true);
    });

    test('signin without `prompt=consent`, then re-signin with `prompt=consent`', async ({
      target,
      page,
      credentials,
      pages: { login, relier },
    }) => {
      await relier.goto();
      await relier.clickEmailFirst();
      await login.fillOutEmailFirstSignIn(
        credentials.email,
        credentials.password
      );

      //Verify logged in to relier
      expect(await relier.isLoggedIn()).toBe(true);
      await relier.signOut();
      const query = { prompt: 'consent' };
      const queryParam = new URLSearchParams(query);
      await page.goto(`${target.relierUrl}/?${queryParam.toString()}`, {
        waitUntil: 'load',
      });
      await relier.clickEmailFirst();
      await login.clickSignIn();

      //Verify permissions header
      expect(await login.permissionsHeader()).toBe(true);
      await login.acceptOauthPermissions();

      //Verify logged in to relier
      expect(await relier.isLoggedIn()).toBe(true);
    });

    test('force_auth without `prompt=consent`', async ({
      credentials,
      pages: { login, relier },
    }) => {
      await relier.goto(`email=${credentials.email}`);
      await relier.clickForceAuth();
      await login.setPassword(credentials.password);
      await login.submit();

      //Verify logged in to relier
      expect(await relier.isLoggedIn()).toBe(true);
    });

    test('force_auth with `prompt=consent`', async ({
      target,
      page,
      credentials,
      pages: { login, relier },
    }) => {
      const query = new URLSearchParams({
        prompt: 'consent',
        email: credentials.email,
      });
      await page.goto(`${target.relierUrl}/?${query.toString()}`);
      await relier.clickForceAuth();
      await login.setPassword(credentials.password);
      await login.submit();

      //Verify permissions header
      expect(await login.permissionsHeader()).toBe(true);
      await login.acceptOauthPermissions();

      //Verify logged in to relier
      expect(await relier.isLoggedIn()).toBe(true);
    });
  });
});
