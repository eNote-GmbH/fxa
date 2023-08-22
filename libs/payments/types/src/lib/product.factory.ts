/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { faker } from '@faker-js/faker';
import { Stripe } from 'stripe';

export const ProductFactory = (
  override: Partial<Stripe.Product>
): Stripe.Product => ({
  id: `prod_${faker.string.alphanumeric({ length: 14 })}`,
  object: 'product',
  active: true,
  attributes: null,
  created: 1,
  description: 'test product',
  images: ['img1.jpg'],
  livemode: false,
  metadata: {},
  name: 'product',
  package_dimensions: null,
  shippable: false,
  type: 'service',
  updated: 2,
  url: 'http://product.com',
  default_price: null,
  tax_code: null,
  ...override,
});
