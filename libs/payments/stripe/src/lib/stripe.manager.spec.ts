/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
import { Test, TestingModule } from '@nestjs/testing';

import { CustomerFactory } from './factories/customer.factory';
import { StripeClient } from './stripe.client';
import { StripeManager } from './stripe.manager';

describe('StripeManager', () => {
  let manager: StripeManager;
  let mockStripeClient: StripeClient;
  let mockResult: any;

  beforeEach(async () => {
    mockResult = {};
    mockStripeClient = {};

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        { provide: StripeClient, useValue: mockStripeClient },
        StripeManager,
      ],
    }).compile();

    manager = module.get<StripeManager>(StripeManager);
  });

  it('should be defined', async () => {
    expect(manager).toBeDefined();
    expect(manager).toBeInstanceOf(StripeManager);
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

      mockResult.isCustomerStripeTaxEligible = jest
        .fn()
        .mockReturnValueOnce(true);

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

      mockResult.isCustomerStripeTaxEligible = jest
        .fn()
        .mockReturnValueOnce(true);

      const result = await manager.isCustomerStripeTaxEligible(mockCustomer);
      expect(result).toEqual(true);
    });
  });

  // describe('addTaxIdToCustomer', () => {
  //   it('updates stripe if theres a tax id on the customer', async () => {
  //     const customer = deepCopy(customer1);
  //     stripeHelper.taxIds = { EUR: 'EU1234' };
  //     sandbox.stub(stripeHelper.stripe.customers, 'update').resolves(customer);
  //     stripeFirestore.insertCustomerRecordWithBackfill = sandbox
  //       .stub()
  //       .resolves({});
  //     await stripeHelper.addTaxIdToCustomer(customer);
  //     sinon.assert.calledOnceWithExactly(
  //       stripeHelper.stripe.customers.update,
  //       customer.id,
  //       {
  //         invoice_settings: {
  //           custom_fields: [{ name: MOZILLA_TAX_ID, value: 'EU1234' }],
  //         },
  //       }
  //     );
  //     sinon.assert.calledOnceWithExactly(
  //       stripeFirestore.insertCustomerRecordWithBackfill,
  //       customer.metadata.userid,
  //       customer
  //     );
  //   });

  //   it('does not update stripe with no tax id found', async () => {
  //     const customer = deepCopy(customer1);
  //     stripeHelper.taxIds = { EUR: 'EU1234' };
  //     sandbox.stub(stripeHelper.stripe.customers, 'update').resolves({});

  //     await stripeHelper.addTaxIdToCustomer(customer, 'usd');

  //     sinon.assert.notCalled(stripeHelper.stripe.customers.update);
  //   });
  // });
});
