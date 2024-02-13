/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { test, expect } from '../../lib/fixtures/standard';
import { getReactFeatureFlagUrl } from '../../lib/react-flag';

test.describe('force auth react', () => {
  test.beforeEach(async ({ pages: { configPage } }) => {
    test.slow();
    // Ensure that the feature flag is enabled
    const config = await configPage.getConfig();
    test.skip(config.showReactApp.signInRoutes !== true);
    test.skip(config.showReactApp.signUpRoutes !== true);
  });

  test('redirects to signin with registered email', async ({
    page,
    target,
    credentials,
    pages: { signupReact, resetPasswordReact },
  }) => {
    const url = getReactFeatureFlagUrl(
      target,
      '/force_auth',
      `email=${encodeURIComponent(
        credentials.email
      )}&context=fx_desktop_v3&entrypoint=fxa_app_menu_reverify&action=email&service=sync`
    );
    await page.goto(url);
    await page.waitForURL(/\/force_auth/);

    // Verify react page has been loaded
    await page.waitForSelector('#root');
    await page.waitForSelector('input[name="password"]');

    expect(
      await page.getByText('Enter your password').toBeVisible()
    ).toBeTruthy();
    expect(await page.getByText(credentials.email).toBeVisible()).toBeTruthy();
    expect(await page.getByText('Sign in').toBeVisible()).toBeTruthy();
  });

  test('redirects to signup with unregistered email', async ({
    page,
    target,
    credentials,
    context,
    pages: { login, resetPasswordReact },
  }) => {
    const randoEmail = `rando${Math.random()}@example.com`;
    const url = getReactFeatureFlagUrl(
      target,
      '/force_auth',
      `email=${encodeURIComponent(
        randoEmail
      )}&context=fx_desktop_v3&entrypoint=fxa_app_menu_reverify&action=email&service=sync`
    );
    await page.goto(url);
    await page.waitForURL(/\/signup/);

    // Verify react page has been loaded
    await page.waitForSelector('#root');
    await page.waitForSelector('input[name="newPassword"]');
    await page.waitForSelector('input[name="confirmPassword"]');

    expect(
      await page.getByText('Set your password').toBeVisible()
    ).toBeTruthy();
    expect(await page.getByText(randoEmail).toBeVisible()).toBeTruthy();
    expect(await page.getByText('Create account').toBeVisible()).toBeTruthy();
  });
});
