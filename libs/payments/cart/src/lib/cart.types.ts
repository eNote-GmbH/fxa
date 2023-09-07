/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
import { Cart, CartErrorReasonId } from '@fxa/shared/db/mysql/account';

export type ResultCart = Readonly<Omit<Cart, 'id' | 'uid'>> & {
  readonly id: string;
  readonly uid?: string;
};
export interface TaxAmount {
  title: string;
  amount: number;
}

export interface TaxAddress {
  countryCode: string;
  postalCode: string;
}

export type SetupCart = {
  uid?: string;
  interval: string;
  offeringConfigId: string;
  experiment?: string;
  taxAddress?: TaxAddress;
  couponCode?: string;
  stripeCustomerId?: string;
  email?: string;
  amount: number;
};

export type UpdateCart = {
  uid?: string;
  taxAddress?: string;
  couponCode?: string;
  email?: string;
};

export type FinishCart = {
  uid?: string;
  amount?: number;
  stripeCustomerId?: string;
};

export type FinishErrorCart = {
  uid?: string;
  errorReasonId: CartErrorReasonId;
  amount?: number;
  stripeCustomerId?: string;
};
