import { test, expect } from '../../lib/fixtures/standard';
import { EmailHeader, EmailType } from '../../lib/email';

test.describe('oauth reset password react', () => {
  let resetPasswordReactFlag = false;

  test.beforeEach(async ({ pages: { resetPassword } }) => {
    resetPasswordReactFlag = resetPassword.react;
    resetPassword.react = true;
    test.slow();
  });

  test.afterEach(async ({ pages: { resetPassword } }) => {
    resetPassword.react = resetPasswordReactFlag;
  });

  async function checkForReactApp({ page }) {
    expect(await page.locator('#root')).toBeVisible();
  }

  function addShowReactApp(link) {
    const param = 'showReactApp=true';

    return link.includes(param)
      ? link
      : link.includes('?')
      ? `${link}&${param}`
      : `${link}?${param}`;
  }

  async function conductReset({
    target,
    page,
    credentials,
    login,
    relier,
    resetPassword,
  }) {
    // Add 'showReactApp' query param.
    // This will get copied into the URL query string when the button is clicked and
    // persist throughout the user flow.
    await relier.goto('showReactApp=true');
    await relier.clickEmailFirst();

    // QUESTION: Did this view never get ported? It seems that although the showReactApp query
    // param is set, this view is still using backbone.
    await login.setEmail(credentials.email);
    await login.submit();
    await login.clickForgotPassword();

    // TODO: Once the full flow is implemented in react, we can remove this. For now, we must 'refresh'
    // the page so that the 'showReactApp' param takes effect.
    // TODO: Once conversion is complete, this check will not be necessary
    await page.reload();
    await checkForReactApp({ page });

    // Verify reset password header
    expect(await resetPassword.resetPasswordHeader()).toBe(true);
    await resetPassword.fillOutResetPassword(credentials.email);

    const link = await target.email.waitForEmail(
      credentials.email,
      EmailType.recovery,
      EmailHeader.link
    );

    return addShowReactApp(link);
  }

  async function enterNewPassword({
    differentTab,
    page,
    link,
    resetPassword,
    credentials,
  }) {
    if (differentTab) {
      // This simulates a 'new' tab, whic wouldn't have any session state
      await page.evaluate(() => window.sessionStorage.clear());
    }

    await page.goto(link);
    await page.waitForURL(/reset_password/);
    await checkForReactApp({ page });
    await resetPassword.resetNewPassword(credentials.password);

    return page;
  }

  test('reset password happy path same tab', async ({
    target,
    page,
    credentials,
    pages: { login, relier, resetPassword },
  }) => {
    const link = await conductReset({
      target,
      page,
      credentials,
      login,
      relier,
      resetPassword,
    });
    await enterNewPassword({
      differentTab: false,
      page,
      link,
      resetPassword,
      credentials,
    });

    // The user should be direct back to the 123 done app.
    await page.waitForLoadState();
    expect(await relier.isLoggedIn()).toBe(true);
  });

  test('reset password happy path different tab', async ({
    target,
    page,
    credentials,
    pages: { login, relier, resetPassword },
  }) => {
    const link = await conductReset({
      target,
      page,
      credentials,
      login,
      relier,
      resetPassword,
    });
    await enterNewPassword({
      differentTab: true,
      page,
      link,
      resetPassword,
      credentials,
    });

    // The user should get a verification message and the orginating
    // service's name should be displayed.
    await page.waitForURL(/reset_password_verified/);
    await page.getByText('Your password has been reset');
    await page.getByText('You’re now ready to use 123Done');
  });
});
