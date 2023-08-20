/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
import { Kysely } from 'kysely';

import { createDialect, MySQLConfig } from '../../../core/src';
import { DB } from './keysley-types';

export type AccountDatabase = Kysely<DB>;

export async function setupAccountDatabase(opts: MySQLConfig) {
  const dialect = await createDialect(opts);
  return new Kysely<DB>({
    dialect,
  });
}
