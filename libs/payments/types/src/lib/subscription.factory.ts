/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { faker } from '@faker-js/faker';
import { Stripe } from 'stripe';

export const SubscriptionFactory = (
  override: Partial<Stripe.Subscription>
): Stripe.Subscription => {
  const subId = `sub_${faker.string.alphanumeric({ length: 24 })}`;
  const prodId = `prod_${faker.string.alphanumeric({ length: 24 })}`;
  const planId = `plan_${faker.string.alphanumeric({ length: 14 })}`;

  return {
    id: subId,
    object: 'subscription',
    application: null,
    application_fee_percent: null,
    automatic_tax: {
      enabled: true,
    },
    billing_cycle_anchor: 1,
    billing_thresholds: null,
    cancel_at: null,
    cancel_at_period_end: false,
    canceled_at: null,
    cancellation_details: null,
    collection_method: 'charge_automatically',
    created: 1,
    currency: 'USD',
    current_period_end: 1,
    current_period_start: 0,
    customer: `cus_${faker.string.alphanumeric({ length: 14 })}`,
    days_until_due: null,
    default_payment_method: faker.string.alphanumeric(10),
    default_source: faker.string.alphanumeric(10),
    description: null,
    discount: null,
    ended_at: null,
    items: {
      object: 'list',
      data: [
        {
          id: `si_${faker.string.alphanumeric({ length: 14 })}`,
          object: 'subscription_item',
          billing_thresholds: null,
          created: 1696897253,
          metadata: {},
          plan: {
            id: planId,
            object: 'plan',
            active: true,
            aggregate_usage: null,
            amount: 500,
            amount_decimal: '500',
            billing_scheme: 'per_unit',
            created: 1583259953,
            currency: 'usd',
            interval: 'month',
            interval_count: 1,
            livemode: false,
            metadata: {
              productOrder: '1',
            },
            nickname: '123Done Pro Monthly',
            product: prodId,
            tiers_mode: null,
            transform_usage: null,
            trial_period_days: null,
            usage_type: 'licensed',
          },
          price: {
            id: planId,
            object: 'price',
            active: true,
            billing_scheme: 'per_unit',
            created: 1583259953,
            currency: 'usd',
            currency_options: {
              usd: {
                custom_unit_amount: null,
                tax_behavior: 'exclusive',
                unit_amount: 500,
                unit_amount_decimal: '500',
              },
            },
            custom_unit_amount: null,
            livemode: false,
            lookup_key: null,
            metadata: {
              productOrder: '1',
            },
            nickname: '123Done Pro Monthly',
            product: prodId,
            recurring: {
              aggregate_usage: null,
              interval: 'month',
              interval_count: 1,
              trial_period_days: null,
              usage_type: 'licensed',
            },
            tax_behavior: 'exclusive',
            tiers_mode: null,
            transform_quantity: null,
            type: 'recurring',
            unit_amount: 500,
            unit_amount_decimal: '500',
          },
          quantity: 1,
          subscription: subId,
          tax_rates: [],
        },
      ],
      has_more: false,
      url: `/v1/subscription_items?subscription=${subId}`,
    },
    latest_invoice: `in_${faker.string.alphanumeric({ length: 24 })}`,
    livemode: false,
    metadata: {},
    next_pending_invoice_item_invoice: null,
    on_behalf_of: null,
    pause_collection: null,
    payment_settings: null,
    pending_invoice_item_interval: null,
    pending_setup_intent: null,
    pending_update: null,
    schedule: null,
    start_date: 0,
    status: 'active',
    test_clock: null,
    transfer_data: null,
    trial_end: null,
    trial_settings: null,
    trial_start: null,
    ...override,
  };
};
