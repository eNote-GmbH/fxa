/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { test, expect, newPagesForSync } from '../../lib/fixtures/standard';

const makeUid = () =>
  [...Array(32)]
    .map(() => Math.floor(Math.random() * 16).toString(16))
    .join('');

let syncBrowserPages;

test.describe.configure({ mode: 'parallel' });

test.describe('severity-1 #smoke', () => {
  test.describe('Desktop Sync V3 force auth', () => {
    test.beforeEach(async ({ target }) => {
      test.slow();
      syncBrowserPages = await newPagesForSync(target);
    });

    test.afterEach(async ({ credentials, target }) => {
      await syncBrowserPages.browser?.close();
      // try {
      //   await target.auth.accountDestroy(credentials.email, credentials.password, {}, credentials.sessionToken);
      // } catch (err) {
      //   // ignore
      // }
    });

    test('sync v3 with a registered email, no uid', async ({
      credentials,
      target,
    }) => {
      const {
        fxDesktopV3ForceAuth,
        login,
        connectAnotherDevice,
        signinTokenCode,
      } = syncBrowserPages;

      await fxDesktopV3ForceAuth.openWithReplacementParams(credentials, {
        uid: undefined,
      });
      await login.setPassword(credentials.password);
      await login.submit();
      await expect(signinTokenCode.tokenCodeHeader).toBeVisible();
      await fxDesktopV3ForceAuth.checkWebChannelMessage(
        'fxaccounts:can_link_account'
      );
      await login.fillOutSignInCode(credentials.email);
      await expect(connectAnotherDevice.fxaConnected).toBeVisible();
      await fxDesktopV3ForceAuth.checkWebChannelMessage('fxaccounts:login');
    });

    test('sync v3 with a registered email, registered uid', async ({
      credentials,
      target,
    }) => {
      const {
        fxDesktopV3ForceAuth,
        login,
        connectAnotherDevice,
        signinTokenCode,
      } = syncBrowserPages;

      await fxDesktopV3ForceAuth.open(credentials);
      await login.setPassword(credentials.password);
      await login.submit();
      await expect(signinTokenCode.tokenCodeHeader).toBeVisible();
      await fxDesktopV3ForceAuth.checkWebChannelMessage(
        'fxaccounts:can_link_account'
      );
      await login.fillOutSignInCode(credentials.email);
      await expect(connectAnotherDevice.fxaConnected).toBeVisible();
      await fxDesktopV3ForceAuth.checkWebChannelMessage('fxaccounts:login');
    });

    test('sync v3 with a registered email, unregistered uid', async ({
      credentials,
      target,
    }) => {
      const {
        fxDesktopV3ForceAuth,
        login,
        connectAnotherDevice,
        signinTokenCode,
      } = syncBrowserPages;

      const uid = makeUid();
      await fxDesktopV3ForceAuth.openWithReplacementParams(credentials, {
        uid,
      });
      await fxDesktopV3ForceAuth.noSuchWebChannelMessage('fxaccounts:logout');
      await login.setPassword(credentials.password);
      await login.submit();
      await expect(signinTokenCode.tokenCodeHeader).toBeVisible();
      await fxDesktopV3ForceAuth.checkWebChannelMessage(
        'fxaccounts:can_link_account'
      );
      await login.fillOutSignInCode(credentials.email);
      await expect(connectAnotherDevice.fxaConnected).toBeVisible();
      await fxDesktopV3ForceAuth.checkWebChannelMessage('fxaccounts:login');
    });

    test('sync v3 with an unregistered email, no uid', async ({
      credentials,
      pages: { configPage },
    }) => {
      const config = await configPage.getConfig();
      test.skip(
        config.showReactApp.signUpRoutes === true,
        'force_auth is no longer supported for signup with react'
      );
      const { fxDesktopV3ForceAuth, login } = syncBrowserPages;

      const email = `sync${Math.random()}@restmail.net`;
      await fxDesktopV3ForceAuth.openWithReplacementParams(credentials, {
        email,
        uid: undefined,
      });
      const error = await login.signInError();
      expect(error).toContain('Recreate');
      const emailInputValue = await login.getEmailInput();
      expect(emailInputValue).toBe(email);
      const emailInput = await login.getEmailInputElement();
      expect(emailInput).toBeDisabled();
      await expect(
        await (await login.getUseDifferentAccountLink()).count()
      ).toEqual(0);
      await login.fillOutFirstSignUp(email, credentials.password, {
        enterEmail: false,
      });
      await fxDesktopV3ForceAuth.checkWebChannelMessage(
        'fxaccounts:can_link_account'
      );
      await fxDesktopV3ForceAuth.checkWebChannelMessage('fxaccounts:login');
    });

    test('sync v3 with an unregistered email, registered uid', async ({
      credentials,
      pages: { configPage },
    }) => {
      const config = await configPage.getConfig();
      test.skip(
        config.showReactApp.signUpRoutes === true,
        'force_auth is no longer supported for signup with react'
      );
      const { fxDesktopV3ForceAuth, login } = syncBrowserPages;

      const email = `sync${Math.random()}@restmail.net`;
      await fxDesktopV3ForceAuth.openWithReplacementParams(credentials, {
        email,
      });
      const error = await login.signInError();
      expect(error).toContain('Recreate');
      const emailInputValue = await login.getEmailInput();
      expect(emailInputValue).toBe(email);
      const emailInput = await login.getEmailInputElement();
      expect(emailInput).toBeDisabled();
      await expect(
        await (await login.getUseDifferentAccountLink()).count()
      ).toEqual(0);
    });

    test('sync v3 with an unregistered email, unregistered uid', async ({
      credentials,
      pages: { configPage },
    }) => {
      const config = await configPage.getConfig();
      test.skip(
        config.showReactApp.signUpRoutes === true,
        'force_auth is no longer supported for signup with react'
      );
      const { fxDesktopV3ForceAuth, login } = syncBrowserPages;

      const email = `sync${Math.random()}@restmail.net`;
      const uid = makeUid();
      await fxDesktopV3ForceAuth.openWithReplacementParams(credentials, {
        email,
        uid,
      });
      const error = await login.signInError();
      expect(error).toContain('Recreate');
      const emailInputValue = await login.getEmailInput();
      expect(emailInputValue).toBe(email);
      const emailInput = await login.getEmailInputElement();
      expect(emailInput).toBeDisabled();
      await expect(
        await (await login.getUseDifferentAccountLink()).count()
      ).toEqual(0);
    });

    test('blocked with an registered email, unregistered uid', async ({
      target,
      credentials,
    }) => {
      const { fxDesktopV3ForceAuth, login, connectAnotherDevice } =
        syncBrowserPages;

      const uid = makeUid();
      const email = `block.${Date.now()}@restmail.net`;
      const newCreds = await target.auth.signUp(email, 'passwordzxcv');
      await fxDesktopV3ForceAuth.openWithReplacementParams(
        {
          ...newCreds,
          email,
        },
        {
          uid,
        }
      );
      await fxDesktopV3ForceAuth.noSuchWebChannelMessage('fxaccounts:logout');
      await login.setPassword('passwordzxcv');
      await login.submit();
      await fxDesktopV3ForceAuth.checkWebChannelMessage(
        'fxaccounts:can_link_account'
      );
      await login.unblock(email);
      await login.fillOutSignInCode(email);
      await expect(connectAnotherDevice.fxaConnected).toBeVisible();
      await fxDesktopV3ForceAuth.checkWebChannelMessage('fxaccounts:login');

      await target.auth.accountDestroy(
        email,
        'passwordzxcv',
        {},
        newCreds.sessionToken
      );
      await target.auth.accountDestroy(
        credentials.email,
        credentials.password,
        {},
        credentials.sessionToken
      );
    });
  });
});
