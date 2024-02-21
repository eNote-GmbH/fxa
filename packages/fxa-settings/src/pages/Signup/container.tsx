/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { RouteComponentProps, useLocation, useNavigate } from '@reach/router';
import {
  Integration,
  isOAuthIntegration,
  isSyncDesktopV3Integration,
  useAuthClient,
  useConfig,
} from '../../models';
import { Signup } from '.';
import { useValidatedQueryParams } from '../../lib/hooks/useValidate';
import { SignupQueryParams } from '../../models/pages/signup';
import { hardNavigateToContentServer } from 'fxa-react/lib/utils';
import { useMutation } from '@apollo/client';
import {
  BeginSignUpOptions,
  BeginSignupHandler,
  BeginSignupResponse,
} from './interfaces';
import { BEGIN_SIGNUP_MUTATION } from './gql';
import { useCallback, useEffect, useState } from 'react';
import {
  getCredentials,
  getCredentialsV2,
  getKeysV2,
} from 'fxa-auth-client/lib/crypto';
import { GraphQLError } from 'graphql';
import {
  AuthUiErrorNos,
  AuthUiErrors,
  composeAuthUiErrorTranslationId,
} from '../../lib/auth-errors/auth-errors';
import { LoadingSpinner } from 'fxa-react/components/LoadingSpinner';
import { MozServices } from '../../lib/types';
import {
  firefox,
  FirefoxCommand,
  FxAStatusResponse,
} from '../../lib/channels/firefox';
import { Constants } from '../../lib/constants';
import { createSaltV2 } from 'fxa-auth-client/lib/salt';
import { KeyStretchExperiment } from '../../models/experiments/key-stretch-experiment';

/*
 * In content-server, the `email` param is optional. If it's provided, we
 * check against it to see if the account exists and if it does, we redirect
 * users to `/signin`.
 *
 * In the React version, we're temporarily always passing the `email` param over
 * from the Backbone index page until the index page is converted over, in which case
 * we can pass the param with router state. Since we already perform this account exists
 * check on the Backbone index page, which is rate limited since it doesn't require a
 * session token, we also temporarily pass `emailStatusChecked=true` to signal not to perform
 * the check again. If this param is not passed and `email` is, we perform the check and
 * redirect existing user emails to `/signin` to match content-server functionality.
 *
 * If the account exists when signup is attempted, the user will be shown an "Account
 * already exists" error message. In content-server, we attempt to redirect users that are
 * on `/signup` with an account that already exists to where they need to go (Settings or
 * RP redirect) if for example, a user begins signup in one tab and then begins and
 * completes it in another tab. The "Account already exists" error message is only shown
 * when we can't automatically redirect, e.g. if they sign up on another browser or device.
 * If we want to mimic this functionality we can once index is converted.
 */

export type SignupContainerIntegration = Pick<
  Integration,
  'type' | 'getService' | 'features' | 'isSync'
>;

type LocationState = {
  emailStatusChecked?: boolean;
};

const SignupContainer = ({
  integration,
}: {
  integration: SignupContainerIntegration;
} & RouteComponentProps) => {
  const authClient = useAuthClient();
  const keyStretchExp = useValidatedQueryParams(KeyStretchExperiment);
  const navigate = useNavigate();
  const config = useConfig();
  const location = useLocation() as ReturnType<typeof useLocation> & {
    state: LocationState;
  };
  const { emailStatusChecked } = location.state || {};

  const { queryParamModel, validationError } =
    useValidatedQueryParams(SignupQueryParams);

  // Since we may perform an async call on initial render that can affect what is rendered,
  // return a spinner on first render.
  const [showLoadingSpinner, setShowLoadingSpinner] = useState(true);
  const [webChannelEngines, setWebChannelEngines] = useState<
    string[] | undefined
  >();

  const isOAuth = isOAuthIntegration(integration);
  const isSyncOAuth = isOAuth && integration.isSync();
  const isSyncDesktopV3 = isSyncDesktopV3Integration(integration);
  const isSyncWebChannel = isSyncOAuth || isSyncDesktopV3;

  useEffect(() => {
    (async () => {
      // Modify this once index is converted to React
      if (!validationError) {
        // emailStatusChecked can be passed from React Signin when users hit /signin
        // with an email query param that we already determined doesn't exist.
        // It's supplied by Backbone when going from Backbone Index page to React signup.
        if (!queryParamModel.emailStatusChecked && !emailStatusChecked) {
          const { exists, hasLinkedAccount, hasPassword } =
            await authClient.accountStatusByEmail(queryParamModel.email, {
              thirdPartyAuthStatus: true,
            });
          if (exists) {
            if (config.showReactApp.signInRoutes) {
              navigate(`/signin`, {
                replace: true,
                state: {
                  email: queryParamModel.email,
                  hasLinkedAccount,
                  hasPassword,
                },
              });
            } else {
              hardNavigateToContentServer(
                `/signin?email=${queryParamModel.email}`
              );
            }
            // TODO: Probably move this to the Index page onsubmit once
            // the index page is converted to React, we need to run it in
            // signup and signin for Sync
          } else if (isSyncWebChannel) {
            firefox.fxaCanLinkAccount({ email: queryParamModel.email });
          }
        } else if (isSyncWebChannel) {
          // TODO: Probably move this to the Index page onsubmit once
          // the index page is converted to React, we need to run it in
          // signup and signin for Sync
          firefox.fxaCanLinkAccount({ email: queryParamModel.email });
        }
      }
      setShowLoadingSpinner(false);
    })();
  });

  useEffect(() => {
    // This sends a web channel message to the browser to prompt a response
    // that we listen for.
    // TODO: In content-server, we send this on app-start for all integration types.
    // Do we want to move this somewhere else once the index page is Reactified?
    if (isSyncWebChannel) {
      firefox.addEventListener(
        FirefoxCommand.FxAStatus,
        handleFxAStatusSyncEngineEvent
      );

      // requestAnimationFrame ensures the event listener is added first
      // otherwise, there is a race condition
      requestAnimationFrame(() => {
        firefox.send(FirefoxCommand.FxAStatus, {
          // TODO: Improve getting 'context', probably set this on the integration
          context: isSyncDesktopV3
            ? Constants.FX_DESKTOP_V3_CONTEXT
            : Constants.OAUTH_CONTEXT,
          isPairing: false,
          service: Constants.SYNC_SERVICE,
        });
      });
    }
  });

  const handleFxAStatusSyncEngineEvent = (event: any) => {
    const status = event.detail as FxAStatusResponse;
    if (!webChannelEngines && status.capabilities.engines) {
      // choose_what_to_sync may be disabled for mobile sync, see:
      // https://github.com/mozilla/application-services/issues/1761
      if (
        isSyncDesktopV3 ||
        (isSyncOAuth && status.capabilities.choose_what_to_sync)
      ) {
        setWebChannelEngines(status.capabilities.engines);
        firefox.removeEventListener(
          FirefoxCommand.FxAStatus,
          handleFxAStatusSyncEngineEvent
        );
      }
    }
  };

  const [beginSignup] = useMutation<BeginSignupResponse>(BEGIN_SIGNUP_MUTATION);

  const beginSignupHandler: BeginSignupHandler = useCallback(
    async (email, password, atLeast18AtReg) => {
      const service = integration.getService();
      const options: BeginSignUpOptions = {
        verificationMethod: 'email-otp',
        // keys must be true to receive keyFetchToken for oAuth and syncDesktop
        keys: isOAuth || isSyncDesktopV3,
        service: service !== MozServices.Default ? service : undefined,
        atLeast18AtReg,
      };
      try {
        const credentialsV1 = await getCredentials(email, password);

        // If enabled, add in V2 key stretching support
        let credentialsV2 = undefined;
        let passwordV2 = undefined;
        if (keyStretchExp.queryParamModel.isV2(config)) {
          credentialsV2 = await getCredentialsV2({
            password,
            clientSalt: await createSaltV2(),
          });
          const { wrapKb, wrapKbVersion2 } = await getKeysV2({
            v1: credentialsV1,
            v2: credentialsV2,
          });

          passwordV2 = {
            wrapKb,
            wrapKbVersion2,
            authPWVersion2: credentialsV2.authPW,
            clientSalt: credentialsV2.clientSalt,
          };
        }

        const authPW = credentialsV1.authPW;
        const input =
          passwordV2 != null
            ? {
                email,
                authPW,
                passwordV2,
                options,
              }
            : {
                email,
                authPW,
                options,
              };
        const { data } = await beginSignup({
          variables: {
            input,
          },
        });

        if (data) {
          return {
            data: {
              ...data,
              unwrapBKey: credentialsV2
                ? credentialsV2.unwrapBKey
                : credentialsV1.unwrapBKey,
            },
          };
        }

        return { data: null };
      } catch (error) {
        const graphQLError: GraphQLError = error.graphQLErrors?.[0];
        if (graphQLError && graphQLError.extensions?.errno) {
          const { errno } = graphQLError.extensions as { errno: number };
          return {
            error: {
              errno,
              message: AuthUiErrorNos[errno].message,
              ftlId: composeAuthUiErrorTranslationId({ errno }),
            },
          };
        } else {
          // TODO: why is `errno` in `AuthServerError` possibly undefined?
          // might want to grab from `ERRORS.UNEXPECTED_ERROR` instead
          const { errno = 999, message } = AuthUiErrors.UNEXPECTED_ERROR;
          return {
            data: null,
            error: {
              errno,
              message,
              ftlId: composeAuthUiErrorTranslationId({ errno }),
            },
          };
        }
      }
    },
    [beginSignup, integration, isSyncDesktopV3, isOAuth, keyStretchExp]
  );

  // TODO: probably a better way to read this?
  if (window.document.cookie.indexOf('tooyoung') > -1) {
    navigate('/cannot_create_account');
  }

  if (showLoadingSpinner) {
    return <LoadingSpinner fullScreen />;
  }

  if (validationError) {
    hardNavigateToContentServer('/');
    return <LoadingSpinner fullScreen />;
  }

  return (
    <Signup
      {...{
        integration,
        queryParamModel,
        beginSignupHandler,
        webChannelEngines,
        isSyncWebChannel,
        isSyncOAuth,
      }}
    />
  );
};

export default SignupContainer;
