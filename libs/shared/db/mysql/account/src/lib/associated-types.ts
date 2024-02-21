/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
/**
 * Additional associated types for kysley db types.
 */
import { Insertable, Selectable, Updateable } from 'kysely';

import {
  AccountCustomers,
  Accounts,
  Carts,
  PaypalCustomers,
} from './keysley-types';

export type Account = Selectable<Accounts>;
export type NewAccount = Insertable<Accounts>;
export type AccountUpdate = Updateable<Accounts>;

export type AccountCustomer = Selectable<AccountCustomers>;
export type NewAccountCustomer = Insertable<AccountCustomers>;
export type AccountCustomerUpdate = Updateable<AccountCustomers>;

export type PaypalCustomer = Selectable<PaypalCustomers>;
export type NewPaypalCustomer = Insertable<PaypalCustomers>;
export type PaypalCustomerUpdate = Updateable<PaypalCustomers>;

export type Cart = Selectable<Carts>;
export type NewCart = Insertable<Carts>;
export type CartUpdate = Updateable<Carts>;
