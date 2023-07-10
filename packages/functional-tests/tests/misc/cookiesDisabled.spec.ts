/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { test, expect } from '../../lib/fixtures/standard';

//Add `disable_local_storage` to the URL to synthesize cookies being disabled.
test.describe('cookies disabled', () => {
  test.beforeEach(async ({ pages: { login } }) => {
    test.slow();
    await login.clearCache();
  });

  test('visit signup page with localStorage disabled', async ({
    target,
    page,
    pages: { cookiesDisabled },
  }) => {
    //Goto cookies disabled url
    await page.goto(`${target.contentServerUrl}?disable_local_storage=1`);

    //Adding the timeout as the page closes before loading
    await page.waitForTimeout(500);

    //Verify the Cookies disabled header
    expect(await cookiesDisabled.isCookiesDisabledHeader()).toBe(true);

    //Click retry
    await cookiesDisabled.clickRetry();

    //Verify the error
    expect(await cookiesDisabled.isCookiesDiabledError()).toBe(true);
  });

  test('synthesize enabling cookies by visiting the enter email page, then cookies_disabled, then clicking "try again', async ({
    target,
    page,
    pages: { cookiesDisabled, login },
  }) => {
    //Goto cookies enabled url
    await page.goto(target.contentServerUrl, {
      waitUntil: 'load',
    });

    //Verify Email header
    expect(await login.isEmailHeader()).toBe(true);

    //Goto cookies disabled url
    await page.goto(`${target.contentServerUrl}/cookies_disabled`, {
      waitUntil: 'load',
    });

    //Adding the timeout as the page closes before loading
    await page.waitForTimeout(500);

    //Verify the Cookies disabled header
    expect(await cookiesDisabled.isCookiesDisabledHeader()).toBe(true);

    //Click retry
    await cookiesDisabled.clickRetry();
    await page.waitForLoadState();

    //Verify Email header
    expect(await login.isEmailHeader()).toBe(true);
  });

  test('visit verify page with localStorage disabled', async ({
    target,
    page,
    pages: { cookiesDisabled, login },
  }) => {
    //Goto cookies enabled url
    await page.goto(
      `${target.contentServerUrl}/verify_email?disable_local_storage=1&uid=240103bbecd645848103021e7d245bcb&code=fc46f44802b2a2ce979f39b2187aa1c0`,
      {
        waitUntil: 'load',
      }
    );

    //Adding the timeout as the page closes before loading
    await page.waitForTimeout(500);

    //Verify the Cookies disabled header
    expect(await cookiesDisabled.isCookiesDisabledHeader()).toBe(true);
  });
});
