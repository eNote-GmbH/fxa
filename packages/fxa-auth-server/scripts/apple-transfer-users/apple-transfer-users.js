/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

// This script is used to import users from Apple into FxA. It consumes a CSV
// containing the Apple `transfer_sub` id and exchanges it for their profile information.
// It then creates/updates the user and links the Apple account to the FxA account.
//
// Usage: node scripts/apple-transfer-users.js -i <input file> -o <output file>

const fs = require('fs');
const path = require('path');
const program = require('commander');

const axios = require('axios');
const random = require('../../lib/crypto/random');
const uuid = require('uuid');

const log = require('../../lib/log')({});
const config = require('../../config').config.getProperties();
const Token = require('../../lib/tokens')(log, config);
const AuthDB = require('../../lib/db')(config, log, Token);

const GRANT_TYPE = 'client_credentials';
const SCOPE = 'user.migration';
const USER_MIGRATION_ENDPOINT = 'https://appleid.apple.com/auth/usermigrationinfo';

const APPLE_PROVIDER = 2;

export class AppleUser {
  constructor(email, transferSub, uid, alternateEmails, db) {
    this.email = email;
    this.transferSub = transferSub;
    this.uid = uid;
    this.alternateEmails = alternateEmails || [];
    this.db = db;
  }

  // Exchanges the Apple `transfer_sub` for the user's profile information and
  // moves the user to the new team.
  // Ref: https://developer.apple.com/documentation/sign_in_with_apple/bringing_new_apps_and_users_into_your_team#3559300
  async exchangeIdentifiers(accessToken) {
    try {
      const options = {
        transfer_sub: this.transferSub,
        client_id: config.appleAuthConfig.clientId,
        client_secret: config.appleAuthConfig.clientSecret,
      };
      const res = await axios.post(USER_MIGRATION_ENDPOINT,
        new URLSearchParams(options).toString(),
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      // Data here contains `sub`, `email` and `is_private_email`
      this.appleUserInfo = res.data;
      return res.data;
    } catch (err) {
      this.setFailure(err);
      if (err.response && err.response.status === 429) {
        console.error(`Rate limit exceeded, try again later: ${this.transferSub}`);
      } else {
        console.error(`Something went wrong with transfer: ${this.transferSub} ${err}`);
      }
    }
  }

  setSuccess(accountRecord) {
    this.success = true;
    this.accountRecord = accountRecord;
  }

  setFailure(err) {
    this.success = false;
    this.err = err;
  }

  async createLinkedAccount(accountRecord, sub) {
    // If the user already has a linked account, delete it and create a new one.
    await this.db.deleteLinkedAccount(accountRecord.uid, APPLE_PROVIDER);
    await this.db.createLinkedAccount(accountRecord.uid, sub, APPLE_PROVIDER);
  }

  async createUpdateFxAUser() {
    const sub = this.appleUserInfo.sub; // The recipient team-scoped identifier for the user.
    const appleEmail = this.appleUserInfo.email; // The private email address specific to the recipient team. 
    const isPrivateEmail = this.appleUserInfo.is_private_email; // Boolean if email is private
    
    // TODO, maybe we should mark this failure
    // if (isPrivateEmail) {
    //   this.setFailure({ message: 'Apple email is private' });
    // }

    // 1. Check if user exists in FxA via the uid value from Pocket. We should expect
    // the uid to be valid, but if it isn't error out.
    try {
      if (this.uid) {
        const accountRecord = await this.db.account(this.uid);
        await this.createLinkedAccount(accountRecord, sub);
        this.setSuccess(accountRecord);
        return;
      }
    } catch (err) {
      const msg = `Uid not found: ${this.uid}`;
      console.error(msg);
      this.setFailure(err);
      return;
    }

    // 2. Check all emails to see if there exists a match in FxA, link Apple account
    // to the FxA account.
    let accountRecord;
    // Insert email into the front of alternateEmails array, this will be the
    // most likely to exist in FxA.
    this.alternateEmails.unshift(appleEmail);
    this.alternateEmails.unshift(this.email);
    if (this.alternateEmails) {
      for (const email of this.alternateEmails) {
        try {
          accountRecord = await this.db.accountRecord(email);
          break;
        } catch (err) {
          // Ignore
        }
      }
    }
    // There was a match! Link the Apple account to the FxA account.
    if (accountRecord) {
      await this.createLinkedAccount(accountRecord, sub);
      this.setSuccess(accountRecord);
      return;
    }

    // 3. No matches mean this is a completely new FxA user, create the user and
    // link the Apple account to the FxA account.
    try {
      const emailCode = await random.hex(16);
      const authSalt = await random.hex(32);
      const [kA, wrapWrapKb] = await random.hex(32, 32);
      accountRecord = await this.db.createAccount({
        uid: uuid.v4({}, Buffer.alloc(16)).toString('hex'),
        createdAt: Date.now(),
        email: appleEmail,
        emailCode,
        emailVerified: true,
        kA,
        wrapWrapKb,
        authSalt,
        verifierVersion: config.verifierVersion,
        verifyHash: Buffer.alloc(32).toString('hex'),
        verifierSetAt: 0,
      });
      await this.createLinkedAccount(accountRecord, sub);
      this.setSuccess(accountRecord);
    } catch (err) {
      this.setFailure(err);
    }
  }

  async transferUser(accessToken) {
    await this.exchangeIdentifiers(accessToken);
    await this.createUpdateFxAUser(this.appleUserInfo);
  }
}

export class ApplePocketFxAMigration {
  constructor(filename, config, db) {
    this.users = [];
    this.db = db;
    this.filename = filename;
    this.config = config;
  }

  printUsers() {
    console.table(this.users);
  }
  
  saveResults() {
    const output = this.users.map((user) => {
      const appleEmail = user.appleUserInfo.email;
      const fxaEmail = user.accountRecord.email;
      const uid = user.accountRecord.uid; // Newly created uid
      const transferSub = user.transferSub;
      const success = user.success;
      const err = (user.err && user.err.message) || '';
      return `${transferSub},${uid},${fxaEmail},${appleEmail},${success},${err}`;
    }).join('\n');
    fs.writeFileSync(path.resolve(`${Date.now()}_output.csv`), output);
  }

  parseCSV() {
    try {
      const input = fs
        .readFileSync(path.resolve(this.filename))
        .toString('utf8');

      if (!input.length) {
        return [];
      }

      // Parse the input file CSV style
      return input.split(/\n/).map((s, index) => {
        if (index === 0) return;

        const delimiter = program.delimiter || ',';
        const tokens = s.split(delimiter);
        const transferSub = tokens[0];
        const uid = tokens[1];
        const email = tokens[2];
        let alternateEmails = [];

        if (tokens[3]) {
          alternateEmails = tokens[3].replaceAll('"', '').split(':');
        }
        return new AppleUser(email, transferSub, uid, alternateEmails, this.db);
      }).filter((user) => user);
    } catch (err) {
      console.error('No such file or directory');
      process.exit(1);
    }
  }

  async transferUsers() {
    const accessToken = await this.generateAccessToken();
    for (const user of this.users) {
      await user.transferUser(accessToken);
    }
  }

  async load() {
    this.db = await this.db.connect(config);
    this.users = this.parseCSV();
    console.info(
      '%s accounts loaded from %s',
      this.users.length,
      this.filename,
    );
  }

  async close() {
    await this.db.close();
  }

  async generateAccessToken() {
    const tokenOptions = {
      grant_type: GRANT_TYPE,
      scope: SCOPE,
      client_id: config.appleAuthConfig.clientId,
      client_secret: config.appleAuthConfig.clientSecret,
    };
    const tokenRes = await axios.post(config.appleAuthConfig.tokenEndpoint,
      new URLSearchParams(tokenOptions).toString(),
    );
    console.log('Obtained access token');
    return tokenRes.data['access_token'];
  }
}
