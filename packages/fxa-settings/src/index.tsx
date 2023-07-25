/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import { render } from 'react-dom';
import AppErrorBoundary from 'fxa-react/components/AppErrorBoundary';
import App from './components/App';
import config, { readConfigMeta } from './lib/config';
import { AppContext, initializeAppContext } from './models';
import AppLocalizationProvider from 'fxa-react/lib/AppLocalizationProvider';
import './styles/tailwind.out.css';
import { ApolloProvider } from '@apollo/client';
import { createApolloClient } from './lib/gql';

try {
  // Populate config
  readConfigMeta((name: string) => {
    return document.head.querySelector(name);
  });

  const apolloClient = createApolloClient(config.servers.gql.url);
  const appContext = initializeAppContext();

  render(
    <React.StrictMode>
      <AppErrorBoundary>
        <AppContext.Provider value={appContext}>
          <AppLocalizationProvider
            baseDir="/settings/locales"
            userLocales={navigator.languages}
          >
            <ApolloProvider client={apolloClient}>
              <App />
            </ApolloProvider>
          </AppLocalizationProvider>
        </AppContext.Provider>
      </AppErrorBoundary>
    </React.StrictMode>,
    document.getElementById('root')
  );
} catch (error) {
  console.error('Error initializing FXA Settings', error);
}
