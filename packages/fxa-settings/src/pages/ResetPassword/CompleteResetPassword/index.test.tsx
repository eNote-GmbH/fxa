/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { Account, IntegrationType } from '../../../models';
import { logPageViewEvent } from '../../../lib/metrics';
import { REACT_ENTRYPOINT } from '../../../constants';
import {
  MOCK_RESET_DATA,
  mockCompleteResetPasswordParams,
  paramsWithMissingCode,
  paramsWithMissingEmail,
  paramsWithMissingEmailToHashWith,
  paramsWithMissingToken,
  paramsWithSyncDesktop,
  Subject,
} from './mocks';
import firefox from '../../../lib/channels/firefox';
import {
  createAppContext,
  createHistoryWithQuery,
  mockAppContext,
  renderWithRouter,
} from '../../../models/mocks';
import { MOCK_RESET_TOKEN } from '../../mocks';
// import { getFtlBundle, testAllL10n } from 'fxa-react/lib/test-utils';
// import { FluentBundle } from '@fluent/bundle';

const mockUseNavigateWithoutRerender = jest.fn();

jest.mock('../../../lib/hooks/useNavigateWithoutRerender', () => ({
  __esModule: true,
  default: () => mockUseNavigateWithoutRerender,
}));

const PASSWORD = 'passwordzxcv';

jest.mock('../../../lib/metrics', () => ({
  logPageViewEvent: jest.fn(),
  logViewEvent: jest.fn(),
}));

let account: Account;
let lostRecoveryKey: boolean;
let accountResetToken: string | undefined;
const mockNavigate = jest.fn();

const mockSearchParams = {
  email: mockCompleteResetPasswordParams.email,
  emailToHashWith: mockCompleteResetPasswordParams.emailToHashWith,
  token: mockCompleteResetPasswordParams.token,
  code: mockCompleteResetPasswordParams.code,
  uid: mockCompleteResetPasswordParams.uid,
};

const search = new URLSearchParams(mockSearchParams);

const mockLocation = () => {
  return {
    pathname: `/account_recovery_reset_password`,
    search,
    state: {
      lostRecoveryKey,
      accountResetToken,
    },
  };
};

jest.mock('@reach/router', () => ({
  ...jest.requireActual('@reach/router'),
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation(),
}));

const route = '/complete_reset_password';
const render = (ui: any, account?: Account) => {
  const history = createHistoryWithQuery(route);
  return renderWithRouter(
    ui,
    {
      route,
      history,
    },
    mockAppContext({
      ...createAppContext(),
      ...(account && { account }),
    })
  );
};

describe('CompleteResetPassword page', () => {
  // TODO: enable l10n tests when they've been updated to handle embedded tags in ftl strings
  // TODO: in FXA-6461
  // let bundle: FluentBundle;
  // beforeAll(async () => {
  //   bundle = await getFtlBundle('settings');
  // });

  beforeEach(() => {
    lostRecoveryKey = false;

    account = {
      resetPasswordStatus: jest.fn().mockResolvedValue(true),
      completeResetPassword: jest.fn().mockResolvedValue(MOCK_RESET_DATA),
      hasRecoveryKey: jest.fn().mockResolvedValue(false),
      hasTotpAuthClient: jest.fn().mockResolvedValue(false),
      isSessionVerifiedAuthClient: jest.fn().mockResolvedValue(true),
    } as unknown as Account;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the component as expected', async () => {
    render(<Subject />, account);
    // testAllL10n(screen, bundle);

    await screen.findByRole('heading', {
      name: 'Create new password',
    });
    screen.getByLabelText('New password');
    screen.getByLabelText('Re-enter password');
    screen.getByRole('button', { name: 'Reset password' });
    screen.getByRole('link', {
      name: 'Remember your password? Sign in',
    });
  });

  it('displays password requirements when the new password field is in focus', async () => {
    render(<Subject />, account);

    const newPasswordField = await screen.findByTestId(
      'new-password-input-field'
    );

    expect(screen.queryByText('Password requirements')).not.toBeInTheDocument();

    fireEvent.focus(newPasswordField);
    await waitFor(() => {
      expect(screen.getByText('Password requirements')).toBeVisible();
    });
  });

  it('renders the component as expected when provided with an expired link', async () => {
    account = {
      ...account,
      resetPasswordStatus: jest.fn().mockResolvedValue(false),
    } as unknown as Account;

    render(<Subject />, account);

    await screen.findByRole('heading', {
      name: 'Reset password link expired',
    });
    screen.getByText('The link you clicked to reset your password is expired.');
    screen.getByRole('button', {
      name: 'Receive new link',
    });
  });

  describe('renders the component as expected when provided with a damaged link', () => {
    let mockConsoleWarn: jest.SpyInstance;

    beforeEach(() => {
      // We expect that model bindings will warn us about missing / incorrect values.
      // We don't want these warnings to effect test output since they are expected, so we
      // will mock the function, and make sure it's called.
      mockConsoleWarn = jest
        .spyOn(console, 'warn')
        .mockImplementation(() => {});
    });

    afterEach(() => {
      mockConsoleWarn.mockClear();
    });

    it('with missing token', async () => {
      // TODO: figure out param type when looking at LinkValidator
      render(<Subject params={paramsWithMissingToken} />, account);

      await screen.findByRole('heading', {
        name: 'Reset password link damaged',
      });
      screen.getByText(
        'The link you clicked was missing characters, and may have been broken by your email client. Copy the address carefully, and try again.'
      );
      expect(mockConsoleWarn).toBeCalled();
    });
    it('with missing code', async () => {
      render(<Subject params={paramsWithMissingCode} />, account);

      await screen.findByRole('heading', {
        name: 'Reset password link damaged',
      });
      expect(mockConsoleWarn).toBeCalled();
    });
    it('with missing email', async () => {
      render(<Subject params={paramsWithMissingEmail} />, account);

      await screen.findByRole('heading', {
        name: 'Reset password link damaged',
      });
      expect(mockConsoleWarn).toBeCalled();
    });
  });

  // TODO in FXA-7630: check for metrics event when link is expired or damaged
  it('emits the expected metrics on render', async () => {
    render(<Subject />, account);

    await screen.findByRole('heading', {
      name: 'Create new password',
    });

    expect(logPageViewEvent).toHaveBeenCalledWith(
      'complete-reset-password',
      REACT_ENTRYPOINT
    );
  });

  describe('errors', () => {
    it('displays "problem setting your password" error', async () => {
      account = {
        hasRecoveryKey: jest.fn().mockResolvedValue(false),
        resetPasswordStatus: jest.fn().mockResolvedValue(true),
        completeResetPassword: jest
          .fn()
          .mockRejectedValue(new Error('Request failed')),
      } as unknown as Account;

      render(<Subject />, account);

      await waitFor(() => {
        fireEvent.input(screen.getByTestId('new-password-input-field'), {
          target: { value: PASSWORD },
        });
      });

      fireEvent.input(screen.getByTestId('verify-password-input-field'), {
        target: { value: PASSWORD },
      });

      fireEvent.click(screen.getByText('Reset password'));

      await screen.findByText('Unexpected error');
    });

    it('displays account recovery key check error', async () => {
      account = {
        resetPasswordStatus: jest.fn().mockResolvedValue(true),
        hasRecoveryKey: jest
          .fn()
          .mockRejectedValue(new Error('Request failed')),
      } as unknown as Account;

      render(<Subject />, account);

      await screen.findByText(
        'Sorry, there was a problem checking if you have an account recovery key.',
        { exact: false }
      );

      const useKeyLink = screen.getByRole('link', {
        name: 'Reset your password with your account recovery key.',
      });
      expect(useKeyLink).toHaveAttribute(
        'href',
        `/account_recovery_confirm_key${search}`
      );
    });
  });

  describe('account has recovery key', () => {
    const accountWithRecoveryKey = {
      resetPasswordStatus: jest.fn().mockResolvedValue(true),
      completeResetPassword: jest.fn().mockResolvedValue(MOCK_RESET_DATA),
      hasRecoveryKey: jest.fn().mockResolvedValue(true),
    } as unknown as Account;

    it('redirects as expected', async () => {
      lostRecoveryKey = false;
      render(<Subject />, accountWithRecoveryKey);

      screen.getByLabelText('Loading…');

      await waitFor(() =>
        expect(accountWithRecoveryKey.hasRecoveryKey).toHaveBeenCalledWith(
          mockCompleteResetPasswordParams.email
        )
      );

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(
          expect.stringContaining('/account_recovery_confirm_key'),
          {
            replace: true,
            state: { email: mockCompleteResetPasswordParams.email },
          }
        );
      });
    });

    it('does not check or redirect when state has lostRecoveryKey', async () => {
      lostRecoveryKey = true;
      render(<Subject />, accountWithRecoveryKey);
      // If recovery key reported as lost, default CompleteResetPassword page is rendered
      await screen.findByRole('heading', {
        name: 'Create new password',
      });
      expect(accountWithRecoveryKey.hasRecoveryKey).not.toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('can submit', () => {
    async function enterPasswordAndSubmit() {
      await waitFor(() => {
        fireEvent.input(screen.getByTestId('new-password-input-field'), {
          target: { value: PASSWORD },
        });
      });
      fireEvent.input(screen.getByTestId('verify-password-input-field'), {
        target: { value: PASSWORD },
      });

      await act(async () => {
        fireEvent.click(screen.getByText('Reset password'));
      });
    }

    it('calls expected functions', async () => {
      render(<Subject />, account);
      await enterPasswordAndSubmit();
      // Check that completeResetPassword was the first function called
      // because it retrieves the session token required by other calls
      expect(
        (account.completeResetPassword as jest.Mock).mock.calls[0]
      ).toBeTruthy();
      expect(account.isSessionVerifiedAuthClient).toHaveBeenCalled();
      expect(account.hasTotpAuthClient).toHaveBeenCalled();
    });

    it('submits with emailToHashWith if present', async () => {
      render(<Subject />, account);
      const { token, emailToHashWith, code } = mockCompleteResetPasswordParams;

      await enterPasswordAndSubmit();
      expect(account.completeResetPassword).toHaveBeenCalledWith(
        token,
        code,
        emailToHashWith,
        PASSWORD,
        undefined
      );
    });
    it('submits with email if emailToHashWith is missing', async () => {
      render(<Subject params={paramsWithMissingEmailToHashWith} />, account);
      const { token, email, code } = paramsWithMissingEmailToHashWith;

      await enterPasswordAndSubmit();
      expect(account.completeResetPassword).toHaveBeenCalledWith(
        token,
        code,
        email,
        PASSWORD,
        undefined
      );
    });

    it('submits with accountResetToken if available', async () => {
      lostRecoveryKey = true;
      accountResetToken = MOCK_RESET_TOKEN;
      render(<Subject />, account);
      const { token, emailToHashWith, code } = mockCompleteResetPasswordParams;

      await enterPasswordAndSubmit();
      expect(account.completeResetPassword).toHaveBeenCalledWith(
        token,
        code,
        emailToHashWith,
        PASSWORD,
        MOCK_RESET_TOKEN
      );
    });

    describe('Web integration', () => {
      // Not needed once this page doesn't use `hardNavigateToContentServer`
      const originalWindow = window.location;
      beforeAll(() => {
        // @ts-ignore
        delete window.location;
        window.location = { ...originalWindow, href: '' };
      });
      beforeEach(() => {
        window.location.href = originalWindow.href;
      });
      afterAll(() => {
        window.location = originalWindow;
      });

      it('navigates to reset_password_verified', async () => {
        render(<Subject />, account);
        await enterPasswordAndSubmit();
        expect(mockUseNavigateWithoutRerender).toHaveBeenCalledWith(
          '/reset_password_verified?email=johndope%40example.com&emailToHashWith=johndope%40example.com&token=1111111111111111111111111111111111111111111111111111111111111111&code=11111111111111111111111111111111&uid=abc123',
          {
            replace: true,
          }
        );
      });
    });
    describe('SyncDesktop integration', () => {
      it('calls fxaLoginSignedInUser', async () => {
        const fxaLoginSignedInUserSpy = jest.spyOn(
          firefox,
          'fxaLoginSignedInUser'
        );
        render(
          <Subject
            integrationType={IntegrationType.SyncDesktop}
            params={paramsWithSyncDesktop}
          />,
          account
        );
        await enterPasswordAndSubmit();

        expect(fxaLoginSignedInUserSpy).toBeCalled();
      });
    });
  });
});
