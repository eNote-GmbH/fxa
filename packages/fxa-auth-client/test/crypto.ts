/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as assert from 'assert';
import '../server'; // must import this to run with nodejs
import {
  getCredentials,
  getCredentialsV2,
  hkdf,
  jweDecrypt,
  jweEncrypt,
  unbundleKeyFetchResponse,
} from 'fxa-auth-client/lib/crypto';
import {
  randomKey,
  getRecoveryKeyIdByUid,
} from 'fxa-auth-client/lib/recoveryKey';
import { hexToUint8 } from 'fxa-auth-client/lib/utils';
import { createSaltV1, createSaltV2 } from '../lib/salt';

const uid = 'aaaaabbbbbcccccdddddeeeeefffff00';

describe('lib/crypto', () => {
  describe('getCredentials', () => {
    it('returns the correct authPW and unwrapBKey', async () => {
      const email = 'andré@example.org';
      const password = 'pässwörd';
      const keys = await getCredentials(email, password);
      assert.equal(
        keys.authPW,
        '247b675ffb4c46310bc87e26d712153abe5e1c90ef00a4784594f97ef54f2375'
      );
      assert.equal(
        keys.unwrapBKey,
        'de6a2648b78284fcb9ffa81ba95803309cfba7af583c01a8a1a63e567234dd28'
      );
    });
  });

  describe('getCredentialsV2', () => {
    it('returns the correct authPW and unwrapBKey with v1 salt', async () => {
      const email = 'andré@example.org';
      const password = 'pässwörd';
      const salt = createSaltV1(email);
      const keys = await getCredentialsV2(password, salt);
      assert.equal(
        keys.authPW,
        '247b675ffb4c46310bc87e26d712153abe5e1c90ef00a4784594f97ef54f2375'
      );
      assert.equal(
        keys.unwrapBKey,
        'de6a2648b78284fcb9ffa81ba95803309cfba7af583c01a8a1a63e567234dd28'
      );
    });

    it('returns the correct authPW and unwrapBKey with V2 salt', async () => {
      const password = 'pässwörd';
      const salt = createSaltV2('0123456789abcdef0123456789abcdef');
      const keys = await getCredentialsV2(password, salt);
      assert.equal(
        keys.authPW,
        '018df3f63a363ef0b75b3f92800205f63262139df7f75242dfb0a93f7f6dac43'
      );
      assert.equal(
        keys.unwrapBKey,
        'd108adf05d99f8c10de30b3d9bbafc31fc2f6e53ef8ddbc0de41a1eba941e93c'
      );
    });
  });

  describe('unbundleKeyFetchResponse', () => {
    it('returns the correct kA and wrapKB', async () => {
      const bundleKey =
        'dedd009a8275a4f672bb4b41e14a117812c0b2f400c85fa058e0293f3f45726a';
      const bundle =
        'df4717238a738501bd2ad8f7114ef193ea69751a40108149bfb88a5643a8d683a1e75b705d4db135130f0896dbac0819ab7d54334e0cd4f9c945e0a7ada91899756cedf4384be404844050270310bc2b396f100eeda0c7b428cfe77c40a873ae';
      const keys = await unbundleKeyFetchResponse(bundleKey, bundle);
      assert.equal(
        keys.kA,
        '939282904b808c6003ea31aeb14bc766d2ab70ba7dcaa54f820efcf4762b9619'
      );
      assert.equal(
        keys.wrapKB,
        '849ac9f71643ace46dcdd384633ec1bffe565852806ee2f859c3eba7fafeafec'
      );
    });
  });

  describe('jwe', () => {
    it('should encrypt and decrypt', async () => {
      const recoveryKey = await randomKey();
      const encoder = new TextEncoder();
      const salt = hexToUint8(uid);
      const data = {
        kB: 'aaaa',
      };
      const recoveryKeyId = await getRecoveryKeyIdByUid(recoveryKey, uid);

      const encryptionKey = await hkdf(
        recoveryKey,
        salt,
        encoder.encode('fxa recovery encrypt key'),
        32
      );

      const encryptedData = await jweEncrypt(
        encryptionKey,
        recoveryKeyId,
        encoder.encode(JSON.stringify(data))
      );
      const decryptedData = await jweDecrypt(encryptionKey, encryptedData);

      assert.deepEqual(JSON.parse(decryptedData), data);
    });
  });
});
