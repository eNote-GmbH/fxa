/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { Injectable } from '@nestjs/common';
import { Stripe } from 'stripe';
import { StripeClient } from './stripe.client';

@Injectable()
export class StripeManager {
  constructor(private client: StripeClient) {}

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

  /**
   * Adds the appropriate tax id
   * if customer taxId does not match incoming taxId
   **/
  async addTaxIdToCustomer(customerId: string, taxId: string) {
    // fetch customer by customerId
    const customer = fetchCustomer(customerId, ['tax']);

    // check that customer exists
    if (customer) {
      // check that customer does not already have taxId
      if (!customer.tax && !customer.tax.includes(taxId)) {
        // update customer with incoming taxId
        const updatedCustomer = await this.stripe.customers.update(
          customer.id,
          {
            invoice_settings: {
              custom_fields: [{ name: MOZILLA_TAX_ID, value: taxId }],
            },
          }
        );
        return this.stripeFirestore.insertCustomerRecordWithBackfill(
          customer.metadata.userid,
          updatedCustomer
        );
      }
    }

    return;
  }
}
