/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import ReactGA from 'react-ga4';
import { Plan } from 'fxa-shared/subscriptions/types';

export enum GAEvent {
  ADD_PAYMENT_INFO = 'add_payment_info',
  PURCHASE = 'purchase',
  PURCHASE_SUBMIT = 'purchase_submit',
  SIGN_UP = 'sign_up',
}

export enum GAPaymentType {
  CREDIT_CARD = 'Credit Card',
  PAYPAL = 'PayPal',
  NOT_CHOSEN = 'Not chosen',
  UNDEFINED = 'Not chosen',
}

export enum GAPurchaseType {
  NEW = 'new purchase',
  UPGRADE = 'upgrade',
}

const recommendedEvents = {
  add_payment_info: 'add_payment_info',
  purchase: 'purchase',
  sign_up: 'sign_up',
};

interface ReactGALogProps {
  eventName: (typeof GAEvent)[keyof typeof GAEvent];
  plan?: Plan;
  paymentType?: (typeof GAPaymentType)[keyof typeof GAPaymentType];
  discount?: number | undefined;
  purchaseType?: (typeof GAPurchaseType)[keyof typeof GAPurchaseType];
}

interface ItemsProps {
  item_id: string;
  item_name: string | undefined;
  item_brand?: string;
  item_variant?: string;
  price?: number | null | undefined;
  discount?: number;
}

interface PlanOptionsProps {
  currency: string;
  value: number | null;
  items: ItemsProps[];
  payment_type?: (typeof GAPaymentType)[keyof typeof GAPaymentType];
  purchase_type?: (typeof GAPurchaseType)[keyof typeof GAPurchaseType];
}

export const ReactGALog = {
  eventTracker: ({
    eventName,
    plan,
    paymentType,
    discount,
    purchaseType,
  }: ReactGALogProps) => {
    console.log('start', eventName, paymentType, discount, purchaseType);
    if (plan) {
      const {
        amount,
        currency: currencyCode,
        interval,
        plan_id: planId,
        plan_name: planName,
        product_name: productName,
      } = plan;

      let planOptions: PlanOptionsProps = {
        currency: currencyCode,
        value: amount,
        payment_type: paymentType,
        items: [
          {
            item_id: planId,
            item_name: planName,
            item_brand: productName,
            item_variant: interval,
            price: amount,
            discount,
          },
        ],
        purchase_type: purchaseType,
      };

      if (recommendedEvents[eventName]) {
        return ReactGA.gtag('event', eventName, planOptions);
      } else {
        return ReactGA.event(eventName, planOptions);
      }
    } else {
      return ReactGA.gtag('event', eventName);
    }
  },
};
