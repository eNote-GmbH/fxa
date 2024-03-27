/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { test, expect, password } from '../../lib/fixtures/standard';

let email;

test.describe('severity-1 #smoke', () => {
  test.describe('Sign up with code', () => {
    test.use({
      emailOptions: [{ password }],
    });
    test.beforeEach(async ({ pages: { configPage, login } }) => {
      const config = await configPage.getConfig();
      test.skip(
        config.showReactApp.signUpRoutes === true,
        'these tests are specific to backbone, skip if serving React version'
      );
      test.slow();
    });

    test('bounced email', async ({
      emails,
      credentials,
      target,
      page,
      pages: { login },
    }) => {
      const [email] = emails;
      const client = await login.getFxaClient(target);
      await page.goto(target.contentServerUrl);
      await login.fillOutFirstSignUp(email, password);

      await target.auth.accountDestroy(
        email,
        password,
        {},
        credentials.sessionToken
      );
      await login.waitForPasswordHeader();
    });

    test('valid code then click back', async ({
      emails,
      target,
      page,
      pages: { login },
    }) => {
      const [email] = emails;
      await page.goto(target.contentServerUrl, {
        waitUntil: 'load',
      });
      await login.fillOutFirstSignUp(email, password, {
        waitForNavOnSubmit: false,
      });
      await page.goBack({ waitUntil: 'load' });
      expect(await login.isUserLoggedIn()).toBe(true);
    });

    test('invalid code', async ({
      emails,
      target,
      page,
      pages: { login, signinTokenCode },
    }) => {
      const [email] = emails;
      await page.goto(target.contentServerUrl, {
        waitUntil: 'load',
      });
      await login.fillOutFirstSignUp(email, password, { verify: false });
      await login.setCode('1234');
      await signinTokenCode.clickSubmitButton();
      expect(await login.getTooltipError()).toContain(
        'Invalid or expired confirmation code'
      );
    });
  });
});
