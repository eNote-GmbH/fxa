/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {
  BaseIntegration,
  BrowserIntegration,
  ClientInfo,
  OAuthIntegration,
  PairingAuthorityIntegration,
  PairingSupplicantIntegration,
  Integration,
  RelierSubscriptionInfo,
} from '../../models/integrations';
import { Constants } from '../constants';
import {
  ModelDataStore,
  GenericData,
  StorageData,
  UrlHashData,
  UrlQueryData,
} from '../model-data';
import { OAuthError } from '../oauth';
import { ReachRouterWindow } from '../window';
import { IntegrationFlags } from '../reliers/interfaces';
import { Delegates } from '../reliers/interfaces/relier-delegates';
import { DefaultIntegrationFlags } from '../reliers/relier-factory-flags';
import config from '../config';
import { WebIntegration } from '../../models';

/**
 * Checks a redirect value.
 */
export function isCorrectRedirect(
  queryRedirectUri: string | undefined,
  client: ClientInfo
) {
  // If RP doesn't specify redirectUri, we default to the first redirectUri
  // for the client
  const redirectUris = client.redirectUri?.split(',');
  if (!redirectUris) {
    return false;
  }

  if (!queryRedirectUri) {
    client.redirectUri = redirectUris[0];
    return true;
  }

  const hasRedirectUri = redirectUris.some((uri) => queryRedirectUri === uri);
  if (hasRedirectUri) {
    client.redirectUri = queryRedirectUri;
    return true;
  }

  // Pairing has a special redirectUri that deep links into the specific
  // mobile app
  if (queryRedirectUri === Constants.DEVICE_PAIRING_AUTHORITY_REDIRECT_URI) {
    return true;
  }

  return false;
}

/**
 * Produces Integrations
 */
export class IntegrationFactory {
  protected readonly data: ModelDataStore;
  protected readonly channelData: ModelDataStore;
  protected readonly storageData: ModelDataStore;
  protected readonly delegates: Delegates;
  public readonly flags: IntegrationFlags;

  constructor(opts: {
    window: ReachRouterWindow;
    delegates: Delegates;
    data?: ModelDataStore;
    channelData?: ModelDataStore;
    storageData?: ModelDataStore;
    flags?: IntegrationFlags;
  }) {
    const { window } = opts;
    this.data = opts.data || new UrlQueryData(window);
    this.channelData = opts.channelData || new UrlHashData(window);
    this.storageData = opts.storageData || new StorageData(window);
    this.flags =
      opts.flags ||
      new DefaultIntegrationFlags(
        new UrlQueryData(window),
        new StorageData(window)
      );
    this.delegates = opts.delegates;
  }

  /**
   * Produces an integration object given the current data store's state.
   * @returns An integration implementation.
   */
  getIntegration(): Integration {
    const data = this.data;
    const channelData = this.channelData;
    const storageData = this.storageData;
    const flags = this.flags;

    // Keep trying until something sticks
    if (flags.isDevicePairingAsAuthority()) {
      return this.createPairingAuthorityIntegration(channelData, storageData);
    } else if (flags.isDevicePairingAsSupplicant()) {
      return this.createPairingSupplicationIntegration(data, storageData);
    } else if (flags.isOAuth()) {
      return this.createOAuthIntegration(data, storageData);
    } else if (flags.isV3DesktopContext()) {
      // rename to createSyncIntegration?
      return this.createSyncDesktopIntegration(data);
      // return this.createBrowserIntegration(data);
    } else if (flags.isSyncService()) {
      return this.createSyncBasicIntegration(data);
    } else {
      // Web integration
      return this.createDefaultIntegration(data);
    }
  }

  private createPairingAuthorityIntegration(
    data: ModelDataStore,
    storageData: ModelDataStore
  ) {
    const integration = new PairingAuthorityIntegration(
      data,
      storageData,
      config.oauth
    );
    this.initIntegration(integration);
    return integration;
  }

  private createPairingSupplicationIntegration(
    data: ModelDataStore,
    storageData: ModelDataStore
  ) {
    const integration = new PairingSupplicantIntegration(
      data,
      storageData,
      config.oauth
    );
    this.initIntegration(integration);
    this.initClientInfo(integration);
    return integration;
  }

  private createOAuthIntegration(
    data: ModelDataStore,
    storageData: ModelDataStore
  ) {
    // Resolve configuration settings for oauth relier
    const relier = new OAuthRelier(data, storageData, config.oauth);
    this.initIntegration(relier);
    this.initOAuthRelier(relier, this.flags);
    this.initClientInfo(relier);
    return relier;
  }

  private createDefaultIntegration(data: ModelDataStore) {
    const integration = new WebIntegration(data);
    this.initIntegration(integration);
    return integration;
  }

  private createBrowserIntegration(data: ModelDataStore) {
    const integration = new BrowserRelier(data);
    this.initIntegration(integration);
    return integration;
  }

  /**
   * Initializes a base relier state
   **/
  initIntegration(integration: Integration) {
    // Important!
    // FxDesktop declares both `entryPoint` (capital P) and
    // `entrypoint` (lowcase p). Normalize to `entrypoint`.
    const entryPoint = integration.data.getModelData().get('entryPoint');
    const entrypoint = integration.data.getModelData().get('entrypoint');
    if (
      entryPoint != null &&
      entrypoint != null &&
      typeof entryPoint === 'string'
    ) {
      integration.data.entrypoint = entryPoint;
    }
  }

  /**
   * Initializes the OAuth relier state
   */
  initOAuthRelier(integration: OAuthIntegration, flags: IntegrationFlags) {
    const { status, clientId } = flags.isOAuthSuccessFlow();
    if (status) {
      if (!clientId) {
        throw new OAuthError('INVALID_PARAMETER');
      }
      integration.data.clientId = clientId;
    } else if (flags.isOAuthVerificationFlow()) {
      // The presence of the 'resume' query parameter indicates we are resuming a previous flow,
      // which usually means the user is opening a link from an email. We aren't relying on this
      // token's actual value anymore, however, we will still use it as a signal that a flow is being
      // resumed.
      const resume = this.data.get('resume');

      if (!!resume) {
        // Since we are resuming a previous flow, check to see if a previous oauth state was saved prior
        // to the verification email being sent out and attempt to restore this state.
        //
        // If a state is present, the it will contain 'scope' and 'state' parameters that allow us to
        // redirect the user back to the relying party's site after they complete their workflow here.
        //
        // If the state isn't present, we can still proceed with the user flow, but we will not be able to
        // redirect the user back to the relying parties site, becuase without the knowing the relying party's
        // oauth 'state', the redirect would be rejected.
        integration.restoreOAuthState();
      }
    } else {
      // Sign inflow
      // params listed in:
      // https://mozilla.github.io/ecosystem-platform/api#tag/OAuth-Server-API-Overview
    }
  }

  initClientInfo(integration: OAuthIntegration) {
    integration.clientInfo = this.createClientInfo(integration.data.clientId);
  }

  initSubscriptionInfo(integration: Integration) {
    // Do not wait on this. Components can do so with useEffect if needed. However,
    // not all
    integration.subscriptionInfo = this.createRelierSubscriptionInfo();
  }

  private async createClientInfo(clientId: string | undefined) {
    // Make sure a valid client id is provided before evening attempting the call.
    if (!clientId) {
      throw new OAuthError('UNKNOWN_CLIENT', {
        client_id: 'null or empty',
      });
    }

    try {
      const serviceInfo = await this.delegates.getClientInfo(clientId);
      const clientInfo = new ClientInfo(new GenericData(serviceInfo));
      return clientInfo;
    } catch (err) {
      if (
        err.name === 'INVALID_PARAMETER' &&
        err.validation?.keys?.[0] === 'client_id'
      ) {
        throw new OAuthError('UNKNOWN_CLIENT', {
          client_id: clientId,
        });
      }

      throw err;
    }
  }

  private async createRelierSubscriptionInfo(): Promise<RelierSubscriptionInfo> {
    // TODO: Is the following still needed? Seems like there should be a cleaner way to do this.
    // HACK: issue #6121 - we want to fetch the subscription product
    // name as the "service" here if we're starting from a payment flow.
    // But, this fetch() is called long before router or any view logic
    // kicks in. So, let's check the URL path here to see if there's a
    // product ID for name lookup.
    const productId = this.delegates.getProductIdFromRoute();
    let subscriptionProductName = '';
    let subscriptionProductId = '';
    if (productId) {
      const data = await this.delegates.getProductInfo(subscriptionProductId);
      if (data && data.productName && typeof data.productName === 'string') {
        subscriptionProductName = data.productName;
      } else {
        subscriptionProductId = undefined || '';
      }
    }
    return {
      subscriptionProductId,
      subscriptionProductName,
    };
  }
}
