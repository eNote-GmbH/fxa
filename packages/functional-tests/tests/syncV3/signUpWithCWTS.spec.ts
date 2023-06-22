/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { test } from '../../lib/fixtures/standard';
import uaStrings from '../../lib/ua-strings';
import { FirefoxCommand, createCustomEventDetail } from '../../lib/channels';

const password = 'passwordzxcv';
let email;
//let syncBrowserPages;

test.describe.configure({ mode: 'parallel' });

test.describe('Sync v3 sign up and CWTS', () => {
  test.beforeEach(async ({ target, pages: { login } }) => {
    test.slow();
    email = login.createEmail('sync{id}');
    //syncBrowserPages = await newPagesForSync(target);
    await login.clearCache();
  });

  // test.afterEach(async () => {
  //   await syncBrowserPages.browser?.close();
  // });

  // test.only('verify with signup code and CWTS', async ({ target }) => {
  //   const { page, login, signinTokenCode } =
  //     syncBrowserPages;

  test.only('verify with signup code and CWTS', async ({
    target,
    pages: { login, page, signinTokenCode },
  }) => {
    const query = new URLSearchParams({
      forceUA: uaStrings['desktop_firefox_71'],
    });
    //const customEventDetail = [
    const customEventDetail = createCustomEventDetail(
      FirefoxCommand.FxAStatus,
      {
        signedInUser: null,
        capabilities: {
          choose_what_to_sync: true,
          multiService: true,
          engines: ['history'],
        },
      }
    );
    await page.goto(
      `${
        target.contentServerUrl
      }?context=fx_desktop_v3&service=sync&action=email/?${query.toString()}`
    );
    await login.respondToWebChannelMessage(customEventDetail);
    await login.setEmail(email);
    await signinTokenCode.clickSubmitButton();
    await login.setPassword(password);
    await login.confirmPassword(password);
    await login.setAge('21');
    await signinTokenCode.clickSubmitButton();

    // the CWTS form is on the same signup page
    await login.waitForCWTSHeader();
  });
});
