/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
/* eslint @typescript-eslint/no-unused-vars: 0 */
import program from 'commander';

import { setupProcessingTaskObjects } from '../lib/payments/processing-tasks-setup';
import { parseDryRun } from './lib/args';
import { Firestore } from '@google-cloud/firestore';
import { AuthFirestore, AuthLogger } from '../lib/types';
import Container from 'typedi';
import { AccountDeleteManager } from '../lib/account-delete';

const pckg = require('../package.json');

class DeletePartialHelper {
  private firestore: Firestore;
  private log: AuthLogger;
  //private accountDeleteManager: AccountDeleteManager;

  constructor(
    private database: any,
    private startDate: Date,
    private endDate: Date,
    private batchSize: number,
    private dryRun: boolean
  ) {
    this.firestore = Container.get<Firestore>(AuthFirestore);
    this.log = Container.get(AuthLogger);
    // TODO - Init and add to Container
    //this.accountDeleteManager = Container.get(AccountDeleteManager);
  }

  async execute() {
    // 1. Iterate through all the Firestore customers see(convert-customers-tostripe-automatic-tax.ts)
    // 2. Check MySQL

    if (!this.dryRun) {
      // 3. If not exist in mysql, delete partial. (see clean-up-partial-account-customer.ts)
    }
  }
}

export async function init() {
  program
    .version(pckg.version)
    .option(
      '--start-date [date]',
      'Start of date range of account creation date, inclusive.',
      Date.parse
    )
    .option(
      '--end-date [date]',
      'End of date range of account creation date, inclusive.',
      Date.parse
    )
    .option(
      '-b, --batch-size [number]',
      'Number of subscriptions to query from firestore at a time.  Defaults to 100.',
      100
    )
    .option(
      '--dry-run [true|false]',
      'Print what the script would do instead of performing the action.  Defaults to true.',
      true
    )
    .parse(process.argv);

  const options = program.opts();
  const startDate = options.startDate;
  const endDate = options.endDate;
  const batchSize = parseInt(options.batchSize);
  const isDryRun = parseDryRun(options.dryRun);
  const hasDateRange = startDate && endDate && endDate > startDate;

  if (!hasDateRange) {
    throw new Error('Invalid date range provided');
  }

  const { database } = await setupProcessingTaskObjects(
    'partial-delete-cleanup'
  );

  return 0;
}

if (require.main === module) {
  init()
    .catch((err) => {
      console.error(err.message);
      process.exit(1);
    })
    .then((result) => process.exit(result));
}
