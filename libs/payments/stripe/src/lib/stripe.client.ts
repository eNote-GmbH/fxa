/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { Injectable } from '@nestjs/common';
import { Stripe } from 'stripe';

import { StripeClientConfig } from './stripe.client.config';

@Injectable()
export class StripeClient {
  public readonly stripe: Stripe;

  constructor(private stripeClientConfig: StripeClientConfig) {
    this.stripe = new Stripe(this.stripeClientConfig.apiKey, {
      apiVersion: '2022-11-15',
      maxNetworkRetries: 3,
    });
  }

  async finalizeInvoice(
    invoiceId: string,
    params?: Stripe.InvoiceFinalizeInvoiceParams | undefined
  ) {
    return this.stripe.invoices.finalizeInvoice(invoiceId, params);
  }
}
