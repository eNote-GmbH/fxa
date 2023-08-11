/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
import {
  Cart as CartDB,
  CartFields,
  CartState,
} from '../../../../shared/db/mysql/account/src';

export interface TaxAmount {
  title: string;
  amount: number;
}

export interface Invoice {
  totalAmount: number;
  taxAmounts: TaxAmount[];
}

export type Cart = CartFields & {
  previousInvoice?: Invoice;
  nextInvoice: Invoice;
};

export type SetupCart = Pick<
  CartDB,
  | 'uid'
  | 'interval'
  | 'errorReasonId'
  | 'offeringConfigId'
  | 'experiment'
  | 'taxAddress'
  | 'couponCode'
  | 'stripeCustomerId'
  | 'email'
  | 'amount'
>;

export type UpdateCart = Pick<
  CartDB,
  'id' | 'taxAddress' | 'couponCode' | 'email'
>;

export type FinishCart = Pick<CartDB, 'errorReasonId'> &
  Partial<Pick<CartDB, 'uid' | 'amount' | 'stripeCustomerId'>>;

export interface CartManagerErrorData {
  cartId?: string;
  currentState?: CartState;
  futureState?: CartState;
  action?: string;
  updateCart?: UpdateCart;
  finishCart?: FinishCart;
}
