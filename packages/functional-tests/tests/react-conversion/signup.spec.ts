/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { expect, newPagesForSync, test } from '../../lib/fixtures/standard';
import { EmailHeader, EmailType } from '../../lib/email';
import { createCustomEventDetail, FirefoxCommand } from '../../lib/channels';

const PASSWORD = 'passwordzxcv';

let email;
let skipCleanup = false;

test.beforeEach(async ({ pages: { configPage, login } }) => {
  test.slow();
  // Ensure that the feature flag is enabled
  const config = await configPage.getConfig();
  if (config.showReactApp.signUpRoutes !== true) {
    test.skip();
    email = undefined;
  } else {
    email = login.createEmail('signup_react{id}');
    await login.clearCache();
  }
});

test.afterEach(async ({ target }) => {
  if (skipCleanup) {
    return;
  }
  if (email) {
    try {
      await target.auth.accountDestroy(email, PASSWORD);
    } catch (e) {
      // Handle the error here
      console.error('An error occurred during account cleanup:', e);
      // Optionally, rethrow the error to propagate it further
      throw e;
    }
  }
});

test.describe('severity-1 #smoke', () => {
  test.describe('signup react', () => {
    test('signup web', async ({
      page,
      target,
      pages: { settings, signupReact },
    }) => {
      await signupReact.goto();

      // Make sure the looking for sync message is displayed.
      await expect(page.getByText('Looking for Firefox sync?')).toBeVisible();

      await signupReact.fillOutEmailFirst(email);
      await page.waitForSelector('#root');
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

    // TODO this test is skipped until we sort out
    // how to record an email bounce for testing
    test.skip('signup, bounce email', async ({
      page,
      target,
      pages: { login, signupReact },
    }) => {
      await signupReact.goto();
      await signupReact.fillOutEmailFirst(email);
      await signupReact.fillOutSignupForm(PASSWORD);

      //Verify sign up code header
      await page.waitForURL(/confirm_signup_code/);
      await signupReact.confirmCodeHeading();

      // Record an harb bounce in the db

      // if a hard bounce is recorded, the page should redirect to email-first sign-in
      // with an error message
      await page.waitForURL(/`${target.contentServerUrl}`/);

      expect(
        page.getByRole('heading', { name: /Enter your email/ })
      ).toBeVisible();
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
      const params = new URL(page.url()).searchParams;

      // reload email-first page with React experiment params
      await signupReact.goto('/', params);
      // fill out email first form
      await signupReact.fillOutEmailFirst(email);
      await page.waitForURL(/signup/);
      await page.waitForSelector('#root');
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

    test('signup oauth webchannel (sync mobile)', async ({ target }) => {
      const syncBrowserPages = await newPagesForSync(target);
      const { page, signupReact, login } = syncBrowserPages;

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

      const queryParams = new URLSearchParams({
        client_id: '1b1a3e44c54fbb58', // Firefox for iOS
        code_challenge_method: 'S256',
        code_challenge: '2oc_C4v1qHeefWAGu5LI5oDG1oX4FV_Itc148D8_oQI',
        // eslint-disable-next-line camelcase
        keys_jwk:
          'eyJrdHkiOiJFQyIsImNydiI6IlAtMjU2IiwieCI6ImdUejVIWFJfa2pxSFRtMG43ZjhxcDMybVZFaHZ1cGo1dXNUV1h5TWZsb1kiLCJ5IjoiVER5TlhkalhibHZld1pWLVc5MXNDZU9fRWd0NU9WYXhpblBzOEFTQ3owZyJ9',
        scope:
          'https://identity.mozilla.com/apps/oldsync https://identity.mozilla.com/tokens/session',
        state: 'fakestate',
        context: 'oauth_webchannel_v1',
        automatedBrowser: 'true',
      });

      await signupReact.goto('/authorization', queryParams);

      await signupReact.fillOutEmailFirst(email);
      await page.waitForSelector('#root');

      await signupReact.sendWebChannelMessage(customEventDetail);
      await login.waitForCWTSEngineHeader();
      await login.isCWTSEngineBookmarks();
      await login.isCWTSEngineHistory();
      // Only engines provided via web channel for Sync mobile are displayed
      expect(await login.isCWTSEngineCreditCards()).toBe(false);

      await signupReact.listenToWebChannelMessages();
      await signupReact.fillOutSignupForm(PASSWORD);

      const code = await target.email.waitForEmail(
        email,
        EmailType.verifyShortCode,
        EmailHeader.shortCode
      );

      await signupReact.fillOutCodeForm(code);
      await signupReact.checkWebChannelMessage(FirefoxCommand.OAuthLogin);
    });

    test('signup sync', async ({ target }) => {
      test.slow();
      const syncBrowserPages = await newPagesForSync(target);
      const { page, signupReact } = syncBrowserPages;

      await signupReact.goto(
        '/',
        new URLSearchParams({
          context: 'fx_desktop_v3',
          service: 'sync',
          action: 'email',
          automatedBrowser: 'true',
        })
      );

      await signupReact.fillOutEmailFirst(email);
      await page.waitForURL(/signup/);
      await page.waitForSelector('#root');

      await signupReact.fillOutSignupForm(PASSWORD);

      const code = await target.email.waitForEmail(
        email,
        EmailType.verifyShortCode,
        EmailHeader.shortCode
      );

      await signupReact.fillOutCodeForm(code);

      // See note in `firefox.ts` about an event listener hack needed for this test
      await page.waitForURL(/connect_another_device/);
      await expect(page.getByText('You’re signed into Firefox')).toBeVisible();

      await syncBrowserPages.browser?.close();
    });
  });
});

test.describe('severity-2 #smoke', () => {
  test.describe('signup react', () => {
    test('signup invalid email', async ({ page, pages: { signupReact } }) => {
      skipCleanup = true;
      email = 'invalid';
      await signupReact.goto();
      await signupReact.fillOutEmailFirst(email);
      await expect(
        page.getByText('Valid email required', { exact: true })
      ).toBeVisible();
    });

    test('empty email', async ({ page, pages: { signupReact } }) => {
      skipCleanup = true;
      await signupReact.goto();
      await signupReact.fillOutEmailFirst('');
      await expect(
        page.getByText('Valid email required', { exact: true })
      ).toBeVisible();
    });

    test('coppa is too young', async ({ page, pages: { signupReact } }) => {
      skipCleanup = true;
      await signupReact.goto();
      await signupReact.fillOutEmailFirst(email);
      await signupReact.fillOutSignupForm(PASSWORD, '12');
      await page.waitForURL(/cannot_create_account/);
    });

    test('Visits the privacy policy links save information upon return', async ({
      page,
      pages: { signupReact },
    }) => {
      skipCleanup = true;
      await signupReact.goto();
      await signupReact.fillOutEmailFirst(email);
      await signupReact.fillOutSignupForm(PASSWORD, '21', false);
      await signupReact.visitPrivacyPolicyLink();
      await page.waitForURL(/legal\/privacy/);
      await page.goBack();

      // TBD: https://mozilla-hub.atlassian.net/browse/FXA-8797
      // expect(await signupReact.getEmail().inputValue()).toEqual(email);
      // expect(await signupReact.getPassword().inputValue).toEqual(PASSWORD);
      // expect(await signupReact.getPasswordConfirm().inputValue).toEqual(PASSWORD);
      // expect(await signupReact.getAge().inputValue).toEqual('21');
    });

    test('Visits the terms of service links save information upon return', async ({
      page,
      pages: { signupReact },
    }) => {
      skipCleanup = true;
      await signupReact.goto();
      await signupReact.fillOutEmailFirst(email);
      await signupReact.fillOutSignupForm(PASSWORD, '21', false);
      await signupReact.visitTermsOfServiceLink();
      await page.waitForURL(/legal\/terms/);
      await page.goBack();

      // TBD: https://mozilla-hub.atlassian.net/browse/FXA-8794
      // expect(await signupReact.getEmail().inputValue()).toEqual(email);
      // expect(await signupReact.getPassword().inputValue()).toEqual(PASSWORD);
      // expect(await signupReact.getPasswordConfirm().inputValue()).toEqual(PASSWORD);
      // expect(await signupReact.getAge().inputValue()).toEqual('21');
    });

    test('Checks that form prefill information is cleared after sign up -> sign out', async ({
      page,
      target,
      pages: { signupReact, settings },
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
      await page.waitForURL(/settings/);
      await settings.signOut();
      await signupReact.goto();

      // TBD: No pre fill support currently. Do we even need this?
      expect(await signupReact.getEmail().inputValue()).toEqual('');
      await signupReact.fillOutEmailFirst('new-' + email);
      expect(await signupReact.getPassword().inputValue()).toEqual('');
      expect(await signupReact.getPasswordConfirm().inputValue()).toEqual('');
      expect(await signupReact.getAge().inputValue()).toEqual('');
    });

    // TODO: Not currently supported
    test('signup via product page and redirect after confirm', async ({
      page,
      target,
      pages: { signupReact, relier, subscribe, login },
    }) => {
      // Make sure user is logged out
      await login.clearCache();

      // Go an RP's subscription page
      await relier.goto();
      await relier.clickSubscribe6Month();

      // Click the sign in link
      await subscribe.visitSignIn();

      // Preserve search params but add in react experiment parameters
      const searchParams = new URL(page.url()).searchParams;
      await signupReact.goto('/', searchParams);
      await signupReact.fillOutEmailFirst(email);
      await signupReact.fillOutSignupForm(PASSWORD);
      const code = await target.email.waitForEmail(
        email,
        EmailType.verifyShortCode,
        EmailHeader.shortCode
      );

      await signupReact.fillOutCodeForm(code);
      // TODO: The redirect back to products isn't working. https://mozilla-hub.atlassian.net/browse/FXA-8795
      // await page.waitForURL(/products/);
      // await expect(page.getByTestId('avatar')).toBeVisible();
    });
  });
});
