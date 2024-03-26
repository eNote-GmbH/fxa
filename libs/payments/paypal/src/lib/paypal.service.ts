/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { Injectable } from '@nestjs/common';
import { PayPalClient } from './paypal.client';
import { PayPalManager } from './paypal.manager';
import { CurrencyManager } from '@fxa/payments/currency';

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
    const billingAgreement = await this.paypalClient.createBillingAgreement(
      options
    );

    const agreementDetails = await this.paypalManager.getBillingAgreement(
      billingAgreement.BILLINGAGREEMENTID
    );

    const country = agreementDetails.countryCode;

    // if (
    //   !this.paypalHelper.currencyHelper.isCurrencyCompatibleWithCountry(
    //     currency,
    //     country
    //   )
    // ) {
    //   throw error.currencyCountryMismatch(currency, country);
    // }
  }
}
