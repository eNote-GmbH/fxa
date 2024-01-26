/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithLocalizationProvider } from 'fxa-react/lib/test-utils/localizationProvider'; // import { getFtlBundle, testAllL10n } from 'fxa-react/lib/test-utils';
// import { FluentBundle } from '@fluent/bundle';
import { logViewEvent, usePageViewEvent } from '../../../lib/metrics';
import { viewName } from '.';
import { REACT_ENTRYPOINT } from '../../../constants';
import { Session, AppContext } from '../../../models';
import { mockAppContext, mockSession } from '../../../models/mocks';
import {
  MOCK_AUTH_ERROR,
  MOCK_SIGNUP_CODE,
  Subject,
  createMockWebIntegration,
} from './mocks';
import { StoredAccountData } from '../../../lib/storage-utils';
import { MOCK_EMAIL, MOCK_SESSION_TOKEN, MOCK_UID } from '../../mocks';
import GleanMetrics from '../../../lib/glean';
import { useWebRedirect } from '../../../lib/hooks/useWebRedirect';
import { ConfirmSignupCodeIntegration } from './interfaces';
import * as utils from 'fxa-react/lib/utils';

jest.mock('../../../lib/metrics', () => ({
  usePageViewEvent: jest.fn(),
  logViewEvent: jest.fn(),
  logViewEventOnce: jest.fn(),
  useMetrics: () => ({
    usePageViewEvent: jest.fn(),
    logViewEvent: jest.fn(),
    logViewEventOnce: jest.fn(),
  }),
}));

const mockNavigate = jest.fn();
jest.mock('@reach/router', () => ({
  ...jest.requireActual('@reach/router'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../../../lib/glean', () => ({
  __esModule: true,
  default: { signupConfirmation: { view: jest.fn(), submit: jest.fn() } },
}));

jest.mock('../../../lib/hooks/useWebRedirect');

const MOCK_STORED_ACCOUNT: StoredAccountData = {
  uid: MOCK_UID,
  lastLogin: Date.now(),
  email: MOCK_EMAIL,
  sessionToken: MOCK_SESSION_TOKEN,
  metricsEnabled: true,
  verified: false,
};

jest.mock('../../../lib/cache', () => ({
  ...jest.requireActual('../../../lib/cache'),
  currentAccount: () => MOCK_STORED_ACCOUNT,
}));

jest.mock('../../../lib/storage-utils', () => ({
  ...jest.requireActual('../../../lib/storage-utils'),
  persistAccount: jest.fn(),
}));

let session: Session;

function renderWithSession({
  session,
  newsletterSlugs,
  integration,
}: {
  session?: Session;
  newsletterSlugs?: string[];
  integration?: ConfirmSignupCodeIntegration;
}) {
  renderWithLocalizationProvider(
    <AppContext.Provider value={mockAppContext({ session })}>
      <Subject {...{ newsletterSlugs, integration }} />
    </AppContext.Provider>
  );
}

describe('ConfirmSignupCode page', () => {
  // TODO: enable l10n tests when they've been updated to handle embedded tags in ftl strings
  // TODO: in FXA-6461
  // let bundle: FluentBundle;
  // beforeAll(async () => {
  //   bundle = await getFtlBundle('settings');
  // });
  const submit = (code = MOCK_SIGNUP_CODE) => {
    const codeInput = screen.getByLabelText('Enter 6-digit code');
    fireEvent.input(codeInput, {
      target: { value: code },
    });

    const submitButton = screen.getByRole('button', { name: 'Confirm' });
    fireEvent.click(submitButton);
  };

  beforeEach(() => {
    session = {
      verifySession: jest.fn().mockResolvedValue(true),
    } as unknown as Session;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders as expected', () => {
    renderWithSession({ session });
    // testAllL10n(screen, bundle);

    const headingEl = screen.getByRole('heading', { level: 1 });
    expect(headingEl).toHaveTextContent(
      'Enter confirmation code for your Mozilla account'
    );
    screen.getByLabelText('Enter 6-digit code');

    screen.getByRole('button', { name: 'Confirm' });
    screen.getByRole('button', { name: 'Email new code.' });
  });

  it('emits a metrics event on render', async () => {
    renderWithSession({ session });
    expect(usePageViewEvent).toHaveBeenCalledWith(viewName, REACT_ENTRYPOINT);
    expect(GleanMetrics.signupConfirmation.view).toHaveBeenCalledTimes(1);

    //  Input field is autofocused on render and should emit an 'engage' event metric
    await waitFor(() => {
      expect(logViewEvent).toHaveBeenCalledWith(
        `flow.${viewName}`,
        'engage',
        REACT_ENTRYPOINT
      );
    });
  });

  it('emits a metrics event on successful form submission', async () => {
    renderWithSession({ session });
    submit();

    await waitFor(() => {
      expect(logViewEvent).toHaveBeenCalledWith(
        `flow.${viewName}`,
        'verification.success',
        REACT_ENTRYPOINT
      );
      expect(GleanMetrics.signupConfirmation.submit).toHaveBeenCalledTimes(1);
    });
  });

  it('submits successfully without newsletters', async () => {
    renderWithSession({ session });
    submit();

    await waitFor(() => {
      expect(session.verifySession).toHaveBeenCalled();
      expect(logViewEvent).toHaveBeenCalledTimes(3);
      expect(logViewEvent).not.toHaveBeenCalledWith(
        'flow',
        'newsletter.subscribed',
        {
          entrypoint_variation: 'react',
        }
      );
      expect(GleanMetrics.signupConfirmation.submit).toHaveBeenCalledTimes(1);
    });
  });

  it('submits successfully with newsletters', async () => {
    // newsletter slugs are selected on the previous page
    // and received via location state as an array of strings
    const mockNewsletterArray = ['mock-slug-1'];
    renderWithSession({ session, newsletterSlugs: mockNewsletterArray });
    submit();

    await waitFor(() => {
      expect(session.verifySession).toHaveBeenCalledWith(MOCK_SIGNUP_CODE, {
        newsletters: mockNewsletterArray,
      });
      expect(logViewEvent).toHaveBeenCalledTimes(4);
      expect(logViewEvent).toHaveBeenCalledWith(
        'flow',
        'newsletter.subscribed',
        {
          entrypoint_variation: 'react',
        }
      );
      expect(GleanMetrics.signupConfirmation.submit).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith('/settings', { replace: true });
    });
  });

  describe('Web integration on submission', () => {
    const localizedErrorMessage = 'bloopity bleep';

    let hardNavigateSpy: jest.SpyInstance;
    beforeEach(() => {
      hardNavigateSpy = jest
        .spyOn(utils, 'hardNavigate')
        .mockImplementation(() => {});
    });

    afterEach(() => {
      hardNavigateSpy.mockRestore();
    });

    it('with valid redirectTo', async () => {
      const redirectTo = 'surprisinglyValid!';
      const integration = createMockWebIntegration({ redirectTo });
      (useWebRedirect as jest.Mock).mockReturnValue({
        isValid: () => true,
        getLocalizedErrorMessage: () => localizedErrorMessage,
      });
      renderWithSession({ session, integration });
      submit();

      await waitFor(() => {
        expect(hardNavigateSpy).toHaveBeenCalledWith(redirectTo);
      });
    });

    it('with invalid redirectTo', async () => {
      const integration = createMockWebIntegration({
        redirectTo: 'sadlyInvalid',
      });
      (useWebRedirect as jest.Mock).mockReturnValue({
        isValid: () => false,
        getLocalizedErrorMessage: () => localizedErrorMessage,
      });
      renderWithSession({ session, integration });
      submit();

      await screen.findByText(localizedErrorMessage);
    });

    it('without redirectTo', async () => {
      renderWithSession({ session });
      submit();

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/settings', {
          replace: true,
        });
      });
    });
  });
});

describe('ConfirmSignupCode page with error states', () => {
  beforeEach(() => {
    session = {
      verifySession: jest.fn().mockResolvedValue(new Error()),
    } as unknown as Session;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders an error tooltip when the form is submitted without a code', async () => {
    renderWithSession({ session });

    const codeInput = screen.getByLabelText('Enter 6-digit code');
    fireEvent.change(codeInput, {
      target: { value: '' },
    });

    const submitButton = screen.getByRole('button', { name: 'Confirm' });
    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(screen.getByTestId('tooltip')).toHaveTextContent(
        'Confirmation code is required'
      );
      expect(GleanMetrics.signupConfirmation.submit).not.toHaveBeenCalled();
    });
  });

  // TODO add test for expected behaviour on verifySession fail in FXA-8303
});

describe('Resending a new code from ConfirmSignupCode page', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('displays a success banner when successful', async () => {
    session = mockSession(true, false);

    renderWithSession({ session });

    const resendEmailButton = screen.getByRole('button', {
      name: 'Email new code.',
    });
    fireEvent.click(resendEmailButton);
    await waitFor(() => {
      expect(
        screen.getByText(
          'Email resent. Add accounts@firefox.com to your contacts to ensure a smooth delivery.'
        )
      ).toBeInTheDocument();
    });
  });

  it('displays an error banner when unsuccessful', async () => {
    session = {
      sendVerificationCode: jest.fn().mockRejectedValue(MOCK_AUTH_ERROR),
    } as unknown as Session;

    renderWithSession({ session });

    const resendEmailButton = screen.getByRole('button', {
      name: 'Email new code.',
    });
    fireEvent.click(resendEmailButton);
    await waitFor(() => {
      expect(screen.getByText('Unexpected error')).toBeInTheDocument();
    });
  });
});
