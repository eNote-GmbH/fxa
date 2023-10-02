/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { test, expect } from '../../lib/fixtures/standard';

test.describe('severity-1 #smoke', () => {
  test.describe('OAuth totp', () => {
    test.beforeEach(async ({}, { project }) => {
      test.slow();
    });

    test('can add TOTP to account and confirm oauth signin', async ({
      credentials,
      pages: { login, relier, settings, totp },
    }) => {
      await settings.goto();
      await settings.totp.clickAdd();
      await totp.enable(credentials);
      await settings.signOut();

      await relier.goto();
      await relier.clickEmailFirst();
      await login.login(credentials.email, credentials.password);
      await login.setTotp(credentials.secret);

      expect(await relier.isLoggedIn()).toBe(true);
    });

    test('can remove TOTP from account and skip confirmation', async ({
      credentials,
      pages: { login, relier, settings, totp },
    }) => {
      await settings.goto();
      await settings.totp.clickAdd();
      await totp.enable(credentials);

      await settings.totp.clickDisable();
      await settings.clickModalConfirm();
      await settings.waitForAlertBar();
      let status = await settings.totp.statusText();
      expect(status).toEqual('Not Set');

      await relier.goto();
      await relier.clickEmailFirst();
      await login.login(credentials.email, credentials.password);

      expect(await relier.isLoggedIn()).toBe(true);
    });
  });
});
