/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React, { Ref, useEffect, useState } from 'react';
import { FtlMsg } from 'fxa-react/lib/utils';

import { ReactComponent as GoogleLogo } from './google-logo.svg';
import { ReactComponent as AppleLogo } from './apple-logo.svg';

import { useAccount, useConfig } from '../../models';
import Storage from '../../lib/storage';
import { AUTH_PROVIDER } from 'fxa-auth-client/browser';
import { useRef } from 'react';
import { Config } from '../../lib/config';

export type ThirdPartyAuthProps = {
  enabled?: boolean;
};

/**
 * ThirdPartyAuth component
 * A React component that renders Google and Apple third-party authentication buttons.
 * It handles user sign-in with the respective provider when the buttons are clicked.
 */
const ThirdPartyAuth = ({ enabled = false }: ThirdPartyAuthProps) => {
  const account = useAccount();
  const config = useConfig();
  const googleSignInFormRef = useRef<HTMLFormElement>(null);
  const appleSignInFormRef = useRef<HTMLFormElement>(null);
  const [signInState, setSignInState] = useState({
    mode: 'none',
    state: '',
  });

  useEffect(() => {
    // TODO: Figure out why `storageData` is not available
    const authParams = Storage.factory('localStorage', window).get(
      'fxa_third_party_params'
    );
    if (authParams) {
      completeSignIn();
    }
  });

  /**
   * This effect reacts to changes on sign in state, which responds
   * to users clicking either the google or apple sign in buttons.
   */
  useEffect(() => {
    if (signInState.mode === 'apple') {
      appleSignInFormRef.current?.submit();
    }
    if (signInState.mode === 'google') {
      googleSignInFormRef.current?.submit();
    }
  }, [signInState]);

  if (!enabled) {
    return null;
  }

  /**
   * signIn - Handles the sign-in process for third-party authentication providers.
   * Sets necessary form parameters and submits the form to the provider's authorization
   * endpoint.
   *
   * @param {ThirdPartyAuthSigninParams} config - Configuration parameters for the signIn process.
   */
  function signIn(mode: 'apple' | 'google') {
    clearStoredParams();

    // We stash originating location in the state oauth param
    // because we will need it to use it to log the user into FxA
    const currentParams = new URLSearchParams(window.location.search);
    currentParams.delete('deeplink');
    currentParams.set('showReactApp', 'true');

    setSignInState({
      mode,
      state: encodeURIComponent(
        `${window.location.origin}${
          window.location.pathname
        }?${currentParams.toString()}`
      ),
    });
  }

  async function completeSignIn() {
    try {
      const authParams = Storage.factory('localStorage', window).get(
        'fxa_third_party_params'
      );
      const code = authParams.code;
      const provider = authParams.provider || AUTH_PROVIDER.GOOGLE;

      // Verify and link the third party account to FxA. Note, this
      // will create a new FxA account if one does not exist.
      await account.verifyAccountThirdParty(code, provider);

      // TODO: The response from above contains a session token
      // which can be used to sign the user in to FxA or used
      // to complete an Oauth flow.
    } catch (error) {
      // Fail silently on errors, this could be some leftover
      // state from a previous attempt.
    }

    clearStoredParams();
  }
  function clearStoredParams() {
    // TODO: Use the correct storage mechanism
    Storage.factory('localStorage', window).remove('fxa_third_party_params');
  }

  return (
    <>
      <div className="flex flex-col">
        <div className="text-sm flex items-center justify-center my-6">
          <div className="flex-1 h-px bg-grey-300 divide-x"></div>
          <FtlMsg id="third-party-auth-options-or">
            <div className="mx-4">Or</div>
          </FtlMsg>
          <div className="flex-1 h-px bg-grey-300 divide-x"></div>
        </div>

        <div className="flex flex-col">
          <GoogleSignInForm
            innerRef={googleSignInFormRef}
            state={signInState.state}
            {...{ config }}
          />
          <button
            type="button"
            className="w-full mt-2 justify-center text-black bg-transparent border-black border hover:border-grey-300 font-medium rounded-lg text-sm text-center inline-flex items-center"
            onClick={() => {
              signIn('google');
            }}
          >
            <GoogleLogo />
            <FtlMsg id="continue-with-google-button">
              Continue with Google
            </FtlMsg>
          </button>

          <AppleSignInForm
            innerRef={appleSignInFormRef}
            state={signInState.state}
            {...{ config }}
          />
          <button
            type="button"
            className="w-full mt-2 justify-center text-black bg-transparent border-black border hover:border-grey-300 font-medium rounded-lg text-sm text-center inline-flex items-center"
            onClick={() => {
              signIn('apple');
            }}
          >
            <AppleLogo />
            <FtlMsg id="continue-with-apple-button">Continue with Apple</FtlMsg>
          </button>
        </div>
      </div>
    </>
  );
};

/**
 * Represents the sign in form posted to google third party auth.
 * Note that the innerRef is used by the parent component to trigger
 * a form submission.
 */
const AppleSignInForm = ({
  innerRef,
  state,
  config,
}: {
  innerRef: Ref<HTMLFormElement>;
  state: string;
  config: Config;
}) => {
  if (!state) {
    return <></>;
  }

  console.log('!!! setting AppleSignInForm', state);
  return (
    <form ref={innerRef} action={config.appleAuthConfig.authorizationEndpoint}>
      <input
        type="hidden"
        name="client_id"
        value={config.appleAuthConfig.clientId}
      />
      <input type="hidden" name="scope" value="email" />
      <input
        type="hidden"
        name="redirect_uri"
        value={config.appleAuthConfig.redirectUri}
      />
      <input type="hidden" name="state" value={state} />
      <input type="hidden" name="access_type" value="offline" />
      <input type="hidden" name="prompt" value="consent" />
      <input type="hidden" name="response_type" value="code id_token" />
      <input type="hidden" name="response_mode" value="form_post" />
    </form>
  );
};

/**
 * Represents the sign in form posted to google third party auth.
 * Note that the innerRef is used by the parent component to trigger
 * a form submission.
 */
const GoogleSignInForm = ({
  innerRef,
  state,
  config,
}: {
  innerRef: Ref<HTMLFormElement>;
  state: string;
  config: Config;
}) => {
  if (!state) {
    return <></>;
  }
  console.log('!!! setting GoogleSignInForm', state);
  return (
    <form ref={innerRef} action={config.googleAuthConfig.authorizationEndpoint}>
      <input
        type="hidden"
        name="client_id"
        value={config.googleAuthConfig.clientId}
      />
      <input type="hidden" name="scope" value="openid email profile" />
      <input
        type="hidden"
        name="redirect_uri"
        value={config.googleAuthConfig.redirectUri}
      />
      <input type="hidden" name="state" value={state} />
      <input type="hidden" name="access_type" value="offline" />
      <input type="hidden" name="prompt" value="consent" />
      <input type="hidden" name="response_type" value="code" />
    </form>
  );
};

export default ThirdPartyAuth;
