/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { Injectable } from '@nestjs/common';
import { PayPalClient } from './paypal.client';
import { PayPalManager } from './paypal.manager';
import {
  CurrencyManager,
  CurrencyCountryMismatch,
} from '@fxa/payments/currency';

@Injectable()
export class PayPalService {
  constructor(
    private paypalClient: PayPalClient,
    private paypalManager: PayPalManager,
    private currencyManager: CurrencyManager
  ) {}

  /**
   * Create and verify a billing agreement is funded from the appropriate
   * country given the currency of the billing agreement.
   */
  async createBillingAgreement(options: {
    uid: string;
    token: string;
    currency: string;
  }) {
    const { uid, token, currency } = options;

    const billingAgreement = await this.paypalClient.createBillingAgreement(
      options
    );

    const agreementDetails = await this.paypalManager.getBillingAgreement(
      billingAgreement.BILLINGAGREEMENTID
    );

    const country = agreementDetails.countryCode;

    if (
      !this.currencyManager.isCurrencyCompatibleWithCountry(currency, country)
    ) {
      throw new CurrencyCountryMismatch(currency, country);
    }
  }
}
