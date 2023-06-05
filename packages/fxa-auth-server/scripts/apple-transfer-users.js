/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

// This script is used to import users from Apple into FxA. It consumes a CSV
// containing the Apple `transfer_sub` id and exchanges it for their profile information.
// It then creates/updates the user and links the Apple account to the FxA account.
// Example input file: /tests/fixtures/users-apple.csv
//
// Usage: node scripts/apple-transfer-users.js -i <input file> -o <output file>

const {ApplePocketFxAMigration} = require('./apple-transfer-users/apple-transfer-users');

const program = require('commander');

program
  .option('-d, --delimiter [delimiter]', 'Delimiter for input file', ',')
  .option('-o, --output <filename>', 'Output filename to save results to')
  .option(
    '-i, --input <filename>',
    'Input filename from which to read input if not specified on the command line',
  )
  .parse(process.argv);

if (!program.input) {
  console.error('input file must be specified');
  process.exit(1);
}

async function main() {
  const migration = new ApplePocketFxAMigration(program.input);

  await migration.load();
  await migration.printUsers();
  await migration.transferUsers();
  await migration.saveResults();
  await migration.close();
}

main();

