/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { Injectable } from '@nestjs/common';

import { StripeManager } from '@fxa/payments/stripe';
import { AccountDatabase } from '@fxa/shared/db/mysql/account';
import { PayPalClient } from './paypal.client';

@Injectable()
export class PayPalManager {
  constructor(
    private db: AccountDatabase,
    private client: PayPalClient,
    private stripeManager: StripeManager
  ) {}

  /**
   * Get a token authorizing transaction to move to the next stage.
   * If the call to PayPal fails, a PayPalClientError will be thrown.
   */
  async getCheckoutToken(currencyCode: string) {
    const response = await this.client.setExpressCheckout({ currencyCode });
    return response.TOKEN;
  }

  /**
   * Finalize and process a draft invoice that has no amounted owed.
   *
   * @param invoice
   */
  async processZeroInvoice(invoiceId: string) {
    // It appears for subscriptions that do not require payment, the invoice
    // transitions to paid automatially.
    // https://stripe.com/docs/billing/invoices/subscription#sub-invoice-lifecycle
    return this.stripeManager.finalizeInvoiceWithoutAutoAdvance(invoiceId);
  }
}
