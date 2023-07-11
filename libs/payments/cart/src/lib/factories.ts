import { faker } from '@faker-js/faker';
import { Invoice, Subscription, TaxAddress, TaxAmount } from './types';

export const TaxAmountFactory = (override?: Partial<TaxAmount>): TaxAmount => ({
  title: faker.location.state({ abbreviated: true }),
  amount: parseInt(faker.finance.amount()),
  ...override,
});

export const InvoiceFactory = (override?: Partial<Invoice>): Invoice => ({
  totalAmount: parseInt(faker.finance.amount()),
  taxAmounts: [TaxAmountFactory()],
  ...override,
});

export const SubscriptionFactory = (
  override?: Partial<Subscription>
): Subscription => ({
  pageConfigId: faker.helpers.arrayElement([
    'vpn',
    'relay-phone',
    'relay-email',
    'hubs',
    'mdnplus',
  ]),
  previousInvoice: InvoiceFactory(),
  nextInvoice: InvoiceFactory(),
  ...override,
});

export const TaxAddressFactory = (
  override?: Partial<TaxAddress>
): TaxAddress => ({
  countryCode: faker.location.countryCode(),
  postalCode: faker.location.zipCode(),
  ...override,
});
