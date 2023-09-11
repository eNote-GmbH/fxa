/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { expect, test } from '../../lib/fixtures/standard';
import { EmailHeader, EmailType } from '../../lib/email';

const PASSWORD = 'passwordzxcv';

test.describe('signup react', () => {
  let email;
  test.beforeEach(async ({ pages: { login } }) => {
    test.slow();
    // Ensure that the feature flag is enabled
    const config = await login.getConfig();
    test.skip(config.showReactApp.signupRoutes !== true);

    email = login.createEmail('signup_react{id}');
  });

  test.afterEach(async ({ target }) => {
    if (email) {
      // Cleanup any accounts created during the test
      try {
        await target.auth.accountDestroy(email, PASSWORD);
      } catch (e) {
        // Ignore errors
      }
    }
  });

  test('signup web', async ({ page, target, pages: { signupReact } }) => {
    await signupReact.goto();
    await signupReact.fillOutEmailFirst(email);
    await signupReact.fillOutSignupForm(PASSWORD);

    const code = await target.email.waitForEmail(
      email,
      EmailType.verifyShortCode,
      EmailHeader.shortCode
    );

    await signupReact.fillOutCodeForm(code);

    // Verify logged into settings page
    await page.waitForURL(/settings/);
  });

  test('signup oauth', async ({ target, pages: { signupReact, relier } }) => {
    await relier.goto();
    await relier.clickEmailFirst();

    await signupReact.fillOutEmailFirst(email);
    await signupReact.fillOutSignupForm(PASSWORD);

    const code = await target.email.waitForEmail(
      email,
      EmailType.verifyShortCode,
      EmailHeader.shortCode
    );

    await signupReact.fillOutCodeForm(code);

    //Verify logged in on relier page
    expect(await relier.isLoggedIn()).toBe(true);
  });

  test('signup oauth webchannel', async ({
    page,
    target,
    credentials,
    context,
    pages: { login, resetPasswordReact },
  }) => {
    // TODO
  });

  test('signup sync', async ({
    page,
    target,
    credentials,
    context,
    pages: { login, resetPasswordReact },
  }) => {
    // TODO
  });
});
