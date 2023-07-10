import { test, expect } from '../../lib/fixtures/standard';

test.describe('support form without valid session', () => {
  test('go to support form, redirects to index', async ({
    page,
    target,
    pages: { login },
  }) => {
    await login.clearCache();
    await page.goto(`${target.contentServerUrl}/support`, {
      waitUntil: 'load',
    });
    expect(await login.isEmailHeader()).toBe(true);
  });
});

test.describe('support form without active subscriptions', () => {
  test('go to support form, redirects to subscription management, then back to settings', async ({
    page,
    target,
    pages: { login },
  }) => {
    test.slow();
    await page.goto(`${target.contentServerUrl}/support`, {
      waitUntil: 'load',
    });
    await page.waitForURL(/settings/);
    expect(await login.loginHeader()).toBe(true);
  });
});

test.describe('support form with active subscriptions', () => {
  test.beforeEach(() => {
    test.slow();
  });

  test('go to support form, submits the form', async ({
    pages: { login, relier, subscribe, settings, subscriptionManagement },
  }, { project }) => {
    test.skip(
      project.name === 'production',
      'no real payment method available in prod'
    );
    await relier.goto();
    await relier.clickSubscribe();
    await subscribe.setConfirmPaymentCheckbox();
    await subscribe.setFullName();
    await subscribe.setCreditCardInfo();
    await subscribe.clickPayNow();
    await subscribe.submit();

    //Login to FxA account
    await login.goto();
    await login.clickSignIn();
    const subscriptionPage = await settings.clickPaidSubscriptions();
    subscriptionManagement.page = subscriptionPage;
    await subscriptionManagement.fillSupportForm();

    //Since we don't have proper Zendesk config in CircleCI, the form cannot be successfully submitted
    //await subscriptionManagement.submitSupportForm();
    //expect(await subscriptionManagement.subscriptionManagementHeader()).toBe(true);
  });

  test('go to support form, cancel, redirects to subscription management', async ({
    page,
    pages: { login, relier, subscribe, settings, subscriptionManagement },
  }, { project }) => {
    test.skip(
      project.name === 'production',
      'no real payment method available in prod'
    );
    await relier.goto();
    await relier.clickSubscribe();
    await subscribe.setConfirmPaymentCheckbox();
    await subscribe.setFullName();
    await subscribe.setCreditCardInfo();
    await subscribe.clickPayNow();
    await subscribe.submit();

    //Login to FxA account
    await login.goto();
    await login.clickSignIn();
    const subscriptionPage = await settings.clickPaidSubscriptions();
    subscriptionManagement.page = subscriptionPage;
    await subscriptionManagement.fillSupportForm();
    await subscriptionManagement.cancelSupportForm();

    //Verify it redirects back to the subscription management page
    expect(await subscriptionManagement.subscriptiontHeader()).toBe(true);
  });
});
