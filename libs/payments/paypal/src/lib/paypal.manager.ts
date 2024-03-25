/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { Injectable } from '@nestjs/common';
import { Stripe } from 'stripe';

import {
  ACTIVE_SUBSCRIPTION_STATUSES,
  StripeManager,
} from '@fxa/payments/stripe';
import { AccountDatabase } from '@fxa/shared/db/mysql/account';
import { PayPalClient } from './paypal.client';
import { BillingAgreement, BillingAgreementStatus } from './paypal.types';
import { PaypalCustomerManager } from './paypalCustomer/paypalCustomer.manager';

@Injectable()
export class PayPalManager {
  constructor(
    private db: AccountDatabase,
    private client: PayPalClient,
    private stripeManager: StripeManager,
    private paypalCustomerManager: PaypalCustomerManager
  ) {}

  /**
   * Cancels a billing agreement.
   */
  async cancelBillingAgreement(billingAgreementId: string): Promise<void> {
    await this.client.baUpdate({ billingAgreementId, cancel: true });
  }

  /**
   * Get Billing Agreement details by calling the update Billing Agreement API.
   * Parses the API call response for country code and billing agreement status
   */
  async getBillingAgreement(
    billingAgreementId: string
  ): Promise<BillingAgreement> {
    const response = await this.client.baUpdate({ billingAgreementId });
    return {
      city: response.CITY,
      countryCode: response.COUNTRYCODE,
      firstName: response.FIRSTNAME,
      lastName: response.LASTNAME,
      state: response.STATE,
      status:
        response.BILLINGAGREEMENTSTATUS === 'Canceled'
          ? BillingAgreementStatus.Cancelled
          : BillingAgreementStatus.Active,
      street: response.STREET,
      street2: response.STREET2,
      zip: response.ZIP,
    };
  }

  /**
   * Retrieves PayPal subscriptions
   *
   * @param customer
   * @returns
   */
  async getCustomerPayPalSubscriptions(customer: Stripe.Customer) {
    const subscriptions = await this.stripeManager.getSubscriptions(
      customer.id
    );
    return subscriptions.data.filter(
      (sub) =>
        ACTIVE_SUBSCRIPTION_STATUSES.includes(sub.status) &&
        sub.collection_method === 'send_invoice'
    );
  }

  /**
   * Get a token authorizing transaction to move to the next stage.
   * If the call to PayPal fails, a PayPalClientError will be thrown.
   */
  async getCheckoutToken(currencyCode: string) {
    const response = await this.client.setExpressCheckout({ currencyCode });
    return response.TOKEN;
  }

  /**
   * Process an invoice when amount is greater than minimum amount
   *
   * @param customer
   * @param invoice
   * @param ipaddress
   */
  async processNonZeroInvoice(
    customer: Stripe.Customer,
    invoice: Stripe.Invoice,
    ipaddress?: string
  ) {
    // TODO in M3b: Implement legacy processInvoice as processNonZeroInvoice here
    // TODO: Add spec
    console.log(customer, invoice, ipaddress);
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

  /**
   * Process an invoice
   * If amount is less than minimum amount, call processZeroInvoice
   * If amount is greater than minimum amount, call processNonZeroInvoice (legacy PaypalHelper processInvoice)
   *
   * @param invoice
   */
  async processInvoice(invoice: Stripe.Invoice) {
    const amountInCents = invoice.amount_due;

    if (amountInCents < this.stripeManager.getMinimumAmount(invoice.currency)) {
      return await this.processZeroInvoice(invoice.id);
    } else {
      const customer = await this.stripeManager.fetchActiveCustomer(
        invoice.customer as string
      );
      return await this.processNonZeroInvoice(customer, invoice);
    }
  }
}
