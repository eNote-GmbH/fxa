/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { expect, test } from '../../../lib/fixtures/standard';
import { MetricsObserver } from '../../../lib/metrics';

test.describe('severity-2 #smoke', () => {
  test.describe('ui functionality', () => {
    let metricsObserver: MetricsObserver;

    test.beforeEach(({ pages: { subscribe } }) => {
      test.slow();
      metricsObserver = new MetricsObserver(subscribe);
      metricsObserver.startTracking();
    });

    test('verify plan change funnel metrics & coupon feature not available when changing plans', async ({
      page,
      pages: { relier, subscribe },
    }, { project }) => {
      test.skip(
        project.name === 'production',
        'no real payment method available in prod'
      );
      await relier.goto();
      await relier.clickSubscribe6Month();

      // Verify discount section is displayed
      expect(await subscribe.discountTextbox()).toBe(true);

      // 'auto10pforever' is a 10% forever discount coupon for a 6mo plan
      await subscribe.addCouponCode('auto10pforever');

      // Verify the coupon is applied successfully
      expect(await subscribe.discountAppliedSuccess()).toBe(true);

      //Subscribe successfully with Stripe
      await subscribe.setConfirmPaymentCheckbox();
      await subscribe.setFullName();
      await subscribe.setCreditCardInfo();
      await subscribe.clickPayNow();
      await subscribe.submit();
      await relier.goto();

      //Change the plan
      await relier.clickSubscribe12Month();

      //Verify Discount section is not displayed
      expect(await subscribe.planUpgradeDetails()).not.toContain('Promo');

      //Submit the changes
      await subscribe.clickConfirmPlanChange();
      await subscribe.clickPayNow();
      await subscribe.submit();

      //Verify the subscription is successful
      expect(await subscribe.isSubscriptionSuccess()).toBe(true);

      // check conversion funnel metrics
      const expectedEventTypes = [
        'amplitude.subPaySetup.view',
        'amplitude.subPaySetup.engage',
        'amplitude.subPaySetup.submit',
        'amplitude.subPaySetup.success',
        'amplitude.subPaySubChange.view',
        'amplitude.subPaySubChange.engage',
        'amplitude.subPaySubChange.submit',
        'amplitude.subPaySubChange.success',
      ];
      const actualEventTypes = metricsObserver.rawEvents.map((event) => {
        return event.type;
      });
      expect(actualEventTypes).toMatchObject(expectedEventTypes);
    });
  });
});
