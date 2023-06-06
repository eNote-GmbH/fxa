/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { test, expect } from '../../lib/fixtures/standard';
import { BaseTarget } from '../../lib/targets/base';
import { EmailHeader, EmailType } from '../../lib/email';

function getReactFeatureFlagUrl(
  target: BaseTarget,
  path: string,
  params?: string
) {
  if (params) {
    return `${target.contentServerUrl}${path}?showReactApp=true&${params}`;
  } else {
    return `${target.contentServerUrl}${path}?showReactApp=true`;
  }
}

const NEW_PASSWORD = 'notYourAveragePassW0Rd';

test.describe('reset password', () => {
  test.beforeEach(async ({ pages: { login } }) => {
    test.slow();
    // Ensure that the feature flag is enabled
    const config = await login.getConfig();
    test.skip(config.showReactApp.resetPasswordRoutes !== true);
  });

  test('can reset password', async ({ page, target, credentials, context }) => {
    await page.goto(getReactFeatureFlagUrl(target, '/reset_password'));

    // Verify react page has been loaded
    await page.waitForSelector('#root');

    await page.locator('input').fill(credentials.email);
    let waitForNavigation = page.waitForNavigation();
    await page.getByRole('button', { name: 'Begin reset' }).click();
    await waitForNavigation;

    // Verify confirm password reset page elements
    expect(
      await page.locator('text="Reset email sent"').isEnabled()
    ).toBeTruthy();
    expect(
      await page.locator('text="Remember your password? Sign in"').isEnabled()
    ).toBeTruthy();
    expect(
      await page
        .locator('text="Not in inbox or spam folder? Resend"')
        .isVisible()
    ).toBeTruthy();

    // We need to append `&showReactApp=true` to reset link in order to enroll in reset password experiment
    let link = await target.email.waitForEmail(
      credentials.email,
      EmailType.recovery,
      EmailHeader.link
    );
    link = `${link}&showReactApp=true`;

    // Open link in a new window
    const diffPage = await context.newPage();
    await diffPage.goto(link);

    // Loads the React version
    expect(await diffPage.locator('#root').isEnabled()).toBeTruthy();
    expect(
      await diffPage.locator('text="Create new password"').isEnabled()
    ).toBeTruthy();
    expect(
      await diffPage
        .locator('text="Remember your password? Sign in"')
        .isEnabled()
    ).toBeTruthy();

    await diffPage.locator('input[name="newPassword"]').fill(NEW_PASSWORD);
    await diffPage.locator('input[name="confirmPassword"]').fill(NEW_PASSWORD);

    const pageWaitForNavigation = page.waitForNavigation();
    const diffPageWaitForNavigation = diffPage.waitForNavigation();
    await diffPage.locator('text="Reset password"').click();
    await diffPageWaitForNavigation;
    await pageWaitForNavigation;

    expect(
      await diffPage.locator('text="Your password has been reset"').isEnabled()
    ).toBeTruthy();

    await diffPage.close();

    expect(
      await page.locator('text="Enter your email"').isEnabled()
    ).toBeTruthy();

    await page.locator('input[type=email]').fill(credentials.email);

    waitForNavigation = page.waitForNavigation();
    await page.locator('text="Sign up or sign in"').click();
    await waitForNavigation;

    await page.locator('#password').fill(NEW_PASSWORD);

    waitForNavigation = page.waitForNavigation();
    await page.locator('text="Sign in"').click();
    await waitForNavigation;

    const settingsHeader = await page.locator('text=Settings');
    expect(await settingsHeader.isEnabled()).toBeTruthy();

    // Cleanup requires setting this value to correct password
    credentials.password = NEW_PASSWORD;
  });

  test('visit confirmation screen without initiating reset_password, user is redirected to /reset_password', async ({
    target,
    page,
    pages: { resetPassword },
  }) => {
    await page.goto(getReactFeatureFlagUrl(target, '/confirm_reset_password'));

    // Verify its redirected to react reset password page
    await page.waitForSelector('#root');
    expect(
      await page.getByRole('button', { name: 'Begin reset' }).isEnabled()
    ).toBeTruthy();
  });

  test('open /reset_password page from /signin', async ({
    credentials,
    pages: { login },
  }) => {
    await login.goto();
    await login.setEmail(credentials.email);
    await login.submit();
    await login.clickForgotPassword();
  });

  test('enter an email with leading/trailing whitespace', async ({
    credentials,
    target,
    page,
    pages: { login, resetPassword },
  }) => {
    await page.goto(getReactFeatureFlagUrl(target, '/reset_password'));

    // Verify react page is loaded
    await page.waitForSelector('#root');

    await page.locator('input').fill(credentials.email);
    await page.getByRole('button', { name: 'Begin reset' }).click();
    expect(
      await page.locator('text="Reset email sent"').isEnabled()
    ).toBeTruthy();

    await page.goto(`${target.contentServerUrl}/reset_password`);
    await page.locator('input').fill(credentials.email + ' ');
    await page.getByRole('button', { name: 'Begin reset' }).click();
    expect(
      await page.locator('text="Reset email sent"').isEnabled()
    ).toBeTruthy();
  });

  test('open confirm_reset_password page, click resend', async ({
    credentials,
    target,
    page,
    pages: { resetPassword },
  }) => {
    await page.goto(getReactFeatureFlagUrl(target, '/reset_password'));

    // Verify react page is loaded
    await page.waitForSelector('#root');

    await page.getByRole('textbox', { name: 'Email' }).fill(credentials.email);
    await page.getByRole('button', { name: 'Begin reset' }).click();
    const resendButton = await page.getByRole('button', {
      name: 'Not in inbox or spam folder? Resend',
    });
    expect(await resendButton.isEnabled()).toBeTruthy();
    expect(await resendButton.isVisible()).toBeTruthy();
    await resendButton.click();
    expect(
      await page
        .getByText(
          'Email resent. Add accounts@firefox.com to your contacts to ensure a smooth delivery.'
        )
        .isEnabled()
    ).toBeTruthy();
  });

  test('open /reset_password page, enter unknown email, wait for error', async ({
    target,
    page,
    pages: { login, resetPassword },
  }) => {
    await page.goto(getReactFeatureFlagUrl(target, '/reset_password'));

    // Verify react page is loaded
    await page.waitForSelector('#root');

    await page
      .getByRole('textbox', { name: 'Email' })
      .fill('email@restmail.net');
    await page.getByRole('button', { name: 'Begin reset' }).click();
    expect(await page.getByText('Unknown account').isEnabled()).toBeTruthy();
  });

  test('browse directly to page with email on query params', async ({
    credentials,
    target,
    page,
    pages: { resetPassword },
  }) => {
    await page.goto(
      getReactFeatureFlagUrl(
        target,
        '/reset_password',
        `email=${credentials.email}`
      )
    );

    // Verify react page is loaded
    await page.waitForSelector('#root');

    //The email shouldn't be pre-filled
    const emailInput = await page.getByRole('textbox', { name: 'Email' });
    expect(emailInput).toHaveValue('');
    await emailInput.fill(credentials.email);
    await page.getByRole('button', { name: 'Begin reset' }).click();
    expect(
      await page.getByRole('heading', { name: 'Reset email sent' }).isEnabled()
    ).toBeTruthy();
  });
});
