import React from 'react';
import { render, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { config } from '../../lib/config';
import { AppContext, defaultAppContext } from '../../lib/AppContext';

import AppLayout, { SignInLayout, SettingsLayout } from './index';
import TermsAndPrivacy from '../TermsAndPrivacy';
import { SELECTED_PLAN } from '../../lib/mock-data';
import { RawMetadata } from 'fxa-shared/subscriptions/types';
import AppLocalizationProvider from 'fxa-react/lib/AppLocalizationProvider';

afterEach(cleanup);

const reportError = () => {};

const {
  product_metadata: {
    'product:termsOfServiceURL': termsOfServiceURL,
    'product:privacyNoticeURL': privacyNoticeURL,
  },
}: RawMetadata = SELECTED_PLAN;

describe('AppLayout', () => {
  const subject = () => {
    return render(
      <AppContext.Provider value={defaultAppContext}>
        <AppLocalizationProvider
          messages={{ en: ['testo: lol'] }}
          reportError={reportError}
        >
          <AppLayout>
            <div data-testid="children">
              <TermsAndPrivacy plan={SELECTED_PLAN} />
            </div>
          </AppLayout>
        </AppLocalizationProvider>
      </AppContext.Provider>
    );
  };

  const { queryByTestId, getByText } = subject();

  it('renders as expected', () => {
    for (const id of ['terms', 'privacy']) {
      expect(queryByTestId(id)).toBeInTheDocument();
    }

    const tosLink = getByText('Terms of Service');
    expect(tosLink).toHaveAttribute('href', termsOfServiceURL);
    const privacyLink = getByText('Privacy Notice');
    expect(privacyLink).toHaveAttribute('href', privacyNoticeURL);
  });
});

describe('SignInLayout', () => {
  const subject = () =>
    render(
      <SignInLayout>
        <div data-testid="children">Testing</div>
      </SignInLayout>
    );

  it('renders as expected', () => {
    const { queryByTestId } = subject();
    for (const id of ['stage', 'children']) {
      expect(queryByTestId(id)).toBeInTheDocument();
    }
  });
});

describe('SettingsLayout', () => {
  const CONTENT_URL = 'https://accounts.example.com';

  const subject = () => {
    const appContextValue = {
      ...defaultAppContext,
      config: {
        ...config,
        servers: {
          ...config.servers,
          content: {
            url: CONTENT_URL,
          },
        },
      },
    };

    return render(
      <AppContext.Provider value={appContextValue}>
        <AppLocalizationProvider
          messages={{ en: ['testo: lol'] }}
          reportError={reportError}
        >
          <SettingsLayout>
            <div data-testid="children">Testing</div>
          </SettingsLayout>
        </AppLocalizationProvider>
      </AppContext.Provider>
    );
  };

  it('renders as expected', () => {
    const { queryByTestId, getByText } = subject();
    for (const id of ['stage', 'breadcrumbs', 'children']) {
      expect(queryByTestId(id)).toBeInTheDocument();
    }

    const homeLink = getByText('Account Home');
    expect(homeLink).toHaveAttribute('href', `${CONTENT_URL}/settings`);
    expect(document.body).toHaveClass('settings');
  });
});
