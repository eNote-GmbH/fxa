/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
import { faker } from '@faker-js/faker';
import { Invoice, SetupCart, TaxAmount, UpdateCart } from './cart.types';

const OFFERING_CONFIG_IDS = [
  'vpn',
  'relay-phone',
  'relay-email',
  'hubs',
  'mdnplus',
];

export const SetupCartFactory = (override?: Partial<SetupCart>): SetupCart => ({
  offeringConfigId: faker.helpers.arrayElement(OFFERING_CONFIG_IDS),
  ...override,
});

export const TaxAmountFactory = (override?: Partial<TaxAmount>): TaxAmount => ({
  title: faker.location.state({ abbreviated: true }),
  amount: faker.number.int(10000),
  ...override,
});

export const InvoiceFactory = (override?: Partial<Invoice>): Invoice => ({
  totalAmount: faker.number.int(10000),
  taxAmounts: [TaxAmountFactory()],
  ...override,
});

export const UpdateCartFactory = (
  override?: Partial<UpdateCart>
): UpdateCart => ({
  id: faker.string.uuid(),
  ...override,
});
