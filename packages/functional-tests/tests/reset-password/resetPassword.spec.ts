import { test, expect } from '../../lib/fixtures/standard';
import { EmailHeader, EmailType } from '../../lib/email';

const NEW_PASSWORD = 'passwordzxcv';

test.describe('Reset password current', () => {
  test.beforeEach(async () => {
    test.slow();
  });

  test('can reset password', async ({
    page,
    target,
    credentials,
    context,
    pages: { settings },
  }) => {
    await page.goto(`${target.contentServerUrl}/reset_password`);

    // Verify backbone page has been loaded
    await page.waitForSelector('#stage');

    await page.locator('input').fill(credentials.email);
    const waitForNavigation = page.waitForNavigation();
    await page.locator('text="Begin reset"').click();
    await waitForNavigation;

    // Verify confirm password reset page elements
    expect(
      await page.locator('text="Reset email sent"').isEnabled()
    ).toBeTruthy();
    expect(
      await page.locator('text="Remember password? Sign in"').isEnabled()
    ).toBeTruthy();
    expect(
      await page
        .locator('text="Not in inbox or spam folder? Resend"')
        .isVisible()
    ).toBeTruthy();

    const link = await target.email.waitForEmail(
      credentials.email,
      EmailType.recovery,
      EmailHeader.link
    );

    // Open link in a new window
    const diffPage = await context.newPage();
    await diffPage.goto(link);

    // Loads the backbone version
    expect(await diffPage.locator('#stage').isEnabled()).toBeTruthy();
    expect(
      await diffPage.locator('text="Create new password"').isEnabled()
    ).toBeTruthy();
    expect(
      await diffPage.locator('text="Remember password? Sign in"').isEnabled()
    ).toBeTruthy();

    await diffPage.locator('input[id="password"]').fill(NEW_PASSWORD);
    await diffPage.locator('input[id="vpassword"]').fill(NEW_PASSWORD);

    await diffPage.locator('text="Reset password"').click();

    const settingsHeader = await page.locator('text="Settings"');
    expect(await settingsHeader.isEnabled()).toBeTruthy();

    const diffPageSettingsHeader = await diffPage.locator('text="Settings"');
    expect(await diffPageSettingsHeader.isEnabled()).toBeTruthy();

    await diffPage.close();
    await settings.signOut();

    // Verify that new password can be used to log in
    expect(
      await page.locator('text="Enter your email"').isEnabled()
    ).toBeTruthy();

    await page.locator('input[type=email]').fill(credentials.email);

    await page.locator('text="Sign up or sign in"').click();

    await page.locator('#password').fill(NEW_PASSWORD);

    await page.locator('text="Sign in"').click();

    expect(await settingsHeader.isEnabled()).toBeTruthy();

    // Cleanup requires setting this value to correct password
    credentials.password = NEW_PASSWORD;
  });

  test('visit confirmation screen without initiating reset_password, user is redirected to /reset_password', async ({
    target,
    page,
    pages: { resetPassword },
  }) => {
    await page.goto(
      `${target.contentServerUrl}/confirm_reset_password?showReactApp=false`
    );

    // Verify its redirected to reset password page
    expect(await resetPassword.resetPasswordHeader()).toBe(true);
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
    await page.goto(`${target.contentServerUrl}/reset_password`);
    await resetPassword.fillOutResetPassword(' ' + credentials.email);
    expect(await resetPassword.confirmResetPasswordHeader()).toBe(true);

    await page.goto(`${target.contentServerUrl}/reset_password`);
    await resetPassword.fillOutResetPassword(credentials.email + ' ');
    expect(await resetPassword.confirmResetPasswordHeader()).toBe(true);
  });

  test('open confirm_reset_password page, click resend', async ({
    credentials,
    target,
    page,
    pages: { resetPassword },
  }) => {
    await page.goto(`${target.contentServerUrl}/reset_password`);
    await resetPassword.fillOutResetPassword(credentials.email);
    await resetPassword.clickResend();
    expect(await resetPassword.resendSuccessMessage()).toContain(
      'Email resent. Add accounts@firefox.com to your contacts to ensure a smooth delivery.'
    );
  });

  test('open /reset_password page, enter unknown email, wait for error', async ({
    target,
    page,
    pages: { login, resetPassword },
  }) => {
    await page.goto(`${target.contentServerUrl}/reset_password`);
    await login.setEmail('email@restmail.net');
    await resetPassword.clickBeginReset();
    expect(await resetPassword.unknownAccountError()).toContain(
      'Unknown account.'
    );
  });

  test('browse directly to page with email on query params', async ({
    credentials,
    target,
    page,
    pages: { resetPassword },
  }) => {
    const url = `${target.contentServerUrl}/reset_password?email=${credentials.email}`;
    await page.goto(url);

    //The email shouldn't be pre-filled
    expect(await resetPassword.getEmailValue()).toBeEmpty();
    await resetPassword.fillOutResetPassword(credentials.email);
    expect(await resetPassword.confirmResetPasswordHeader()).toBe(true);
  });
});
