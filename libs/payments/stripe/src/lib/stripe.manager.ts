/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { Injectable } from '@nestjs/common';
import { Stripe } from 'stripe';
import { StripeClient } from './stripe.client';

@Injectable()
export class StripeManager {
  constructor(private client: StripeClient) {}

  /**
   * Finalizes an invoice and marks auto_advance as false.
   */
  async finalizeInvoiceWithoutAutoAdvance(invoiceId: string) {
    return this.client.finalizeInvoice(invoiceId, {
      auto_advance: false,
    });
  }

  /**
   * Check if customer's automatic tax status indicates that they're eligible for automatic tax.
   * Creating a subscription with automatic_tax enabled requires a customer with an address
   * that is in a recognized location with an active tax registration.
   */
  async isCustomerStripeTaxEligible(customer: Stripe.Customer) {
    if (!customer.tax) {
      // TODO: FXA-8891
      throw new Error('customer.tax is not present');
    }

    return (
      customer.tax?.automatic_tax === 'supported' ||
      customer.tax?.automatic_tax === 'not_collecting'
    );
  }
}
