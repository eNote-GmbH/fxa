/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { test, expect } from '../../lib/fixtures/standard';

let email;
const password = 'passwordzxcv';

test.describe('oauth permissions for trusted reliers', () => {
  test.beforeEach(async ({ pages: { login } }) => {
    test.slow();
    email = login.createEmail();
    await login.clearCache();
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

  test('signup without `prompt=consent', async ({
    pages: { login, relier },
  }) => {
    await relier.goto();
    await relier.clickEmailFirst();
    await login.fillOutFirstSignUp(email, password, false);

    //no permissions asked for, straight to confirm
    expect(await login.isSignUpCodeHeader()).toBe(true);
  });

  test('signup with `prompt=consent`', async ({
    target,
    page,
    pages: { login, relier },
  }) => {
    const query = { prompt: 'consent' };
    const queryParam = new URLSearchParams(query);
    await page.goto(`${target.relierUrl}/?${queryParam.toString()}`, {
      waitUntil: 'networkidle',
    });
    await relier.clickEmailFirst();
    await login.fillOutFirstSignUp(email, password, false);

    //Verify permissions header
    expect(await login.permissionsHeader()).toBe(true);
    await login.acceptOauthPermissions();

    //Verify sign up code header
    expect(await login.isSignUpCodeHeader()).toBe(true);
  });

  test('signin without `prompt=consent', async ({
    target,
    pages: { login, relier },
  }) => {
    await target.auth.signUp(email, password, {
      lang: 'en',
      preVerified: 'true',
    });
    await relier.goto();
    await relier.clickEmailFirst();
    await login.fillOutEmailFirstSignIn(email, password);

    //Verify logged in to relier
    expect(await relier.isLoggedIn()).toBe(true);
  });

  test('signin with `prompt=consent', async ({
    target,
    page,
    pages: { login, relier },
  }) => {
    await target.auth.signUp(email, password, {
      lang: 'en',
      preVerified: 'true',
    });
    const query = { prompt: 'consent' };
    const queryParam = new URLSearchParams(query);
    await page.goto(`${target.relierUrl}/?${queryParam.toString()}`, {
      waitUntil: 'networkidle',
    });
    await relier.clickEmailFirst();
    await login.fillOutEmailFirstSignIn(email, password);

    //Verify permissions header
    expect(await login.permissionsHeader()).toBe(true);
    await login.acceptOauthPermissions();

    //Verify logged in to relier
    expect(await relier.isLoggedIn()).toBe(true);
  });

  test('signin without `prompt=consent`, then re-signin with `prompt=consent`', async ({
    target,
    page,
    pages: { login, relier },
  }) => {
    await target.auth.signUp(email, password, {
      lang: 'en',
      preVerified: 'true',
    });
    await relier.goto();
    await relier.clickEmailFirst();
    await login.fillOutEmailFirstSignIn(email, password);

    //Verify logged in to relier
    expect(await relier.isLoggedIn()).toBe(true);
    await relier.signOut();
    const query = { prompt: 'consent' };
    const queryParam = new URLSearchParams(query);
    await page.goto(`${target.relierUrl}/?${queryParam.toString()}`, {
      waitUntil: 'networkidle',
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
    target,
    pages: { login, relier },
  }) => {
    await target.auth.signUp(email, password, {
      lang: 'en',
      preVerified: 'true',
    });
    await relier.goto(`email=${email}`);
    await relier.clickForceAuth();
    await login.setPassword(password);
    await login.submit();

    //Verify logged in to relier
    expect(await relier.isLoggedIn()).toBe(true);
  });

  test('force_auth with `prompt=consent`', async ({
    target,
    page,
    pages: { login, relier },
  }) => {
    await target.auth.signUp(email, password, {
      lang: 'en',
      preVerified: 'true',
    });
    const query = new URLSearchParams({
      prompt: 'consent',
      email: email,
    });
    await page.goto(target.relierUrl + `/?${query.toString()}`);
    await relier.clickForceAuth();
    await login.setPassword(password);
    await login.submit();

    //Verify permissions header
    expect(await login.permissionsHeader()).toBe(true);
    await login.acceptOauthPermissions();

    //Verify logged in to relier
    expect(await relier.isLoggedIn()).toBe(true);
  });
});
