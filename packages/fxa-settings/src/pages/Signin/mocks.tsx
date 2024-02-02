/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import Signin from '.';
import VerificationMethods from '../../constants/verification-methods';
import VerificationReasons from '../../constants/verification-reasons';
import { MozServices } from '../../lib/types';
import { IntegrationType } from '../../models';
import {
  MOCK_AUTH_AT,
  MOCK_EMAIL,
  MOCK_SESSION_TOKEN,
  MOCK_UID,
  MOCK_AVATAR_NON_DEFAULT,
} from '../mocks';
import {
  BeginSigninHandler,
  BeginSigninResponse,
  BeginSigninResultHandlerError,
  CachedSigninHandler,
  CachedSigninHandlerError,
  SigninIntegration,
  SigninProps,
} from './interfaces';
import { LocationProvider } from '@reach/router';
import {
  AuthUiErrorNos,
  AuthUiErrors,
} from '../../lib/auth-errors/auth-errors';

export function createMockSigninWebIntegration(): SigninIntegration {
  return {
    type: IntegrationType.Web,
    isSync: () => false,
  };
}

export function createMockSigninSyncIntegration(): SigninIntegration {
  return {
    type: IntegrationType.SyncDesktopV3,
    isSync: () => true,
  };
}

const MOCK_VERIFICATION = {
  verificationMethod: VerificationMethods.EMAIL_OTP,
  verificationReason: VerificationReasons.SIGN_IN,
};

export function createBeginSigninResponse({
  uid = MOCK_UID,
  sessionToken = MOCK_SESSION_TOKEN,
  authAt = MOCK_AUTH_AT,
  metricsEnabled = true,
  verified = true,
  verificationMethod = MOCK_VERIFICATION.verificationMethod,
  verificationReason = MOCK_VERIFICATION.verificationReason,
}: Partial<BeginSigninResponse['signIn']> = {}): { data: BeginSigninResponse } {
  return {
    data: {
      signIn: {
        uid,
        sessionToken,
        authAt,
        metricsEnabled,
        verified,
        verificationMethod,
        verificationReason,
      },
    },
  };
}

export function createBeginSigninResponseError({
  errno = AuthUiErrors.INCORRECT_PASSWORD.errno!,
  verificationMethod,
  verificationReason,
}: Partial<BeginSigninResultHandlerError> = {}): {
  error: BeginSigninResultHandlerError;
} {
  const message = AuthUiErrorNos[errno].message;
  return {
    error: {
      errno,
      verificationMethod,
      verificationReason,
      message,
      ftlId: 'fake-id',
    },
  };
}

export function createCachedSigninResponseError({
  errno = AuthUiErrors.SESSION_EXPIRED.errno!,
} = {}): {
  error: CachedSigninHandlerError;
} {
  const message = AuthUiErrorNos[errno].message;
  return {
    error: {
      errno,
      message,
      ftlId: 'fake-id',
    },
  };
}

export const CACHED_SIGNIN_HANDLER_RESPONSE = {
  data: {
    verified: true,
    sessionVerified: true,
    emailVerified: true,
    ...MOCK_VERIFICATION,
  },
};

export const mockBeginSigninHandler: BeginSigninHandler = () =>
  Promise.resolve(createBeginSigninResponse());

export const mockCachedSigninHandler: CachedSigninHandler = () =>
  Promise.resolve(CACHED_SIGNIN_HANDLER_RESPONSE);

export const Subject = ({
  integration = createMockSigninWebIntegration(),
  sessionToken = undefined,
  serviceName = MozServices.Default,
  hasLinkedAccount = false,
  hasPassword = true,
  avatarData = { account: { avatar: { ...MOCK_AVATAR_NON_DEFAULT } } },
  avatarLoading = false,
  email = MOCK_EMAIL,
  beginSigninHandler = mockBeginSigninHandler,
  cachedSigninHandler = mockCachedSigninHandler,
  ...props // overrides
}: Partial<SigninProps> = {}) => (
  <LocationProvider>
    <Signin
      {...{
        integration,
        email,
        sessionToken,
        serviceName,
        hasLinkedAccount,
        beginSigninHandler,
        cachedSigninHandler,
        hasPassword,
        avatarData,
        avatarLoading,
        ...props,
      }}
    />
  </LocationProvider>
);
