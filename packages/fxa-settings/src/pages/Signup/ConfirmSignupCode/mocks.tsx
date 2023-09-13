/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import { LocationProvider } from '@reach/router';
import ConfirmSignupCode from '.';
import { IntegrationType } from '../../../models';
import {
  MOCK_REDIRECT_URI,
  MOCK_SERVICE,
  MOCK_EMAIL,
  MOCK_UID,
} from '../../mocks';
import {
  ConfirmSignupCodeBaseIntegration,
  ConfirmSignupCodeIntegration,
  ConfirmSignupCodeOAuthIntegration,
} from './interfaces';

export const MOCK_SEARCH_PARAMS = {
  email: MOCK_EMAIL,
};

export const MOCK_AUTH_ERROR = {
  errno: 999,
  message: 'Something broke',
};

export function createMockWebIntegration(): ConfirmSignupCodeBaseIntegration {
  return {
    type: IntegrationType.Web,
    data: { uid: MOCK_UID },
  };
}

// TODO add createMockSyncIntegration in FXA-

export function createMockOAuthIntegration(
  serviceName = MOCK_SERVICE
): ConfirmSignupCodeOAuthIntegration {
  return {
    type: IntegrationType.OAuth,
    data: { uid: MOCK_UID },
    getRedirectUri: () => MOCK_REDIRECT_URI,
    getService: () => Promise.resolve(serviceName),
  };
}

export const Subject = ({
  integration = createMockWebIntegration(),
}: {
  queryParams?: Record<string, string>;
  integration?: ConfirmSignupCodeIntegration;
}) => {
  return (
    <LocationProvider>
      <ConfirmSignupCode
        {...{
          integration,
        }}
        finishOAuthFlowHandler={() => Promise.resolve({ redirect: 'someUri' })}
      />
    </LocationProvider>
  );
};
