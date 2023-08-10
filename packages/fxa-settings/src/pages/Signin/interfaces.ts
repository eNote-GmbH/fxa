/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { ReactElement } from 'react';
import { IntegrationSubsetType } from '../../lib/integrations';
import { FinishOAuthFlowHandler } from '../../lib/oauth/hooks';
import { MozServices } from '../../lib/types';
import { IntegrationType, OAuthIntegrationData } from '../../models';

export interface SigninFormData {
  email: string;
  password?: string;
}

export type SigninSubmitData = {
  email: string;
  password?: string;
} & SigninParams;

export interface BasicAccountData {
  account: {
    avatar: {
      id: string | null;
      url: string | null;
    };
    primaryEmail: { email: string };
    passwordCreated: number;
    metricsEnabled: boolean;
    linkedAccounts: {
      providerId: number;
      authAt: number;
      enabled: boolean;
    };
  };
}

// TODO Add interface for location state?

// What is in params vs props?
export interface SigninParams {}

// what data is needed for OAuthIntegration?
export interface SigninOAuthIntegration {
  type: IntegrationType.OAuth;
}

export type SigninIntegration = SigninOAuthIntegration | IntegrationSubsetType;

export interface SigninProps {
  avatar?: {
    id: string | null;
    url: string | null;
  };
  bannerErrorMessage?: string | ReactElement;
  email?: string;
  isPasswordNeeded?: boolean;
  thirdPartyAuthEnabled?: boolean;
  serviceName?: MozServices;
  integration: SigninIntegration;
  finishOAuthFlowHandler: FinishOAuthFlowHandler;
}
