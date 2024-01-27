/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import AuthClient from 'fxa-auth-client';

import { AppConfig } from '../config';

export const AuthClientService = Symbol('AUTH_SERVER_CLIENT');
export const AuthClientFactory: Provider = {
  provide: AuthClientService,
  useFactory: async (config: ConfigService<AppConfig>) => {
    const authServerConfig = config.get(
      'authServer'
    ) as AppConfig['authServer'];

    // We keep the a 'legacy' client around for the time being.
    return new AuthClient(authServerConfig.url,  { keyStretchVersion: 2 });
  },
  inject: [ConfigService],
};

export const AuthClientServiceV2 = Symbol('AUTH_SERVER_CLIENT_V2');
export const AuthClientFactoryV2: Provider = {
  provide: AuthClientServiceV2,
  useFactory: async (config: ConfigService<AppConfig>) => {
    const authServerConfig = config.get(
      'authServer'
    ) as AppConfig['authServer'];
    return new AuthClient(authServerConfig.url, { keyStretchVersion: 2 });
  },
  inject: [ConfigService],
};
