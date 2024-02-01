/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithLocalizationProvider } from 'fxa-react/lib/test-utils/localizationProvider';
import GleanMetrics from '../../lib/glean';
import {
  BEGIN_SIGNIN_HANDLER_RESPONSE,
  CACHED_SIGNIN_HANDLER_RESPONSE,
  createBeginSigninHandlerResponse,
  Subject,
} from './mocks';
import { MOCK_EMAIL, MOCK_PASSWORD, MOCK_SESSION_TOKEN } from '../mocks';
import { MozServices } from '../../lib/types';
import * as utils from 'fxa-react/lib/utils';
import { storeAccountData } from '../../lib/storage-utils';
import VerificationMethods from '../../constants/verification-methods';
// import { getFtlBundle, testAllL10n } from 'fxa-react/lib/test-utils';
// import { FluentBundle } from '@fluent/bundle';
jest.mock('../../lib/metrics', () => ({
  usePageViewEvent: jest.fn(),
  logViewEvent: jest.fn(),
  logViewEventOnce: jest.fn(),
  useMetrics: () => ({
    usePageViewEvent: jest.fn(),
    logViewEvent: jest.fn(),
    logViewEventOnce: jest.fn(),
  }),
}));
jest.mock('../../lib/glean', () => ({
  __esModule: true,
  default: {
    login: {
      forgotPassword: jest.fn(),
      view: jest.fn(),
      submit: jest.fn(),
      success: jest.fn(),
    },
    cachedLogin: {
      forgotPassword: jest.fn(),
      view: jest.fn(),
      submit: jest.fn(),
      success: jest.fn(),
    },
  },
}));
jest.mock('../../lib/storage-utils', () => ({
  storeAccountData: jest.fn(),
}));

const mockLocation = () => {
  return {
    pathname: '/signin',
  };
};
const mockNavigate = jest.fn();
jest.mock('@reach/router', () => ({
  ...jest.requireActual('@reach/router'),
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation(),
}));

// TODO: Once https://mozilla-hub.atlassian.net/browse/FXA-6461 is resolved, we can
// add the l10n tests back in. Right now, they can't handle embedded tags.

function submit() {
  fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
}
function enterPasswordAndSubmit() {
  fireEvent.input(screen.getByLabelText('Password'), {
    target: { value: MOCK_PASSWORD },
  });
  submit();
}

/* Element rendered or not rendered functions */
function signInHeaderRendered(service: MozServices = MozServices.Default) {
  screen.getByRole('heading', {
    name: 'Sign in',
  });
  screen.getByText(`Continue to ${service}`);
}
function privacyAndTermsRendered() {
  const terms = screen.getByRole('link', {
    name: /Terms of Service/,
  });
  const privacy = screen.getByRole('link', {
    name: /Privacy Notice/,
  });
  expect(terms).toHaveAttribute('href', '/legal/terms');
  expect(privacy).toHaveAttribute('href', '/legal/privacy');
}

function thirdPartyAuthRendered() {
  screen.getByRole('button', {
    name: /Continue with Google/,
  });
  screen.getByRole('button', {
    name: /Continue with Apple/,
  });
}
function signInButtonAndSeparatorRendered() {
  screen.getByRole('button', { name: 'Sign in' });
  screen.getByText('Or');
}
function passwordInputRendered() {
  screen.getByLabelText('Password');
}
function passwordInputNotRendered() {
  expect(screen.queryByLabelText('Password')).not.toBeInTheDocument();
}
function avatarAndEmailRendered() {
  screen.getByAltText('Your avatar');
  screen.getByText(MOCK_EMAIL);
}
function resetPasswordLinkRendered() {
  expect(
    screen.getByRole('link', { name: 'Forgot password?' })
  ).toHaveAttribute('href', '/reset_password');
}
function differentAccountLinkRendered() {
  screen.getByRole('link', { name: 'Use a different account' });
}

describe('Signin', () => {
  // let bundle: FluentBundle;
  // beforeAll(async () => {
  //   bundle = await getFtlBundle('settings');
  // });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('missing sessionToken', () => {
    describe('user has a password', () => {
      it('renders as expected', () => {
        renderWithLocalizationProvider(<Subject />);

        expect(GleanMetrics.login.view).toHaveBeenCalledTimes(1);
        screen.getByRole('heading', {
          name: 'Enter your password for your Mozilla account',
        });
        avatarAndEmailRendered();
        passwordInputRendered();
        thirdPartyAuthRendered();
        signInButtonAndSeparatorRendered();
        privacyAndTermsRendered();
        resetPasswordLinkRendered();
        differentAccountLinkRendered();
      });

      it('emits an event on forgot password link click', async () => {
        renderWithLocalizationProvider(<Subject />);
        fireEvent.click(screen.getByText('Forgot password?'));
        await waitFor(() => {
          expect(GleanMetrics.login.forgotPassword).toBeCalledTimes(1);
        });
      });

      describe('signInWithPassword', () => {
        it('renders tooltip on empty field submission, clears onchange', async () => {
          const beginSigninHandler = jest.fn();
          renderWithLocalizationProvider(
            <Subject {...{ beginSigninHandler }} />
          );
          submit();
          await waitFor(() => {
            screen.getByText('Valid password required');
          });
          expect(GleanMetrics.login.submit).not.toHaveBeenCalled();
          expect(beginSigninHandler).not.toHaveBeenCalled();

          fireEvent.input(screen.getByLabelText(/Password/), {
            target: { value: MOCK_PASSWORD },
          });
          await waitFor(() => {
            expect(
              screen.queryByText('Valid password required')
            ).not.toBeInTheDocument();
          });
        });
        describe('successful submission', () => {
          it('submits and emits metrics', async () => {
            const beginSigninHandler = jest
              .fn()
              .mockReturnValueOnce(BEGIN_SIGNIN_HANDLER_RESPONSE);
            renderWithLocalizationProvider(
              <Subject {...{ beginSigninHandler }} />
            );
            enterPasswordAndSubmit();
            await waitFor(() => {
              expect(beginSigninHandler).toHaveBeenCalledWith(
                MOCK_EMAIL,
                MOCK_PASSWORD
              );
            });
            expect(GleanMetrics.login.submit).toHaveBeenCalledTimes(1);
            expect(GleanMetrics.login.success).toHaveBeenCalledTimes(1);
            expect(storeAccountData).toHaveBeenCalled();
          });

          it('navigates to /signin_totp_code when conditions are met', async () => {
            const beginSigninHandler = jest.fn().mockReturnValueOnce(
              createBeginSigninHandlerResponse({
                verified: false,
                verificationMethod: VerificationMethods.TOTP_2FA,
              })
            );
            renderWithLocalizationProvider(
              <Subject {...{ beginSigninHandler }} />
            );

            enterPasswordAndSubmit();
            await waitFor(() => {
              expect(mockNavigate).toHaveBeenCalledWith('/signin_totp_code');
            });
          });
          // it('navigates to /confirm_signup_code when conditions are met', async () => {});
          // it('navigates to /signin_token_code when conditions are met', async () => {});
          // it('navigates to /settings', async () => {});
        });
        // describe('errored submission', () => {
        //   it('shows error due to incorrect password', async () => {});
        //   it('handles error due to throttled or request blocked', async () => {});
        //   it('handles error due to hard bounce or email complaint', async () => {});
        //   it('handles error due to TOTP required or insufficent ARC value', async () => {});
        // });
      });
    });
    describe('user does not have a password', () => {
      it('renders as expected without linked account', () => {
        renderWithLocalizationProvider(<Subject hasPassword={false} />);

        signInHeaderRendered();
        avatarAndEmailRendered();
        signInButtonAndSeparatorRendered();
        thirdPartyAuthRendered();
        privacyAndTermsRendered();
        differentAccountLinkRendered();
        resetPasswordLinkRendered();

        passwordInputNotRendered();
      });
      it('renders as expected with linked account', () => {
        renderWithLocalizationProvider(
          <Subject hasPassword={false} hasLinkedAccount />
        );
        signInHeaderRendered();
        avatarAndEmailRendered();
        thirdPartyAuthRendered();
        privacyAndTermsRendered();

        passwordInputNotRendered();
        expect(
          screen.queryByRole('link', { name: 'Forgot password?' })
        ).not.toBeInTheDocument();
        expect(screen.queryByText('Or')).not.toBeInTheDocument();
        expect(
          screen.queryByRole('button', { name: 'Sign in' })
        ).not.toBeInTheDocument();
      });
    });
  });
  describe('with sessionToken', () => {
    it('renders as expected', () => {
      renderWithLocalizationProvider(
        <Subject sessionToken={MOCK_SESSION_TOKEN} />
      );

      expect(GleanMetrics.cachedLogin.view).toHaveBeenCalledTimes(1);
      signInHeaderRendered();
      avatarAndEmailRendered();
      thirdPartyAuthRendered();
      signInButtonAndSeparatorRendered();
      privacyAndTermsRendered();
      resetPasswordLinkRendered();
      differentAccountLinkRendered();

      passwordInputNotRendered();
    });

    it('emits an event on forgot password link click', async () => {
      renderWithLocalizationProvider(
        <Subject sessionToken={MOCK_SESSION_TOKEN} />
      );
      fireEvent.click(screen.getByText('Forgot password?'));
      await waitFor(() => {
        expect(GleanMetrics.cachedLogin.forgotPassword).toBeCalledTimes(1);
      });
    });

    describe('successful submission', () => {
      it('submits and emits metrics', async () => {
        const cachedSigninHandler = jest
          .fn()
          .mockReturnValueOnce(CACHED_SIGNIN_HANDLER_RESPONSE);
        renderWithLocalizationProvider(
          <Subject
            {...{ cachedSigninHandler }}
            sessionToken={MOCK_SESSION_TOKEN}
          />
        );

        submit();
        await waitFor(() => {
          expect(cachedSigninHandler).toHaveBeenCalledWith(MOCK_SESSION_TOKEN);
        });
        expect(GleanMetrics.cachedLogin.submit).toHaveBeenCalledTimes(1);
        expect(GleanMetrics.cachedLogin.success).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('errored submission', () => {
    it('requires password if cached credentials have expired', () => {});
  });

  describe('hardNavigateToContentServer', () => {
    let hardNavigateToContentServerSpy: jest.SpyInstance;

    beforeEach(() => {
      hardNavigateToContentServerSpy = jest
        .spyOn(utils, 'hardNavigateToContentServer')
        .mockImplementation(() => {});
    });
    afterEach(() => {
      hardNavigateToContentServerSpy.mockRestore();
    });

    it('allows users to use a different account', async () => {
      renderWithLocalizationProvider(<Subject />);

      await waitFor(() => {
        fireEvent.click(
          screen.getByRole('link', {
            name: 'Use a different account',
          })
        );
      });
      expect(hardNavigateToContentServerSpy).toHaveBeenCalledWith(
        `/?prefillEmail=${encodeURIComponent(MOCK_EMAIL)}`
      );
    });
  });
});

// TODO in OAuth ticket:
//   expect(pocketTermsLink).toHaveAttribute(
//     'href',
//     'https://getpocket.com/tos/'
//   );
//   expect(pocketPrivacyLink).toHaveAttribute(
//     'href',
//     'https://getpocket.com/privacy/'
//   );
//   const pocketLogo = screen.getByLabelText('Pocket');

//   expect(signinHeader).toBeInTheDocument();
//   expect(pocketLogo).toBeInTheDocument();
//   expect(passwordInputForm).not.toBeInTheDocument();

// TODO with Sync: make sure third party auth is not rendered
