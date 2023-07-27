/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { Constants } from '../../lib/constants';
import { IntegrationFlags } from '../../lib/integrations/interfaces/integration-flags';
import { OAuthRelier } from '../reliers';

import {
  BaseIntegration,
  Integration,
  IntegrationFeatures,
  IntegrationType,
} from './base-integration';

interface OAuthIntegrationFeatures extends IntegrationFeatures {
  webChannelSupport: boolean;
}

type OAuthIntegrationTypes =
  | IntegrationType.OAuth
  | IntegrationType.PairingSupplicant;

export type SearchParam = IntegrationFlags['searchParam'];

export function isOAuthIntegration(
  integration: Integration
): integration is OAuthIntegration {
  return (integration as OAuthIntegration).type === IntegrationType.OAuth;
}

export class OAuthIntegration extends BaseIntegration<OAuthIntegrationFeatures> {
  constructor(
    public relier: OAuthRelier,
    type: OAuthIntegrationTypes = IntegrationType.OAuth
  ) {
    super(type);
    this.setFeatures({
      handleSignedInNotification: false,
      reuseExistingSession: true,
      webChannelSupport: relier.context === Constants.OAUTH_WEBCHANNEL_CONTEXT,
    });
  }
}
