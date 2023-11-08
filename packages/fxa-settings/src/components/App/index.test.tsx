/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React, { ReactNode } from 'react';
import { act, screen, waitFor } from '@testing-library/react';
import { renderWithLocalizationProvider } from 'fxa-react/lib/test-utils/localizationProvider';
import App from '.';
import * as Metrics from '../../lib/metrics';
import {
  AppContext,
  useInitialMetricsQueryState,
  useLocalSignedInQueryState,
  useIntegration,
  useInitialSettingsState,
  useClientInfoState,
  useProductInfoState,
  Account,
} from '../../models';
import {
  MOCK_ACCOUNT,
  createAppContext,
  mockAppContext,
  renderWithRouter,
} from '../../models/mocks';
import GleanMetrics from '../../lib/glean';
import config from '../../lib/config';
import * as utils from 'fxa-react/lib/utils';

jest.mock('../../models', () => ({
  ...jest.requireActual('../../models'),
  useInitialMetricsQueryState: jest.fn(),
  useLocalSignedInQueryState: jest.fn(),
  useInitialSettingsState: jest.fn(),
  useClientInfoState: jest.fn(),
  useProductInfoState: jest.fn(),
  useIntegration: jest.fn(),
}));

jest.mock('react-markdown', () => {});
jest.mock('rehype-raw', () => {});

jest.mock('../Settings/ScrollToTop', () => ({
  __esModule: true,
  ScrollToTop: ({ children }: { children: ReactNode }) => (
    <span data-testid="ScrollTop">{children}</span>
  ),
}));

jest.mock('../../lib/glean', () => ({
  __esModule: true,
  default: { initialize: jest.fn() },
}));

const mockMetricsQueryAccountAmplitude = {
  recoveryKey: true,
  totpActive: true,
  hasSecondaryVerifiedEmail: false,
};

const mockMetricsQueryAccountResult = {
  uid: 'abc123',
  recoveryKey: true,
  metricsEnabled: true,
  emails: [
    {
      email: 'blabidi@blabidiboo.com',
      isPrimary: true,
      verified: true,
    },
  ],
  totp: {
    exists: true,
    verified: true,
  },
};

const mockMetricsQueryAccountGlean = {
  uid: 'abc123',
  metricsEnabled: true,
};

const DEVICE_ID = 'yoyo';
const BEGIN_TIME = 123456;
const FLOW_ID = 'abc123';
const updatedFlowQueryParams = {
  deviceId: DEVICE_ID,
  flowBeginTime: BEGIN_TIME,
  flowId: FLOW_ID,
};

describe('metrics', () => {
  let flowInit: jest.SpyInstance;

  beforeEach(() => {
    //@ts-ignore
    delete window.location;
    window.location = {
      ...window.location,
      replace: jest.fn(),
    };

    flowInit = jest.spyOn(Metrics, 'init');
  });

  afterEach(() => {
    flowInit.mockReset();
  });

  it('Initializes metrics flow data when present', async () => {
    (useInitialMetricsQueryState as jest.Mock).mockReturnValueOnce({
      data: mockMetricsQueryAccountResult,
    });
    (useLocalSignedInQueryState as jest.Mock).mockReturnValueOnce({});
    const flowInit = jest.spyOn(Metrics, 'init');
    const userPreferencesInit = jest.spyOn(Metrics, 'initUserPreferences');

    await act(async () => {
      renderWithLocalizationProvider(
        <AppContext.Provider
          value={{ ...mockAppContext(), ...createAppContext() }}
        >
          <App flowQueryParams={updatedFlowQueryParams} />
        </AppContext.Provider>
      );
    });

    expect(flowInit).toHaveBeenCalledWith(true, {
      deviceId: DEVICE_ID,
      flowId: FLOW_ID,
      flowBeginTime: BEGIN_TIME,
    });
    expect(userPreferencesInit).toHaveBeenCalledWith(
      mockMetricsQueryAccountAmplitude
    );
    expect(window.location.replace).not.toHaveBeenCalled();
  });
});

describe('glean', () => {
  it('Initializes glean', async () => {
    (useInitialMetricsQueryState as jest.Mock).mockReturnValueOnce({
      data: mockMetricsQueryAccountResult,
    });
    (useIntegration as jest.Mock).mockReturnValue({});
    (useLocalSignedInQueryState as jest.Mock).mockReturnValueOnce({});

    await act(async () => {
      renderWithLocalizationProvider(
        <AppContext.Provider
          value={{ ...mockAppContext(), ...createAppContext() }}
        >
          <App flowQueryParams={updatedFlowQueryParams} />
        </AppContext.Provider>
      );
    });

    expect(GleanMetrics.initialize).toHaveBeenCalledWith(
      {
        ...config.glean,
        enabled: mockMetricsQueryAccountGlean.metricsEnabled,
        appDisplayVersion: config.version,
        channel: config.glean.channel,
      },
      {
        flowQueryParams: updatedFlowQueryParams,
        account: mockMetricsQueryAccountGlean,
        userAgent: navigator.userAgent,
        integration: {},
      }
    );
  });
});

describe('loading spinner states', () => {
  it('when initial metrics query is loading', async () => {
    (useInitialMetricsQueryState as jest.Mock).mockReturnValueOnce({
      loading: true,
    });
    (useLocalSignedInQueryState as jest.Mock).mockReturnValueOnce({});

    await act(async () => {
      renderWithLocalizationProvider(
        <AppContext.Provider
          value={{ ...mockAppContext(), ...createAppContext() }}
        >
          <App flowQueryParams={updatedFlowQueryParams} />
        </AppContext.Provider>
      );
    });

    expect(screen.getByLabelText('Loading…')).toBeInTheDocument();
  });

  it('when signed in status has not been set yet', async () => {
    (useInitialMetricsQueryState as jest.Mock).mockReturnValueOnce({
      loading: false,
    });
    (useLocalSignedInQueryState as jest.Mock).mockReturnValueOnce({
      data: undefined,
    });

    await act(async () => {
      renderWithLocalizationProvider(
        <AppContext.Provider
          value={{ ...mockAppContext(), ...createAppContext() }}
        >
          <App flowQueryParams={updatedFlowQueryParams} />
        </AppContext.Provider>
      );
    });

    expect(screen.getByLabelText('Loading…')).toBeInTheDocument();
  });
});

describe('SettingsRoutes', () => {
  let hardNavigateToContentServerSpy: jest.SpyInstance;
  const settingsPath = '/settings';
  jest.mock('@reach/router', () => ({
    ...jest.requireActual('@reach/router'),
    useLocation: () => {
      return {
        pathname: settingsPath,
      };
    },
  }));

  beforeEach(() => {
    hardNavigateToContentServerSpy = jest
      .spyOn(utils, 'hardNavigateToContentServer')
      .mockImplementation(() => {});
    (useInitialMetricsQueryState as jest.Mock).mockReturnValue({
      loading: false,
    });
    (useIntegration as jest.Mock).mockReturnValue({
      getServiceName: jest.fn(),
    });
  });
  afterEach(() => {
    hardNavigateToContentServerSpy.mockRestore();
  });
  it('redirects to /signin if isSignedIn is false', async () => {
    (useLocalSignedInQueryState as jest.Mock).mockReturnValueOnce({
      data: { isSignedIn: false },
    });

    let navigateResult: Promise<void>;
    await act(async () => {
      const {
        history: { navigate },
      } = renderWithRouter(
        <AppContext.Provider
          value={{ ...mockAppContext(), ...createAppContext() }}
        >
          <App flowQueryParams={updatedFlowQueryParams} />
        </AppContext.Provider>,
        { route: '/' }
      );
      navigateResult = navigate(settingsPath);
    });

    await act(() => navigateResult);

    await waitFor(() => {
      expect(hardNavigateToContentServerSpy).toHaveBeenCalledWith(
        `/signin?redirect_to=${encodeURIComponent(settingsPath)}`
      );
    });
  });
  it('does not redirect if isSignedIn is true', async () => {
    (useLocalSignedInQueryState as jest.Mock).mockReturnValueOnce({
      data: { isSignedIn: true },
    });
    (useInitialSettingsState as jest.Mock).mockReturnValue({ loading: false });
    (useClientInfoState as jest.Mock).mockReturnValue({
      loading: false,
      data: {},
    });
    (useProductInfoState as jest.Mock).mockReturnValue({
      loading: false,
      data: {},
    });

    let navigateResult: Promise<void>;
    await act(async () => {
      const {
        history: { navigate },
      } = renderWithRouter(
        <AppContext.Provider
          value={mockAppContext({
            account: MOCK_ACCOUNT as unknown as Account,
          })}
        >
          <App flowQueryParams={updatedFlowQueryParams} />
        </AppContext.Provider>,
        { route: '/' }
      );
      navigateResult = navigate(settingsPath);
    });

    await act(() => navigateResult);

    await waitFor(() => {
      expect(hardNavigateToContentServerSpy).not.toHaveBeenCalled();
    });
    expect(screen.getByTestId('settings-profile')).toBeInTheDocument();
  });
});
