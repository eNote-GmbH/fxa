/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { test, expect } from '../../lib/fixtures/standard';

const PASSWORD = 'Password123!';

test.describe('oauth webchannel', () => {
  test.beforeEach(async ({ pages: { login } }) => {
    await login.clearCache();
  });

  test.only('signup', async ({
    credentials,
    page,
    target,
    pages: { login },
  }) => {
    const email = login.createEmail();

    const query = new URLSearchParams({
      context: 'oauth_webchannel_v1',
    });

    await page.goto(`${target.contentServerUrl}/?${query.toString()}`, {
      waitUntil: 'networkidle',
    });

    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent('WebChannelMessageToChrome', {
          detail: JSON.stringify({
            id: 'account_updates',
            message: {
              command: 'fxaccounts:fxa_status',
              data: {
                capabilities: {
                  choose_what_to_sync: true,
                  engines: ['bookmarks', 'history'],
                },
                signedInUser: null,
              },
            },
          }),
        })
      );
    });

    await login.setEmail(email);
    await login.submit();

    // the CWTS form is on the same signup page
    expect(await login.isCWTSHeader()).toBe(true);
    expect(await login.isCWTSEngineBookmarks()).toBe(true);
    expect(await login.isCWTSEngineHistory()).toBe(true);

    await login.fillOutFirstSignUp(email, PASSWORD, true, false);
    await login.checkWebChannelMessage('fxaccounts:oauth_login');
  });

  // test('signin', async ({ credentials, page, target, pages: { login } }) => {
  //   const query = new URLSearchParams({
  //     context: 'oauth_webchannel_v1',
  //   });

  //   await page.goto(`${target.contentServerUrl}/?${query.toString()}`, {
  //     waitUntil: 'networkidle',
  //   });

  //   await page.evaluate(() => {
  //     window.dispatchEvent(
  //       new CustomEvent('WebChannelMessageToChrome', {
  //         detail: JSON.stringify({
  //           id: 'account_updates',
  //           message: {
  //             command: 'fxaccounts:fxa_status',
  //             data: {
  //               capabilities: {
  //                 engines: ['bookmarks', 'history'],
  //               },
  //               signedInUser: null,
  //             },
  //           },
  //         }),
  //       })
  //     );
  //   });

  //   const { searchParams } = new URL(page.url());
  //   expect(searchParams.has('client_id')).toBe(true);
  //   expect(searchParams.has('redirect_uri')).toBe(true);
  //   expect(searchParams.has('state')).toBe(true);
  //   expect(searchParams.has('context')).toBe(true);

  //   await login.login(credentials.email, credentials.password);

  //   await login.checkWebChannelMessage('fxaccounts:oauth_login');
  // });
});
