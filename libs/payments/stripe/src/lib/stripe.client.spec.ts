/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { faker } from '@faker-js/faker';
// import { Test, TestingModule } from '@nestjs/testing';

// import { InvoiceFactory } from './factories/invoice.factory';
import { StripeClient } from './stripe.client';
import { InvoiceFactory } from './factories/invoice.factory';

describe('StripeClient', () => {
  let mockClient: StripeClient;

  beforeEach(() => {
    mockClient = new StripeClient({
      apiKey: faker.string.uuid(),
    });
  });

  it('should be defined', () => {
    expect(mockClient).toBeDefined();
  });

  describe('finalizeInvoice', () => {
    it('works successfully', async () => {
      const mockInvoice = InvoiceFactory({
        auto_advance: false,
      });

      mockClient.stripe.invoices.finalizeInvoice = jest
        .fn()
        .mockResolvedValueOnce({});

      const result = await mockClient.finalizeInvoice(mockInvoice.id, {
        auto_advance: false,
      });

      expect(result).toEqual({});
      expect(mockClient.stripe.invoices.finalizeInvoice).toBeCalledWith(
        mockInvoice.id,
        { auto_advance: false }
      );
    });
  });
});
