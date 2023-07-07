/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {
  BaseRelier,
  BrowserRelier,
  ClientInfo,
  OAuthRelier,
  PairingAuthorityRelier,
  PairingSupplicantRelier,
  Relier,
  RelierSubscriptionInfo,
  parseResumeToken,
} from '../../models/reliers';
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
import { RelierFlags } from './interfaces';
import { RelierDelegates } from './interfaces/relier-delegates';
import { DefaultRelierFlags } from './relier-factory-flags';

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
 * Produces Reliers
 */
export class RelierFactory {
  protected readonly data: ModelDataStore;
  protected readonly channelData: ModelDataStore;
  public readonly flags: RelierFlags;
  protected readonly delegates: RelierDelegates;

  // private relier: Relier | undefined;

  constructor(opts: {
    window: ReachRouterWindow;
    delegates: RelierDelegates;
    data?: ModelDataStore;
    channelData?: ModelDataStore;
    flags?: RelierFlags;
  }) {
    const { window } = opts;
    this.data = opts.data || new UrlQueryData(window);
    this.channelData = opts.channelData || new UrlHashData(window);
    this.flags =
      opts.flags ||
      new DefaultRelierFlags(new UrlQueryData(window), new StorageData(window));
    this.delegates = opts.delegates;
  }

  /**
   * Produces a relier given the current data store's state.
   * @returns A relier implementation.
   */
  getRelier() {
    // if (true || this.relier == null) {
    const data = this.data;
    const channelData = this.channelData;
    const flags = this.flags;

    // Keep trying until something sticks
    let relier: Relier | undefined;
    if (flags.isDevicePairingAsAuthority()) {
      relier = this.createPairingAuthorityRelier(channelData);
    } else if (flags.isDevicePairingAsSupplicant()) {
      relier = this.createParingSupplicationRelier(data);
    } else if (flags.isOAuth()) {
      relier = this.createOAuthRelier(data);
    } else if (flags.isSyncService() || flags.isV3DesktopContext()) {
      relier = this.createBrowserRelier(data);
    } else {
      relier = this.creteDefaultRelier(data);
    }

    // this.relier = relier;
    return relier;
    // }

    // Commenting this out so that pages will stop erroring out when we don't have sufficient query params.
    // This might be a TODO to restore this once we have all the data we need in the React app.
    // await relier?.validate();
    // return this.relier;
  }

  private createPairingAuthorityRelier(data: ModelDataStore) {
    const relier = new PairingAuthorityRelier(data);
    this.initRelier(relier);
    return relier;
  }

  private createParingSupplicationRelier(data: ModelDataStore) {
    const relier = new PairingSupplicantRelier(data);
    this.initRelier(relier);
    this.initClientInfo(relier);

    return relier;
  }

  private createOAuthRelier(data: ModelDataStore) {
    const relier = new OAuthRelier(data);
    this.initRelier(relier);
    this.initOAuthRelier(relier, this.flags);
    this.initClientInfo(relier);
    return relier;
  }

  private creteDefaultRelier(data: ModelDataStore) {
    const relier = new BaseRelier(data);
    this.initRelier(relier);
    return relier;
  }

  private createBrowserRelier(data: ModelDataStore) {
    const relier = new BrowserRelier(data);
    this.initRelier(relier);
    return relier;
  }

  /**
   * Initializes a base relier state
   **/
  initRelier(relier: BaseRelier) {
    // Important!
    // FxDesktop declares both `entryPoint` (capital P) and
    // `entrypoint` (lowcase p). Normalize to `entrypoint`.
    const entryPoint = relier.getModelData().get('entryPoint');
    const entrypoint = relier.getModelData().get('entrypoint');
    if (
      entryPoint != null &&
      entrypoint != null &&
      typeof entryPoint === 'string'
    ) {
      relier.entrypoint = entryPoint;
    }
  }

  /**
   * Initializes the OAuth relier state
   */
  initOAuthRelier(relier: OAuthRelier, flags: RelierFlags) {
    const { status, clientId } = flags.isOAuthSuccessFlow();
    if (status) {
      if (!clientId) {
        throw new OAuthError('INVALID_PARAMETER');
      }
      relier.clientId = clientId;
    } else if (flags.isOAuthVerificationFlow()) {
      // Restore any state encoded by the resume token found in the URL as query parameter.
      const resume = this.data.get('resume');
      if (resume != null && typeof resume === 'string') {
        const token = parseResumeToken(resume);

        if (token.entrypoint) {
          relier.entrypoint = token.entrypoint;
        }
        if (token.entrypointExperiment) {
          relier.entrypointExperiment = token.entrypoint;
        }
        if (token.resetPasswordConfirm) {
          relier.resetPasswordConfirm = token.resetPasswordConfirm;
        }
        if (token.style) {
          relier.style = token.style;
        }
        if (token.utmCampaign) {
          relier.utmCampaign = token.utmCampaign;
        }
        if (token.utmContent) {
          relier.utmContent = token.utmContent;
        }
        if (token.utmMedium) {
          relier.utmMedium = token.utmMedium;
        }
        if (token.utmSource) {
          relier.utmSource = token.utmSource;
        }
        if (token.utmTerm) {
          relier.utmTerm = token.utmTerm;
        }
        if (token.deviceId) {
          relier.deviceId = token.deviceId;
        }
        if (token.flowBegin) {
          relier.flowBeginTime = token.flowBegin;
        }
        if (token.flowId) {
          relier.flowId = token.flowId;
        }
        if (token.scope) {
          relier.scope = token.scope;
        }
        if (token.state) {
          relier.state = token.state;
        }
      }

      // Check for local 'oauth' state, which is found in local session storage. Only set these
      // values as fallbacks. The URL should always be the source of truth when available.
      const oauthData = flags.getOAuthResumeObj();
      if (!relier.clientId && oauthData?.client_id) {
        relier.clientId = oauthData.client_id;
      }
      if (!relier.scope && oauthData?.scope) {
        relier.scope = oauthData.scope;
      }
      if (!relier.scope && oauthData?.state) {
        relier.state = oauthData.state;
      }
    } else {
      // Sign inflow
      // params listed in:
      // https://mozilla.github.io/ecosystem-platform/api#tag/OAuth-Server-API-Overview
      // if (!relier.email && relier.loginHint) {
      //   relier.email = relier.loginHint;
      // }
      // TODO: Double check this assumption. It appears that a service param may get inadvertently passed in. I am not sure that
      //       passing this data in actually hurts anything...
      //
      // // OAuth reliers are not allowed to specify a service. `service`
      // // is used in the verification flow, it'll be set to the `client_id`.
      // if (relier.service && relier.service.length > 0) {
      //   throw new OAuthError('service');
      // }
    }

    // Edge case and hack!
    // Emails might only contain a service query parameter but not a client_id. Which often is
    // the client id. If this is the case, have the clientId fallback to to this service value.
    // Also note an actual service name will be fetched later during the 'initClientInfo' stage.
    if (
      !relier.clientId &&
      relier.service &&
      /[a-z0-9]{16}/.test(relier.service)
    ) {
      relier.clientId = relier.service;
    }
  }

  initClientInfo(relier: OAuthRelier) {
    relier.clientInfo = this.createClientInfo(relier.clientId);
  }

  initSubscriptionInfo(relier: Relier) {
    // Do not wait on this. Components can do so with useEffect if needed. However,
    // not all
    relier.subscriptionInfo = this.createRelierSubscriptionInfo();
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
