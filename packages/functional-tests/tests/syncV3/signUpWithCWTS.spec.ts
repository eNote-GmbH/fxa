/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { FirefoxCommand, createCustomEventDetail } from '../../lib/channels';
import { expect } from '../../lib/fixtures/standard';
import uaStrings from '../../lib/ua-strings';
import { test } from '../../tests/syncV3/fixtures';

const password = 'passwordzxcv';
let email;

test.describe.configure({ mode: 'parallel' });

test.describe('severity-1 #smoke', () => {
  test.beforeEach(async ({ pages: { configPage } }) => {
    const config = await configPage.getConfig();
    test.skip(
      config.showReactApp.signUpRoutes === true,
      'these tests are specific to backbone, skip if seeing React version'
    );
  });

  test.describe('Sync v3 sign up and CWTS', () => {
    test.beforeEach(async ({ target, syncBrowserPages }) => {
      //Sync tests run a little slower and flake
      test.slow();
      const { login } = syncBrowserPages;
      email = login.createEmail('sync{id}');
    });

    test('verify with signup code and CWTS', async ({
      target,
      syncBrowserPages,
    }) => {
      const { login, page, signinTokenCode, connectAnotherDevice } =
        syncBrowserPages;
      const query = new URLSearchParams({
        forceUA: uaStrings['desktop_firefox_71'],
      });
      const eventDetailStatus = createCustomEventDetail(
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
      const eventDetailLinkAccount = createCustomEventDetail(
        FirefoxCommand.LinkAccount,
        {
          ok: true,
        }
      );
      await page.goto(
        `${
          target.contentServerUrl
        }?context=fx_desktop_v3&service=sync&automatedBrowser=true&${query.toString()}`
      );
      await login.respondToWebChannelMessage(eventDetailStatus);
      await login.respondToWebChannelMessage(eventDetailLinkAccount);
      await login.checkWebChannelMessage('fxaccounts:fxa_status');
      await login.setEmail(email);
      await signinTokenCode.clickSubmitButton();
      await login.setPassword(password);
      await login.confirmPassword(password);
      await login.setAge('21');

      // The CWTS form is on the same signup page
      await login.waitForCWTSEngineHeader();
      expect(await login.isCWTSEngineBookmarks()).toBe(true);
      expect(await login.isCWTSEngineHistory()).toBe(true);
      expect(await login.isCWTSEnginePasswords()).toBe(true);
      expect(await login.isCWTSEngineTabs()).toBe(true);
      expect(await login.isCWTSEnginePrefs()).toBe(true);
      expect(await login.isCWTSEngineAddresses()).toBe(false);

      // Uncheck the passwords and history engines
      await login.uncheckCWTSEngineHistory();
      await login.uncheckCWTSEnginePasswords();
      await signinTokenCode.clickSubmitButton();
      await login.checkWebChannelMessage(FirefoxCommand.LinkAccount);
      await login.fillOutSignUpCode(email);
      await expect(connectAnotherDevice.fxaConnected).toBeVisible();
    });

    test('verify at CWTS', async ({ target, syncBrowserPages }) => {
      const { login, page, signinTokenCode, connectAnotherDevice } =
        syncBrowserPages;
      const query = new URLSearchParams({
        forceUA: uaStrings['desktop_firefox_58'],
      });
      const eventDetailStatus = createCustomEventDetail(
        FirefoxCommand.FxAStatus,
        {
          signedInUser: null,
          capabilities: {
            multiService: false,
          },
        }
      );
      await page.goto(
        `${
          target.contentServerUrl
        }?context=fx_desktop_v3&service=sync&automatedBrowser=true&${query.toString()}`,
        {
          waitUntil: 'load',
        }
      );
      await login.respondToWebChannelMessage(eventDetailStatus);
      await login.checkWebChannelMessage('fxaccounts:fxa_status');
      await login.setEmail(email);
      await signinTokenCode.clickSubmitButton();
      await login.setPassword(password);
      await login.confirmPassword(password);
      await login.setAge('21');
      await login.submit();

      // Verify the CWTS page and the checkboxes
      expect(await login.isCWTSPageHeader()).toBe(true);
      expect(await login.isCWTSEngineAddresses()).toBe(false);
      expect(await login.isDoNotSync()).toBe(false);
      expect(await login.isCWTSEngineCreditCards()).toBe(false);
      await login.checkWebChannelMessage(FirefoxCommand.LinkAccount);
      await login.noSuchWebChannelMessage(FirefoxCommand.Login);
      await signinTokenCode.clickSubmitButton();
      await login.fillOutSignUpCode(email);
      await login.checkWebChannelMessage(FirefoxCommand.Login);
      await expect(connectAnotherDevice.fxaConnected).toBeVisible();
    });

    test('engines not supported', async ({ target, syncBrowserPages }) => {
      const { login, page, signinTokenCode } = syncBrowserPages;
      const query = new URLSearchParams({
        forceUA: uaStrings['desktop_firefox_58'],
      });
      const eventDetailStatus = createCustomEventDetail(
        FirefoxCommand.FxAStatus,
        {
          signedInUser: null,
        }
      );
      await page.goto(
        `${
          target.contentServerUrl
        }?context=fx_desktop_v3&service=sync&automatedBrowser=true&${query.toString()}`
      );
      await login.respondToWebChannelMessage(eventDetailStatus);
      await login.checkWebChannelMessage('fxaccounts:fxa_status');
      await login.setEmail(email);
      await signinTokenCode.clickSubmitButton();
      await login.setPassword(password);
      await login.confirmPassword(password);
      await login.setAge('21');
      await login.submit();

      // Verify the CWTS page and the checkboxes
      expect(await login.isCWTSPageHeader()).toBe(true);
      expect(await login.isCWTSEngineAddresses()).toBe(false);
      expect(await login.isCWTSEngineCreditCards()).toBe(false);
    });

    test('neither `creditcards` nor `addresses` supported', async ({
      target,
      syncBrowserPages,
    }) => {
      const { login, page, signinTokenCode } = syncBrowserPages;
      const query = new URLSearchParams({
        forceUA: uaStrings['desktop_firefox_58'],
      });
      const eventDetailStatus = createCustomEventDetail(
        FirefoxCommand.FxAStatus,
        {
          capabilities: {
            engines: [],
          },
          signedInUser: null,
        }
      );
      await page.goto(
        `${
          target.contentServerUrl
        }?context=fx_desktop_v3&service=sync&automatedBrowser=true&${query.toString()}`
      );
      await login.respondToWebChannelMessage(eventDetailStatus);
      await login.checkWebChannelMessage('fxaccounts:fxa_status');
      await login.setEmail(email);
      await signinTokenCode.clickSubmitButton();
      await login.setPassword(password);
      await login.confirmPassword(password);
      await login.setAge('21');
      await login.submit();

      // Verify the CWTS page and the checkboxes
      expect(await login.isCWTSPageHeader()).toBe(true);
      expect(await login.isCWTSEngineAddresses()).toBe(false);
      expect(await login.isCWTSEngineCreditCards()).toBe(false);
    });

    test('`creditcards` and `addresses` supported', async ({
      target,
      syncBrowserPages,
    }) => {
      const { login, page, signinTokenCode } = syncBrowserPages;
      const query = new URLSearchParams({
        forceUA: uaStrings['desktop_firefox_58'],
      });
      const eventDetailStatus = createCustomEventDetail(
        FirefoxCommand.FxAStatus,
        {
          capabilities: {
            engines: ['creditcards', 'addresses'],
          },
          signedInUser: null,
        }
      );
      await page.goto(
        `${
          target.contentServerUrl
        }?context=fx_desktop_v3&service=sync&automatedBrowser=true&${query.toString()}`
      );
      await login.respondToWebChannelMessage(eventDetailStatus);
      await login.checkWebChannelMessage('fxaccounts:fxa_status');
      await login.setEmail(email);
      await signinTokenCode.clickSubmitButton();
      await login.setPassword(password);
      await login.confirmPassword(password);
      await login.setAge('21');
      await login.submit();

      // Verify the CWTS page and the checkboxes
      expect(await login.isCWTSPageHeader()).toBe(true);
      expect(await login.isCWTSEngineAddresses()).toBe(true);
      expect(await login.isCWTSEngineCreditCards()).toBe(true);
    });
  });
});
