/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { test, expect, newPagesForSync } from '../../lib/fixtures/standard';
import { syncMobileBasicQueryParams } from '../../lib/query-params';

const password = 'passwordzxcv';
let syncBrowserPages;
let browserEmail: string;
let otherEmail: string;
let skipTest = false;

test.describe.configure({ mode: 'parallel' });

test.describe('fxa_status web channel message in Settings', () => {
  test.beforeEach(async ({ target, pages: { configPage } }) => {
    test.slow();
    // Ensure that the feature flag is enabled
    const config = await configPage.getConfig();
    skipTest = config.featureFlags.sendFxAStatusOnSettings !== true;
    test.skip(skipTest);

    syncBrowserPages = await newPagesForSync(target);
    const { login } = syncBrowserPages;
    browserEmail = login.createEmail();
    await target.auth.signUp(browserEmail, password, {
      lang: 'en',
      preVerified: 'true',
    });
    otherEmail = login.createEmail();
    await target.auth.signUp(otherEmail, password, {
      lang: 'en',
      preVerified: 'true',
    });
    // First we sign the browser into an account
    await login.goto('load', 'context=fx_desktop_v3&service=sync');
    await login.fillOutEmailFirstSignIn(browserEmail, password);
    // Then, we sign into a **different** account
    await login.goto();
    await login.useDifferentAccountLink();
    await login.fillOutEmailFirstSignIn(otherEmail, password);
  });
  test.afterEach(async ({ target }) => {
    if (!skipTest) {
      await syncBrowserPages.browser?.close();
      // Cleanup any accounts created during the test
      await target.auth.accountDestroy(browserEmail, password);
      await target.auth.accountDestroy(otherEmail, password);
    }
  });

  test('message is sent when loading with context = oauth_webchannel_v1', async () => {
    const { settings } = syncBrowserPages;

    // We verify that even though another email is signed in, when
    // accessing the setting with a `context=oauth_webchannel_v1` the account
    // signed into the browser takes precedence
    await settings.goto(syncMobileBasicQueryParams.toString());
    expect(await settings.primaryEmail.statusText()).toBe(browserEmail);
  });

  test('message is not sent when loading without oauth web channel context', async () => {
    const { settings } = syncBrowserPages;

    // We verify that when accessing the setting without the `context=oauth_webchannel_v1`
    // the newer account takes precedence
    await settings.goto();
    expect(await settings.primaryEmail.statusText()).toBe(otherEmail);
  });
});
