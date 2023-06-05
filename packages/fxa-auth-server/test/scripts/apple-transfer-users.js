/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

const ROOT_DIR = '../..';

const cp = require('child_process');
const util = require('util');
const path = require('path');
const TestServer = require('../test_server');

const execAsync = util.promisify(cp.exec);
const config = require('../../config').config.getProperties();
const fs = require('fs');

const mocks = require(`${ROOT_DIR}/test/mocks`);
const sinon = require('sinon');
const assert = { ...sinon.assert, ...require('chai').assert };

const log = mocks.mockLog();
const Token = require('../../lib/tokens')(log, config);
const UnblockCode = require('../../lib/crypto/random').base32(
  config.signinUnblock.codeLength
);

const DB = require('../../lib/db')(config, log, Token, UnblockCode);

const cwd = path.resolve(__dirname, ROOT_DIR);
const execOptions = {
  cwd,
  env: {
    ...process.env,
    PATH: process.env.PATH || '',
    NODE_ENV: 'dev',
    LOG_LEVEL: 'error',
    AUTH_FIRESTORE_EMULATOR_HOST: 'localhost:9090',
  },
};
const axios = require('axios');
const { ApplePocketFxAMigration, AppleUser } = require('../../scripts/apple-transfer-users/apple-transfer-users');

describe('#integration - scripts/apple-transfer-users:', async function () {
  this.timeout(30000);
  let server, db, sandbox;
  before(async () => {
    server = await TestServer.start(config);
    db = await DB.connect(config);
  });

  beforeEach(async () => {
    sandbox = sinon.createSandbox();
  });
  
  afterEach(() => {
    sandbox.restore();
  });

  after(async () => {
    await TestServer.stop(server);
    await db.close();
  });

  it('fails if no input file', async () => {
    try {
      await execAsync(
        'node -r esbuild-register scripts/apple-transfer-users',
        execOptions
      );
      assert.fail('script should have failed');
    } catch (err) {
      assert.include(err.message, 'Command failed');
    }
  });
});

describe('ApplePocketFxAMigration', function() {
  let sandbox, migration;
  beforeEach(function() {
    sandbox = sinon.createSandbox();

    sandbox.stub(fs, 'readFileSync').returns(`transferSub,uid,email\n1,1,test1@example.com\n2,,test2@example.com\n3,3,test3@example.com\n4,,test4@example.com,"test5@example.com:test6@example.com"`);
    sandbox.stub(axios, 'post').resolves({ data: { access_token: 'valid_access_token' } });
    sandbox.stub(path, 'resolve').returns('valid.csv');
    sandbox.stub(DB, 'connect').resolves({});

    migration = new ApplePocketFxAMigration('valid.csv', config, DB);
  });

  afterEach(function() {
    sandbox.restore();
  });

  it('should load users correctly from a CSV file', async function() {
    await migration.load();

    assert.equal(migration.users.length, 4);
    assert.deepEqual(migration.users[0],{
      email: 'test1@example.com',
      uid: '1',
      transferSub: '1',
      alternateEmails: [],
      db: {}
    });

    assert.deepEqual(migration.users[1],{
      email: 'test2@example.com',
      uid: "",
      transferSub: '2',
      alternateEmails: [],
      db: {}
    });

    assert.deepEqual(migration.users[2],{
      email: 'test3@example.com',
      uid: '3',
      transferSub: '3',
      alternateEmails: [],
      db: {}
    });

    assert.deepEqual(migration.users[3],{
      email: 'test4@example.com',
      uid: '',
      transferSub: '4',
      alternateEmails: ['test5@example.com', 'test6@example.com'],
      db: {}
    });
  });

  it('should generate access token correctly', async function() {
    const token = await migration.generateAccessToken();
    assert.calledOnce(axios.post);
    assert.equal(token,'valid_access_token');
  });

  it('should print users correctly', function() {
    const consoleTableStub = sandbox.stub(console, 'table');
    migration.printUsers();
    assert.calledWith(consoleTableStub, migration.users);
  });

  it('should call transferUser on each user correctly when transferUsers is called', async function() {
    await migration.load();
    migration.users.forEach(user => {
      sandbox.stub(user, 'transferUser').resolves(true);
    });

    await migration.transferUsers();

    migration.users.forEach(user => {
      assert.calledOnce(user.transferUser);
    });
  });

  it('should close db connection correctly when close is called', async function() {
    migration.db = { close: sandbox.stub().resolves() };
    await migration.close();
    assert.calledOnce(migration.db.close);
  });

  it('should save results correctly', function() {
    const writeFileSyncStub = sandbox.stub(fs, 'writeFileSync');

    migration.users = [{
      appleUserInfo: { email: 'apple1@example.com' },
      accountRecord: { email: 'fxa1@example.com', uid: 'uid1' },
      transferSub: 'sub1',
      success: true
    }, {
      appleUserInfo: { email: 'apple2@example.com' },
      accountRecord: { email: 'fxa2@example.com', uid: 'uid2' },
      transferSub: 'sub2',
      success: false,
      err: { message: 'some error' }
    }];

    migration.saveResults();

    const expectedOutput = 'sub1,uid1,fxa1@example.com,apple1@example.com,true,\nsub2,uid2,fxa2@example.com,apple2@example.com,false,some error';
    assert.calledWith(writeFileSyncStub, 'valid.csv', expectedOutput);
  });
});

describe('AppleUser', function() {
  let sandbox, dbStub, user;
  beforeEach(function() {
    sandbox = sinon.createSandbox();
    dbStub = {
      account: sandbox.stub(),
      deleteLinkedAccount: sandbox.stub().resolves(),
      createLinkedAccount: sandbox.stub().resolves(),
      createAccount: sandbox.stub().resolves(),
      accountRecord: sandbox.stub().resolves(),
    };
    user = new AppleUser('pocket@example.com', 'transferSub', 'uid', ['altEmail@example.com'], dbStub);
  });

  afterEach(function() {
    sandbox.restore();
  });

  it('should exchange identifiers correctly and update user', async function() {
    const stub = sandbox.stub(axios, 'post').resolves({ data: { sub: 'sub', email: 'email@example.com', is_private_email: true } });
    const data = await user.exchangeIdentifiers('accessToken');

    assert.calledOnce(stub);
    assert.deepEqual(data, { sub: 'sub', email: 'email@example.com', is_private_email: true });
    assert.deepEqual(user.appleUserInfo, { sub: 'sub', email: 'email@example.com', is_private_email: true });
  });

  it('should link user from FxA uid', async function() {
    const accountRecord = { uid: 'uid', email: 'email@example.com' };
    dbStub.account.resolves(accountRecord);
    user.appleUserInfo = {
      sub: 'sub',
      email: 'email@email.com',
      is_private_email: false
    };
    await user.createUpdateFxAUser();

    assert.calledOnceWithExactly(dbStub.account, user.uid);
    assert.calledOnceWithExactly(dbStub.deleteLinkedAccount, 'uid', 2);
    assert.calledOnceWithExactly(dbStub.createLinkedAccount, 'uid', 'sub', 2);
    assert.isTrue(user.success);
    assert.equal(user.accountRecord,accountRecord);
  });

  it('should link user from Pocket email that has FxA account', async function() {
    dbStub.account.rejects({ 
      errno: 102,
    });

    const accountRecord = { uid: 'uid1', email: 'pocket@example.com' };
    dbStub.accountRecord.resolves(accountRecord);
    
    user.uid = ''; // user does not have an account in FxA

    user.appleUserInfo = {
      sub: 'sub',
      email: 'apple@example.com',
      is_private_email: false
    };

    await user.createUpdateFxAUser();

    assert.calledOnceWithExactly(dbStub.accountRecord, 'pocket@example.com');
    assert.calledOnceWithExactly(dbStub.deleteLinkedAccount, 'uid1', 2);
    assert.calledOnceWithExactly(dbStub.createLinkedAccount, 'uid1', 'sub', 2);
    assert.isTrue(user.success);
    assert.equal(user.accountRecord,accountRecord);
  });

  it('should create user from Apple email without FxA account', async function() {
    dbStub.account.rejects({
      errno: 102,
    });
    dbStub.accountRecord.rejects({
      errno: 102,
    });
    user.uid = ''; // user does not have an account in FxA
    
    const accountRecord = {
      email: 'apple@example.com',
      uid: 'uid2'
    }
    dbStub.createAccount.resolves(accountRecord);

    user.appleUserInfo = {
      sub: 'sub',
      email: 'apple@example.com',
      is_private_email: false
    };

    await user.createUpdateFxAUser();

    assert.calledOnceWithMatch(dbStub.createAccount, { 
      email: 'apple@example.com' 
    });
    
    assert.calledOnceWithExactly(dbStub.deleteLinkedAccount, 'uid2', 2);
    assert.calledOnceWithExactly(dbStub.createLinkedAccount, 'uid2', 'sub', 2);
    assert.isTrue(user.success);
    assert.equal(user.accountRecord, accountRecord);
  });
  
  it('should transfer user correctly', async function() {
    sandbox.stub(user, 'exchangeIdentifiers').resolves();
    sandbox.stub(user, 'createUpdateFxAUser').resolves();
    await user.transferUser('accessToken');

    sinon.assert.calledOnce(user.exchangeIdentifiers);
    sinon.assert.calledOnce(user.createUpdateFxAUser);
  });
});