/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { test, expect } from '../../lib/fixtures/standard';
import AuthClient, {
  getCredentialsV2,
  getCredentials,
} from 'fxa-auth-client/browser';
import crypto from 'crypto';
import { SaltVersion } from 'fxa-auth-client/lib/salt';

let curClient: AuthClient | undefined;
function getClient(url: string, version: SaltVersion) {
  curClient = new AuthClient(url, {
    keyStretchVersion: version,
  });
  return curClient;
}

test.describe('auth-client-tests', () => {
  let email = '';
  let password = '';
  let credentials: any;

  async function signUp(client: AuthClient) {
    credentials = await client.signUp(email, password, {
      keys: true,
      preVerified: 'true',
    });

    await client.deviceRegister(
      credentials.sessionToken,
      'playwright',
      'tester'
    );
    expect(credentials?.uid).toHaveLength(32);
    expect(credentials?.sessionToken).toHaveLength(64);
    expect(credentials?.keyFetchToken).toHaveLength(64);
    expect(credentials?.unwrapBKey).toHaveLength(64);

    return credentials;
  }

  test.beforeEach(({}, { project }) => {
    test.skip(project.name === 'production');

    email = `signin${crypto.randomBytes(8).toString('hex')}@restmail.net`;
    password = `${crypto.randomBytes(10).toString('hex')}`;
  });

  test.afterEach(async ({ target }) => {
    await curClient?.accountDestroy(email, password);
  });

  test('it creates with v1 and signs in', async ({ target }) => {
    const client = getClient(target.authServerUrl, 1);

    await signUp(client);

    // Check the salt is V1
    const status = await client.getCredentialStatusV2(email);
    expect(status.upgradeNeeded).toBeTruthy();
    expect(status.currentVersion).toEqual('v1');
    expect(status.clientSalt).toBeUndefined();

    // Login IN
    const signInResult = await client.signIn(email, password, { keys: true });
    expect(signInResult.keyFetchToken).toBeDefined();
    expect(signInResult.unwrapBKey).toBeDefined();

    // Check unwrapKB. It should match our V1 credential unwrapBKey.
    expect((await getCredentials(email, password)).unwrapBKey).toEqual(
      signInResult.unwrapBKey
    );

    // We are using a V1 client, there should be no change to the credential status
    const status2 = await client.getCredentialStatusV2(email);
    expect(status2).toBeDefined();
    expect(status2.upgradeNeeded).toBeTruthy();
    expect(status2.currentVersion).toEqual('v1');
    expect(status2.clientSalt).toBeUndefined();
  });

  test('it creates with v2 and signs in', async ({ target }) => {
    const client = getClient(target.authServerUrl, 2);
    await signUp(client);

    // Check the salt is V1
    const status = await client.getCredentialStatusV2(email);
    expect(status.currentVersion).toBe('v2');
    expect(status.clientSalt).toMatch('quickStretchV2:');
    expect(status.upgradeNeeded).toBeFalsy();

    // Login IN
    const signInResult = await client.signIn(email, password, { keys: true });
    expect(signInResult).toBeDefined();
    expect(signInResult.keyFetchToken).toBeDefined();
    expect(signInResult.unwrapBKey).toBeDefined();

    // Check unwrapKB. It should match our V2 credential unwrapBKey.
    const clientSalt =
      (await client.getCredentialStatusV2(email))?.clientSalt || '';
    const credentialsV2 = await getCredentialsV2({ password, clientSalt });
    expect(credentialsV2.unwrapBKey).toEqual(signInResult.unwrapBKey);
    const credentialsV1 = await getCredentials(email, password);
    expect(credentialsV1.unwrapBKey).not.toEqual(signInResult.unwrapBKey);
  });

  test('it creates with v1 and upgrades to v2 on signin', async ({
    target,
  }) => {
    const client = getClient(target.authServerUrl, 1);
    await signUp(client);
    const singInResult = await client.signIn(email, password, { keys: true });
    expect(singInResult.keyFetchToken).toBeDefined();
    expect(singInResult.unwrapBKey).toBeDefined();

    // Grab keys, so we can compare kA and kB later
    const keys1 = await client.accountKeys(
      singInResult.keyFetchToken,
      singInResult.unwrapBKey
    );
    expect(keys1).toBeDefined();
    expect(keys1.kA).toBeDefined();
    expect(keys1.kB).toBeDefined();

    // Create v2 client
    const client2 = getClient(target.authServerUrl, 2);

    // Check that status is still v1 for the current credentials
    const statusBefore = await client2.getCredentialStatusV2(email);
    expect(statusBefore).toBeDefined();
    expect(statusBefore.upgradeNeeded).toBeTruthy();
    expect(statusBefore.clientSalt).toBeUndefined();
    expect(statusBefore.currentVersion).toBe('v1');

    // The sign in should automatically reset the password
    const signInResult2 = await client2.signIn(email, password, {
      keys: true,
    });
    expect(signInResult2).toBeDefined();
    expect(signInResult2.keyFetchToken).toBeDefined();
    expect(signInResult2.unwrapBKey).toBeDefined();

    // Check the status after the signin
    const statusAfter = await client2.getCredentialStatusV2(email);
    expect(statusAfter).toBeDefined();
    expect(statusAfter.upgradeNeeded).toBeFalsy();
    expect(statusAfter.clientSalt).toBeDefined();
    expect(statusAfter.clientSalt).toMatch('quickStretchV2:');
    expect(statusAfter.currentVersion).toBe('v2');

    // Check unwrapKB. It should match our V2 credential unwrapBKey.
    const clientSalt =
      (await client.getCredentialStatusV2(email))?.clientSalt || '';
    const credentialsV2 = await getCredentialsV2({ password, clientSalt });
    expect(credentialsV2.unwrapBKey).toEqual(signInResult2.unwrapBKey);

    const credentialsV1 = await getCredentials(email, password);
    expect(credentialsV1.unwrapBKey).not.toEqual(signInResult2.unwrapBKey);

    // Check that keys didn't drift
    const keys2 = await client2.accountKeys(
      signInResult2.keyFetchToken,
      signInResult2.unwrapBKey
    );
    expect(keys2).toBeDefined();
    expect(keys2.kA).toBeDefined();
    expect(keys2.kB).toBeDefined();
    expect(keys2.kA).toEqual(keys1.kA);
    expect(keys2.kB).toEqual(keys1.kB);
  });
});
