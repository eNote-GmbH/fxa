/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { ApolloClient } from '@apollo/client';
import AuthClient from 'fxa-auth-client/browser';
import React from 'react';
import config, { Config, readConfigMeta, getDefault } from '../../lib/config';
import { createApolloClient } from '../../lib/gql';
import { Account } from '../Account';
import { Session } from '../Session';

// When our newly Reactified pages are using the container component
// pattern, we will move `account`, `apolloClient`, and `session` off of
// AppContext and onto SettingsContext instead.
export interface AppContextValue {
  authClient?: AuthClient;
  apolloClient?: ApolloClient<object>;
  config?: Config;
  account?: Account;
  session?: Session; // used exclusively for test mocking
}

export function initializeAppContext() {
  readConfigMeta((name: string) => {
    return document.head.querySelector(name);
  });

  const authClient = new AuthClient(config.servers.auth.url);
  const apolloClient = createApolloClient(config.servers.gql.url);
  const account = new Account(authClient, apolloClient);

  const context: AppContextValue = {
    authClient,
    apolloClient,
    config,
    account,
  };

  return context;
}

export function defaultAppContext(context?: AppContextValue) {
  const account = {
    uid: 'abc123',
    displayName: 'John Dope',
    avatar: {
      id: 'abc1234',
      url: 'http://placekitten.com/512/512',
      isDefault: false,
    },
    accountCreated: 123456789,
    passwordCreated: 123456789,
    hasPassword: true,
    recoveryKey: true,
    metricsEnabled: true,
    attachedClients: [],
    subscriptions: [],
    primaryEmail: {
      email: 'johndope@example.com',
      isPrimary: true,
      verified: true,
    },
    emails: [
      {
        email: 'johndope@example.com',
        isPrimary: true,
        verified: true,
      },
    ],
    totp: {
      exists: true,
      verified: true,
    },
    linkedAccounts: [],
    securityEvents: [],
  };
  const session = {
    verified: true,
    token: 'deadc0de',
  };
  return Object.assign(
    {
      account,
      session,
      config: getDefault(),
    },
    context
  ) as AppContextValue;
}

export const AppContext = React.createContext<AppContextValue>(
  defaultAppContext()
);
