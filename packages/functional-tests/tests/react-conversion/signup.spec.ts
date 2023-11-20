/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { expect, newPagesForSync, test } from '../../lib/fixtures/standard';
import { EmailHeader, EmailType } from '../../lib/email';
import { createCustomEventDetail, FirefoxCommand } from '../../lib/channels';

const PASSWORD = 'passwordzxcv';

test.describe('severity-1 #smoke', () => {
  test.describe('signup react', () => {
    let email;
    let bouncedEmail;

    test.beforeEach(async ({ pages: { configPage, login } }, { project }) => {
      test.slow();
      // Ensure that the feature flag is enabled
      const config = await configPage.getConfig();
      if (config.showReactApp.signUpRoutes !== true) {
        test.skip();
        email = undefined;
      } else {
        email = login.createEmail('signup_react{id}');
        bouncedEmail = login.createEmail('bounced{id}');
        await login.clearCache();
      }

      test.skip(project.name === 'production', 'skip for production');
    });

    test.afterEach(async ({ target }) => {
      const accountStatus = await target.auth.accountStatusByEmail(email);
      try {
        if (accountStatus.exists) {
          await target.auth.accountDestroy(email, PASSWORD);
        }
      } catch (e) {
        // Handle the error here
        console.error('An error occurred during account cleanup:', e);
        // Optionally, rethrow the error to propagate it further
        throw e;
      }
    });

    test('signup web', async ({
      page,
      target,
      pages: { settings, signupReact },
    }) => {
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
      await settings.signOut();
    });

    test.only('signup, bounce email', async ({
      page,
      target,
      pages: { login, relier, signupReact },
    }) => {
      const client = await login.getFxaClient(target);

      await signupReact.goto();
      await signupReact.fillOutEmailFirst(bouncedEmail);
      await signupReact.fillOutSignupForm(PASSWORD);

      //Verify sign up code header
      await page.waitForURL(/confirm_signup_code/);
      await signupReact.confirmCodeHeading();
      const accountStatus = await target.auth.accountStatusByEmail(
        bouncedEmail
      );
      expect(accountStatus.exists).toBeTruthy();

      await client.accountDestroy(bouncedEmail, PASSWORD);

      //Verify error message
      expect(await login.getTooltipError()).toContain(
        'Your confirmation email was just returned. Mistyped email?'
      );
    });

    test('signup oauth', async ({
      page,
      target,
      pages: { relier, signupReact },
    }) => {
      relier.goto();
      relier.clickEmailFirst();

      // wait for navigation, and get search params
      await page.waitForURL(/oauth\//);
      const url = page.url();
      const params = new URLSearchParams(url.substring(url.indexOf('?') + 1));

      // reload email-first page with React experiment params
      await signupReact.goto('/', params);
      // fill out email first form
      await signupReact.fillOutEmailFirst(email);
      await signupReact.fillOutSignupForm(PASSWORD);

      // Get code from email
      const code = await target.email.waitForEmail(
        email,
        EmailType.verifyShortCode,
        EmailHeader.shortCode
      );

      await signupReact.fillOutCodeForm(code);

      // expect to be redirected to relier after confirming signup code
      await page.waitForURL(target.relierUrl);
      expect(await relier.isLoggedIn()).toBe(true);
      await relier.signOut();
    });

    // TODO: This isn't working because we're checking for sync mobile webchannel in the page
    // by checking against the client ID. This client ID is 123done and not Sync.
    test.skip('signup oauth webchannel (sync mobile)', async ({
      pages: { login, relier },
    }) => {
      const customEventDetail = createCustomEventDetail(
        FirefoxCommand.FxAStatus,
        {
          capabilities: {
            choose_what_to_sync: true,
            engines: ['bookmarks', 'history'],
          },
          signedInUser: null,
        }
      );

      const email = login.createEmail();

      await relier.goto(
        'context=oauth_webchannel_v1&automatedBrowser=true&forceExperiment=generalizedReactApp&forceExperimentGroup=react'
      );
      await relier.clickEmailFirst();

      // We used to have this, not sure if we want it or not.
      // wait for navigation, and get search params
      // await page.waitForURL(/oauth\//);
      // const url = page.url();
      // const params = new URLSearchParams(url.substring(url.indexOf('?') + 1));

      // // reload email-first page with React experiment params
      // await signupReact.goto('/', params);
      // // fill out email first form
      // await signupReact.fillOutEmailFirst(email);
      // await signupReact.fillOutSignupForm(PASSWORD);

      await login.setEmail(email);
      await login.submit();
      // do we need to check that we're on the signup page?

      await login.respondToWebChannelMessage(customEventDetail);

      // the CWTS form is on the same signup page
      await login.waitForCWTSEngineHeader();
      expect(await login.isCWTSEngineBookmarks()).toBe(true);
      expect(await login.isCWTSEngineHistory()).toBe(true);
      expect(await login.isCWTSEngineCreditCards()).toBe(false);

      await login.fillOutFirstSignUp(email, PASSWORD, {
        enterEmail: false,
        waitForNavOnSubmit: false,
      });
      await login.checkWebChannelMessage(FirefoxCommand.OAuthLogin);
    });

    test('signup sync', async ({ target }) => {
      test.slow();
      const syncBrowserPages = await newPagesForSync(target);
      const { signupReact } = syncBrowserPages;

      await signupReact.goto(
        '/',
        new URLSearchParams({
          context: 'fx_desktop_v3',
          service: 'sync',
          action: 'email',
        })
      );

      await signupReact.fillOutEmailFirst(email);
      await signupReact.fillOutSignupForm(PASSWORD);

      const code = await target.email.waitForEmail(
        email,
        EmailType.verifyShortCode,
        EmailHeader.shortCode
      );

      await signupReact.fillOutCodeForm(code);

      // TODO Uncomment once sync is working
      // expect(await connectAnotherDevice.fxaConnected.isVisible()).toBeTruthy();

      await syncBrowserPages.browser?.close();
    });
  });
});
