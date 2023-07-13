/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { ApolloProvider } from '@apollo/client';
import AppErrorBoundary from 'fxa-react/components/AppErrorBoundary';
import { ApolloClient, createHttpLink, InMemoryCache } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import sentryMetrics from 'fxa-shared/lib/sentry';
import { config, readConfigFromMeta, getExtraHeaders } from './lib/config';
import App from './App';
import './styles/tailwind.out.css';

try {
  // Watch out! This mutates the config. Make sure it gets run first!
  readConfigFromMeta(headQuerySelector);

  const httpLink = createHttpLink({
    uri: `${config.servers.admin.url}/graphql`,
  });

  const authLink = setContext((_, { headers }) => ({
    headers: {
      ...headers,
      ...getExtraHeaders(config),
    },
  }));

  const client = new ApolloClient({
    link: authLink.concat(httpLink),
    cache: new InMemoryCache(),
  });

  sentryMetrics.configure({
    release: config.version,
    sentry: {
      ...config.sentry,
    },
  });

  const root = createRoot(document.getElementById('root')!);

  root.render(
    <React.StrictMode>
      <AppErrorBoundary>
        <ApolloProvider {...{ client }}>
          <App {...{ config }} />
        </ApolloProvider>
      </AppErrorBoundary>
    </React.StrictMode>
  );
} catch (error) {
  console.error('Error initializing fxa-admin-panel', error);
}

function headQuerySelector(name: string) {
  return document.head.querySelector(name);
}
