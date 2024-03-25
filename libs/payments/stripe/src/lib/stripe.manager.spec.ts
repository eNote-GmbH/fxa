/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { Test, TestingModule } from '@nestjs/testing';
import { faker } from '@faker-js/faker';

import { CustomerFactory } from './factories/customer.factory';
import { InvoiceFactory } from './factories/invoice.factory';
import {
  SubscriptionFactory,
  SubscriptionListFactory,
} from './factories/subscription.factory';
import { StripeClient } from './stripe.client';
import { StripeManager } from './stripe.manager';

describe('StripeManager', () => {
  let manager: StripeManager;
  let mockClient: StripeClient;

  beforeEach(async () => {
    mockClient = new StripeClient({
      apiKey: faker.string.uuid(),
      taxIds: { EUR: 'EU1234' },
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        { provide: StripeClient, useValue: mockClient },
        StripeManager,
      ],
    }).compile();

    manager = module.get<StripeManager>(StripeManager);
  });

  it('should be defined', async () => {
    expect(manager).toBeDefined();
    expect(manager).toBeInstanceOf(StripeManager);
  });

  describe('fetchActiveCustomer', () => {
    it('returns an existing customer from Stripe', async () => {
      const mockCustomer = CustomerFactory();

      mockClient.fetchCustomer = jest.fn().mockResolvedValueOnce(mockCustomer);

      const result = await manager.fetchActiveCustomer(mockCustomer.id);
      expect(result).toEqual(mockCustomer);
    });
  });

  describe('finalizeInvoiceWithoutAutoAdvance', () => {
    it('works successfully', async () => {
      const mockInvoice = InvoiceFactory({
        auto_advance: false,
      });

      mockClient.finalizeInvoice = jest.fn().mockResolvedValueOnce({});

      const result = await manager.finalizeInvoiceWithoutAutoAdvance(
        mockInvoice.id
      );
      expect(result).toEqual({});
    });
  });

  describe('getMinimumAmount', () => {
    it('returns minimum amout for valid currency', () => {
      const expected = 50;
      const result = manager.getMinimumAmount('usd');

      expect(result).toEqual(expected);
    });

    it('should throw an error if currency is invalid', () => {
      expect(() => manager.getMinimumAmount('fake')).toThrow(
        'Currency does not have a minimum charge amount available.'
      );
    });
  });

  describe('getTaxIdForCurrency', () => {
    it('returns the correct tax id for currency', async () => {
      const mockCurrency = 'eur';

      const result = manager.getTaxIdForCurrency(mockCurrency);
      expect(result).toEqual('EU1234');
    });

    it('returns empty string when no  tax id found', async () => {
      const mockCurrency = faker.finance.currencyCode();

      const result = manager.getTaxIdForCurrency(mockCurrency);
      expect(result).toEqual(undefined);
    });
  });

  describe('getSubscriptions', () => {
    it('returns subscriptions', async () => {
      const mockSubscription = SubscriptionFactory();
      const mockSubscriptionList = SubscriptionListFactory({
        object: 'list',
        url: '/v1/subscriptions',
        has_more: false,
        data: [mockSubscription],
      });

      const mockCustomer = CustomerFactory({
        subscriptions: {
          object: 'list',
          data: [mockSubscription],
          has_more: true,
          url: '/v1/customers/customer12345/subscriptions',
        },
      });

      const expected = mockSubscriptionList;

      mockClient.fetchSubscriptions = jest
        .fn()
        .mockResolvedValueOnce(mockSubscriptionList);

      const result = await manager.getSubscriptions(mockCustomer.id);
      expect(result).toEqual(expected);
    });
  });

  describe('isCustomerStripeTaxEligible', () => {
    it('should throw an error if no tax in customer', async () => {
      const mockCustomer = CustomerFactory();

      expect(manager.isCustomerStripeTaxEligible(mockCustomer)).rejects.toThrow(
        'customer.tax is not present'
      );
    });

    it('should return true for a taxable customer', async () => {
      const mockCustomer = CustomerFactory({
        tax: {
          automatic_tax: 'supported',
          ip_address: null,
          location: { country: 'US', state: 'CA', source: 'billing_address' },
        },
      });

      const result = await manager.isCustomerStripeTaxEligible(mockCustomer);
      expect(result).toEqual(true);
    });

    it('should return true for a customer in a not-collecting location', async () => {
      const mockCustomer = CustomerFactory({
        tax: {
          automatic_tax: 'not_collecting',
          ip_address: null,
          location: null,
        },
      });

      const result = await manager.isCustomerStripeTaxEligible(mockCustomer);
      expect(result).toEqual(true);
    });
  });
});
