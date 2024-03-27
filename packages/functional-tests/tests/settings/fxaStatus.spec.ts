/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { expect, test, password } from '../../lib/fixtures/standard';
import { oauthWebchannelV1 } from '../../lib/query-params';

let skipTest = false;

test.describe.configure({ mode: 'parallel' });

test.describe('fxa_status web channel message in Settings', () => {
  test.use({
    emailOptions: [{ password }, { password }],
  });
  test.beforeEach(
    async ({
      emails,
      target,
      pages: { configPage },
      syncBrowserPages: { login },
    }) => {
      test.slow();
      // Ensure that the feature flag is enabled
      const [email, otherEmail] = emails;
      const config = await configPage.getConfig();
      skipTest = config.featureFlags.sendFxAStatusOnSettings !== true;
      test.skip(skipTest);
      await target.auth.signUp(email, password, {
        lang: 'en',
        preVerified: 'true',
      });
      await target.auth.signUp(otherEmail, password, {
        lang: 'en',
        preVerified: 'true',
      });
      // First we sign the browser into an account
      await login.goto('load', 'context=fx_desktop_v3&service=sync');
      await login.fillOutEmailFirstSignIn(email, password);
      // Then, we sign into a **different** account
      await login.goto();
      await login.useDifferentAccountLink();
      await login.fillOutEmailFirstSignIn(otherEmail, password);
    }
  );

  test('message is sent when loading with context = oauth_webchannel_v1', async ({
    emails,
    syncBrowserPages: { settings },
  }) => {
    const [email, otherEmail] = emails;
    // We verify that even though another email is signed in, when
    // accessing the setting with a `context=oauth_webchannel_v1` the account
    // signed into the browser takes precedence
    await settings.goto(oauthWebchannelV1.toString());
    expect(await settings.primaryEmail.statusText()).toBe(email);
  });

  test('message is not sent when loading without oauth web channel context', async ({
    emails,
    syncBrowserPages: { settings },
  }) => {
    const [email, otherEmail] = emails;
    // We verify that when accessing the setting without the `context=oauth_webchannel_v1`
    // the newer account takes precedence
    await settings.goto();
    expect(await settings.primaryEmail.statusText()).toBe(otherEmail);
  });
});
