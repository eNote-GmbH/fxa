/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import Signin from '.';
import { IntegrationType } from '../../models';
import {
  SigninIntegration,
  SigninOAuthIntegration,
  SigninProps,
} from './interfaces';
import {
  createMockSyncDesktopIntegration,
  createMockWebIntegration,
} from '../../lib/integrations/mocks';
import { MOCK_EMAIL } from '../mocks';
import { MozServices } from '../../lib/types';

export const Subject = ({
  integrationType = IntegrationType.Web,
  bannerErrorMessage = '',
  isPasswordNeeded = true,
  thirdPartyAuthEnabled = false,
  serviceName = MozServices.Default,
}: {
  integrationType?: IntegrationType;
} & Partial<SigninProps>) => {
  let signinIntegration: SigninIntegration;
  switch (integrationType) {
    case IntegrationType.OAuth:
      signinIntegration = createMockResetPasswordOAuthIntegration();
      break;
    case IntegrationType.SyncDesktop:
      signinIntegration = createMockSyncDesktopIntegration();
      break;
    case IntegrationType.Web:
    default:
      signinIntegration = createMockWebIntegration();
  }

  return (
    <Signin
      {...{
        bannerErrorMessage,
        isPasswordNeeded,
        thirdPartyAuthEnabled,
        serviceName,
      }}
      email={MOCK_EMAIL}
      integration={signinIntegration}
      finishOAuthFlowHandler={() => Promise.resolve({ redirect: 'someUri' })}
    />
  );
};

function createMockResetPasswordOAuthIntegration(): SigninOAuthIntegration {
  return {
    type: IntegrationType.OAuth,
  };
}
