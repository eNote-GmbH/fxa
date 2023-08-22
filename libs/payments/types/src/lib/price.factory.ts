/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { faker } from '@faker-js/faker';
import { Stripe } from 'stripe';

export const PriceFactory = (
  override: Partial<Stripe.Price>
): Stripe.Price => ({
  id: `price_${faker.string.alphanumeric({ length: 24 })}`,
  object: 'price',
  active: true,
  billing_scheme: 'per_unit',
  created: 1,
  currency: 'USD',
  custom_unit_amount: null,
  livemode: false,
  lookup_key: null,
  metadata: {},
  nickname: null,
  product: `prod_${faker.string.alphanumeric({ length: 14 })}`,
  recurring: null,
  tax_behavior: 'exclusive',
  tiers_mode: null,
  transform_quantity: null,
  type: 'recurring',
  unit_amount: 500,
  unit_amount_decimal: '5.00',
  ...override,
});
