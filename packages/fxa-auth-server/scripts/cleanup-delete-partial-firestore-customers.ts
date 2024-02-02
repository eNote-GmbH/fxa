/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
/* eslint @typescript-eslint/no-unused-vars: 0 */
import program from 'commander';

import { setupProcessingTaskObjects } from '../lib/payments/processing-tasks-setup';
import { parseDryRun } from './lib/args';
import { Firestore } from '@google-cloud/firestore';
import {
  AccountDeleteReasonsMap,
  AppConfig,
  AuthFirestore,
  AuthLogger,
} from '../lib/types';
import Container from 'typedi';
import { AccountDeleteManager } from '../lib/account-delete';
import { ConfigType } from '../config';
import oauthDb from '../lib/oauth/db';
import { StatsD } from 'hot-shots';
import pushboxApi from '../lib/pushbox';

const pckg = require('../package.json');

class DeletePartialHelper {
  private firestore: Firestore;
  private log: AuthLogger;
  private config: ConfigType;
  private accountDeleteManager: AccountDeleteManager;

  constructor(
    private database: any,
    private batchSize: number,
    private dryRun: boolean
  ) {
    this.firestore = Container.get<Firestore>(AuthFirestore);
    this.log = Container.get(AuthLogger);
    this.config = Container.get(AppConfig);
    this.accountDeleteManager = Container.get(AccountDeleteManager);
  }

  /**
   * Fetches subscriptions from Firestore paginated by batchSize
   * @param startAfter ID of the last element of the previous batch for pagination
   * @returns A list of subscriptions from firestore
   */
  private async fetchFirestoreCustomersUid(startAfter: string | null) {
    const collectionPrefix = `${this.config.authFirestore.prefix}stripe-`;
    const customerCollection = `${collectionPrefix}customers`;

    const customerSnap = await this.firestore
      .collectionGroup(customerCollection)
      .orderBy('id')
      .startAfter(startAfter)
      .limit(this.batchSize)
      .get();

    // Customer document ids are the FxA Account UID
    const uids = customerSnap.docs.map((doc) => doc.id);

    return uids;
  }

  private async getAccountIdsForDelete(uids: string[]) {
    const accountIds: string[] = [];
    for (const uid of uids) {
      try {
        await this.database.account(uid);
      } catch (error) {
        accountIds.push(uid);
      }
    }

    return accountIds;
  }

  private async callPartialDelete(uids: string[]) {
    for (const uid of uids) {
      this.accountDeleteManager.enqueue({
        uid,
        reason: AccountDeleteReasonsMap.cleanup,
      });
    }
  }

  async execute() {
    this.log.debug('DeletePartial.start', {
      batchSize: this.batchSize,
      dryRun: this.dryRun,
    });
    let hasMore = true;
    let startAfter: string | null = null;
    while (hasMore) {
      // 1. Iterate through all the Firestore customers see(convert-customers-tostripe-automatic-tax.ts)
      const customerUids = await this.fetchFirestoreCustomersUid(startAfter);

      startAfter = customerUids.at(-1) as string;
      if (!startAfter) hasMore = false;

      // 2. Check MySQL
      const accountIds = await this.getAccountIdsForDelete(customerUids);

      if (!this.dryRun) {
        // 3. If not exist in mysql, delete partial. (see clean-up-partial-account-customer.ts)
        this.callPartialDelete(accountIds);
      }
    }
  }
}

export async function init() {
  program
    .version(pckg.version)
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
  const batchSize = parseInt(options.batchSize);
  const isDryRun = parseDryRun(options.dryRun);

  const { database: fxaDb } = await setupProcessingTaskObjects(
    'cleanup-delete-partial-firestore'
  );

  const config = Container.get(AppConfig);
  const statsd = Container.get(StatsD);
  const log = Container.get(AuthLogger);
  const pushbox = pushboxApi(log, config, statsd);

  const accountDeleteManager = new AccountDeleteManager({
    fxaDb,
    oauthDb,
    config,
    pushbox,
    statsd,
  });

  Container.set(AccountDeleteManager, accountDeleteManager);

  const deletePartialHelper = new DeletePartialHelper(
    fxaDb,
    batchSize,
    isDryRun
  );

  deletePartialHelper.execute();

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
