/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { LocationProvider } from '@reach/router';
import ConfirmSignupCode from '.';
import { MozServices } from '../../../lib/types';
import { IntegrationType } from '../../../models';
import { MOCK_REDIRECT_URI, MOCK_SERVICE, MOCK_EMAIL } from '../../mocks';
import {
  BeginSignupHandler,
  SignupBaseIntegration,
  SignupIntegration,
  SignupOAuthIntegration,
} from './interfaces';

export const MOCK_SEARCH_PARAMS = {
  email: MOCK_EMAIL,
};

export function createMockSignupWebIntegration(): SignupBaseIntegration {
  return {
    type: IntegrationType.Web,
    getServiceName: () => Promise.resolve(MozServices.Default),
  };
}

export function createMockSignupSyncDesktopIntegration(): SignupBaseIntegration {
  return {
    type: IntegrationType.SyncDesktop,
    getServiceName: () => Promise.resolve(MozServices.FirefoxSync),
  };
}

export function createMockSignupOAuthIntegration(
  serviceName = MOCK_SERVICE
): SignupOAuthIntegration {
  return {
    type: IntegrationType.OAuth,
    getRedirectUri: () => MOCK_REDIRECT_URI,
    saveOAuthState: () => {},
    getServiceName: () => Promise.resolve(serviceName),
  };
}

export const Subject = ({
  integration = createMockSignupWebIntegration(),
}: {
  queryParams?: Record<string, string>;
  integration?: SignupIntegration;
  beginSignupHandler?: BeginSignupHandler;
}) => {
  return (
    <LocationProvider>
      <ConfirmSignupCode
        {...{
          integration,
        }}
      />
    </LocationProvider>
  );
};
