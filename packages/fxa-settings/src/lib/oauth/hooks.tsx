/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import AuthClient from 'fxa-auth-client/browser';
import { useCallback } from 'react';
import { Integration, Relier } from '../../models';
import { createEncryptedBundle } from '../crypto/scoped-keys';

// TODO: should this live in lib/oauth/hooks or lib/hooks? Separate dir per hook?

/**
 * Constructs JSON web encrypted keys
 * @param accountUid - Current account UID
 * @param sessionToken - Current Session Token
 * @param keyFetchToken - Current Key Fetch Token
 * @param kB -The encryption key for class-b data. See eco system docs for more info.
 * @returns JSON Web Ecrypted Kyes
 */
async function constructKeysJwe(
  authClient: AuthClient,
  integrationAndRelier: { relier: Relier; integration: Integration },
  accountUid: string,
  sessionToken: string,
  keyFetchToken: string,
  kB: string
) {
  if (
    integrationAndRelier.relier.wantsKeys() &&
    integrationAndRelier.relier.scope &&
    integrationAndRelier.relier.keysJwk &&
    integrationAndRelier.relier.clientId &&
    sessionToken &&
    kB &&
    keyFetchToken
  ) {
    const clientKeyData = await authClient.getOAuthScopedKeyData(
      sessionToken,
      integrationAndRelier.relier.clientId,
      integrationAndRelier.relier.scope
    );

    if (clientKeyData && Object.keys(clientKeyData).length > 0) {
      const keys = await createEncryptedBundle(
        kB,
        accountUid,
        clientKeyData,
        integrationAndRelier.relier.keysJwk
      );
      return keys;
    }
  }
}

/**
 * Creates a new OAuth Code
 * @param sessionToken - The Current session token
 * @param keysJwe - An encrypted JWE bundle of key material, to be returned to the client when it redeems the authorization code
 * @returns An OAuth code
 */
async function constructOAuthCode(
  authClient: AuthClient,
  integrationAndRelier: { relier: Relier; integration: Integration },
  sessionToken: string,
  keysJwe: any
) {
  const opts: any = {
    acr_values: integrationAndRelier.relier.acrValues,
    code_challenge: integrationAndRelier.relier.codeChallenge,
    code_challenge_method: integrationAndRelier.relier.codeChallengeMethod,
    scope: integrationAndRelier.relier.scope,
  };
  if (keysJwe) {
    opts.keys_jwe = keysJwe;
  }
  if (integrationAndRelier.relier.accessType === 'offline') {
    opts.access_type = integrationAndRelier.relier.accessType;
  }

  const result = await authClient.createOAuthCode(
    sessionToken,
    integrationAndRelier.relier.clientId,
    integrationAndRelier.relier.state,
    opts
  );

  if (!result) {
    // throw new OAuthErrorInvalidOAuthCodeResult();
    throw new Error();
  }

  return result;
}

/**
 * Builds an updated redirect url for the relying party
 * @param oauthCode
 * @returns
 */
function constructOAuthRedirectUrl(
  oauthCode: {
    code: string;
    state: string;
  },
  redirectTo: string
) {
  // Update the state of the redirect URI
  const redirectUri = new URL(redirectTo);
  if (oauthCode.code) {
    redirectUri.searchParams.set('code', oauthCode.code);
  }
  if (oauthCode.state) {
    redirectUri.searchParams.set('state', oauthCode.state);
  }
  return redirectUri;
}

export type FinishOAuthFlowHandler = (
  accountUid: string,
  sessionToken: string,
  keyFetchToken: string,
  unwrapKB: string
) => Promise<{ redirect: string }>;

/**
 * After a password reset, this code can be used to generate a redirect link which relays the new oauth token to the relying party.
 * @param accountUid - Current account uid
 * @param sessionToken - Current session token
 * @param keyFetchToken - Current key fetch token
 * @param unwrapKB - Used to unwrap the account keys
 * @returns An object containing the redirect URL, that can relay the new OAuthCode.
 */
export function useFinishOAuthFlowHandler(
  authClient: AuthClient,
  integrationAndRelier: { relier: Relier; integration: Integration }
): FinishOAuthFlowHandler {
  // TODO: error handling, probably return [handler, error]

  // Ensure a redirect was provided. With out this info, we can't relay the oauth code
  // and state!
  // if (!integrationAndRelier.relier.redirectTo) {
  //   throw new OAuthErrorInvalidRedirectUri();
  // }
  // if (!integrationAndRelier.relier.clientId) {
  //   throw new OAuthErrorInvalidRelierClientId();
  // }
  // if (!integrationAndRelier.relier.state) {
  //   throw new OAuthErrorInvalidRelierState();
  // }
  return useCallback(
    async (accountUid, sessionToken, keyFetchToken, unwrapKB) => {
      const { kB } = await authClient.accountKeys(keyFetchToken, unwrapKB);
      const keys = await constructKeysJwe(
        authClient,
        integrationAndRelier,
        accountUid,
        sessionToken,
        keyFetchToken,
        kB
      );
      const code = await constructOAuthCode(
        authClient,
        integrationAndRelier,
        sessionToken,
        keys
      );
      const redirectUrl = constructOAuthRedirectUrl(
        code,
        integrationAndRelier.relier.redirectTo
      );
      return {
        redirect: redirectUrl.href,
      };
    },
    [authClient, integrationAndRelier]
  );
}
