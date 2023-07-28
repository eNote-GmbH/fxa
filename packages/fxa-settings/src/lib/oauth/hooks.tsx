/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import AuthClient from 'fxa-auth-client/browser';
import { useCallback } from 'react';
import { Integration } from '../../models';
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
  integration: Integration,
  accountUid: string,
  sessionToken: string,
  keyFetchToken: string,
  kB: string
) {
  if (
    integration.wantsKeys() &&
    integration.data.scope &&
    integration.data.keysJwk &&
    integration.data.clientId &&
    sessionToken &&
    kB &&
    keyFetchToken
  ) {
    const clientKeyData = await authClient.getOAuthScopedKeyData(
      sessionToken,
      integration.data.clientId,
      integration.data.scope
    );

    if (clientKeyData && Object.keys(clientKeyData).length > 0) {
      const keys = await createEncryptedBundle(
        kB,
        accountUid,
        clientKeyData,
        integration.data.keysJwk
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
  integration: Integration,
  sessionToken: string,
  keysJwe: any
) {
  const opts: any = {
    acr_values: integration.data.acrValues,
    code_challenge: integration.data.codeChallenge,
    code_challenge_method: integration.data.codeChallengeMethod,
    scope: integration.data.scope,
  };
  if (keysJwe) {
    opts.keys_jwe = keysJwe;
  }
  if (integration.data.accessType === 'offline') {
    opts.access_type = integration.data.accessType;
  }

  const result = await authClient.createOAuthCode(
    sessionToken,
    integration.data.clientId,
    integration.data.state,
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
  integration: Integration
): FinishOAuthFlowHandler {
  // TODO: error handling, probably return [handler, error]

  // Ensure a redirect was provided. With out this info, we can't relay the oauth code
  // and state!
  // if (!integration.relier.redirectTo) {
  //   throw new OAuthErrorInvalidRedirectUri();
  // }
  // if (!integration.relier.clientId) {
  //   throw new OAuthErrorInvalidRelierClientId();
  // }
  // if (!integration.relier.state) {
  //   throw new OAuthErrorInvalidRelierState();
  // }
  return useCallback(
    async (accountUid, sessionToken, keyFetchToken, unwrapKB) => {
      const { kB } = await authClient.accountKeys(keyFetchToken, unwrapKB);
      const keys = await constructKeysJwe(
        authClient,
        integration,
        accountUid,
        sessionToken,
        keyFetchToken,
        kB
      );
      const code = await constructOAuthCode(
        authClient,
        integration,
        sessionToken,
        keys
      );
      const redirectUrl = constructOAuthRedirectUrl(
        code,
        integration.data.redirectTo
      );
      return {
        redirect: redirectUrl.href,
      };
    },
    [authClient, integration]
  );
}
