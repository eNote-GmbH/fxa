/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
import {
  AccountDatabase,
  PaypalCustomerUpdate,
  NewPaypalCustomer,
} from '@fxa/shared/db/mysql/account';

import { PaypalCustomerNotUpdatedError } from './paypal.error';
import { ResultPaypalCustomer } from './types';

/**
 * Creates a paypalCustomer in the database.
 *
 * @returns The created paypalCustomer or throws an error if the paypalCustomer if it couldn't be created
 */
export async function createPaypalCustomer(
  db: AccountDatabase,
  paypalCustomer: NewPaypalCustomer
) {
  await db
    .insertInto('paypalCustomers')
    .values(paypalCustomer)
    .executeTakeFirstOrThrow();
  return fetchPaypalCustomerByUid(db, paypalCustomer.uid);
}

/**
 * Fetch a paypalCustomer from the database by uid.
 *
 * @returns Fetched paypalCustomer or throws an error if the paypalCustomer does not exist
 */
export async function fetchPaypalCustomerByUid(
  db: AccountDatabase,
  uid: Buffer
) {
  return db
    .selectFrom('paypalCustomers')
    .where('uid', '=', uid)
    .selectAll()
    .executeTakeFirstOrThrow();
}

/**
 * Update a paypalCustomer in the database with a given updated values.
 *
 * Note that the paypalCustomer passed in is not representative of the database after
 * this function is called. If the updated paypalCustomer is needed, it should be fetched
 * from the database again.
 *
 * @returns true if the paypalCustomer was updated, false if the update failed
 */
export async function updatePaypalCustomer(
  db: AccountDatabase,
  paypalCustomerId: Buffer,
  update: Omit<PaypalCustomerUpdate, 'uid'>
): Promise<boolean> {
  const updatedRows = await db
    .updateTable('paypalCustomers')
    .set(update)
    .where('uid', '=', paypalCustomerId)
    .executeTakeFirst();
  if (updatedRows.numUpdatedRows === BigInt(0)) {
    throw new PaypalCustomerNotUpdatedError(paypalCustomerId.toString());
  }
  return true;
}

/**
 * Delete a paypalCustomer from the database.
 *
 * @returns True if the paypalCustomer was deleted, false otherwise
 */
export async function deletePaypalCustomer(
  db: AccountDatabase,
  paypalCustomer: ResultPaypalCustomer
): Promise<boolean> {
  return (
    (
      await db
        .deleteFrom('paypalCustomers')
        .where('uid', '=', Buffer.from(paypalCustomer.uid, 'hex'))
        .executeTakeFirstOrThrow()
    ).numDeletedRows === BigInt(1)
  );
}
