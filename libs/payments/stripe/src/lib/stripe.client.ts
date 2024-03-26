/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { Injectable } from '@nestjs/common';
import { Stripe } from 'stripe';

import { StripeClientConfig } from './stripe.client.config';
import {
  StripeCustomer,
  StripeDeletedCustomer,
  StripeInvoice,
  StripeSubscription,
} from './stripe.client.types';

/**
 * A wrapper for Stripe that enforces that results have deterministic typings
 * that represent their expanded/unexpanded state.
 */
@Injectable()
export class StripeClient {
  public readonly stripe: Stripe;

  constructor(private stripeClientConfig: StripeClientConfig) {
    this.stripe = new Stripe(this.stripeClientConfig.apiKey, {
      apiVersion: '2022-11-15',
      maxNetworkRetries: 3,
    });
  }

  /**
   * Retrieves a customer record directly from Stripe
   *
   * @param customerId The Stripe customer ID of the customer to fetch
   * @returns The customer record for the customerId provided
   */
  async fetchCustomer(customerId: string) {
    const result = await this.stripe.customers.retrieve(customerId, {
      expand: ['tax'],
    });
    return result as StripeCustomer | StripeDeletedCustomer;
  }

  async fetchSubscriptions(customerId: string) {
    const result = await this.stripe.subscriptions.list({
      customer: customerId,
    });

    return result as Stripe.ApiList<StripeSubscription>;
  }

  async finalizeInvoice(
    invoiceId: string,
    params?: Stripe.InvoiceFinalizeInvoiceParams | undefined
  ) {
    const result = await this.stripe.invoices.finalizeInvoice(
      invoiceId,
      params
    );
    return result as StripeInvoice;
  }
}
