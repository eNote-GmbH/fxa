/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React, { useCallback, useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from '@reach/router';
import { useForm } from 'react-hook-form';
import { usePageViewEvent } from '../../../lib/metrics';
import {
  CreateIntegration,
  IntegrationType,
  useAccount,
} from '../../../models';
import WarningMessage from '../../../components/WarningMessage';
import LinkRememberPassword from '../../../components/LinkRememberPassword';
import FormPasswordWithBalloons from '../../../components/FormPasswordWithBalloons';
import { REACT_ENTRYPOINT } from '../../../constants';
import CardHeader from '../../../components/CardHeader';
import AppLayout from '../../../components/AppLayout';
import Banner, { BannerType } from '../../../components/Banner';
import { FtlMsg, hardNavigateToContentServer } from 'fxa-react/lib/utils';
import LoadingSpinner from 'fxa-react/components/LoadingSpinner';
import { LinkStatus } from '../../../lib/types';
import { CompleteResetPasswordLink } from '../../../models/reset-password/verification';
import useNavigateWithoutRerender from '../../../lib/hooks/useNavigateWithoutRerender';
import { notifyFirefoxOfLogin } from '../../../lib/channels/helpers';
import { isOriginalTab } from '../../../lib/storage-utils';

// The equivalent complete_reset_password mustache file included account_recovery_reset_password
// For React, we have opted to separate these into two pages to align with the routes.
//
// Users should only see the CompleteResetPassword page on /complete _reset_password if
//   - there is no account recovery key for their account
//   - there is an account recovery key for their account, but it was reported as lost
//
// If the user has an account recovery key (and it is not reported as lost),
// navigate to /account_recovery_confirm_key
//
// If account recovery was initiated with a key, redirect to account_recovery_reset_password

enum ErrorType {
  'none',
  'recovery-key',
  'complete-reset',
}

export const viewName = 'complete-reset-password';

type FormData = {
  newPassword: string;
  confirmPassword: string;
};

type SubmitData = {
  newPassword: string;
} & CompleteResetPasswordParams;

type LocationState = { lostRecoveryKey: boolean };

type CompleteResetPasswordParams = {
  email: string;
  emailToHashWith: string;
  code: string;
  token: string;
};

const CompleteResetPassword = ({
  params,
  setLinkStatus,
}: {
  params: CompleteResetPasswordLink;
  setLinkStatus: React.Dispatch<React.SetStateAction<LinkStatus>>;
}) => {
  usePageViewEvent(viewName, REACT_ENTRYPOINT);

  const [errorType, setErrorType] = useState(ErrorType.none);
  /* Show a loading spinner until all checks complete. Without this, users with a
   * recovery key set or with an expired or damaged link will experience some jank due
   * to an immediate redirect or rerender of this page. */
  const [showLoadingSpinner, setShowLoadingSpinner] = useState(true);
  const navigate = useNavigate();
  const navigateWithoutRerender = useNavigateWithoutRerender();
  const account = useAccount();
  const location = useLocation() as ReturnType<typeof useLocation> & {
    state: LocationState;
  };
  const integration = CreateIntegration();

  const { handleSubmit, register, getValues, errors, formState, trigger } =
    useForm<FormData>({
      mode: 'onTouched',
      criteriaMode: 'all',
      defaultValues: {
        newPassword: '',
        confirmPassword: '',
      },
    });

  /* When the user clicks the confirm password reset link from their email, we check
   * to see if they have an account recovery key set. If they do, we navigate to the
   * `account_recovery_confirm_key` page. If they don't, they'll continue on with a
   * regular password reset. If users click the link leading back to this page from
   * `account_recovery_confirm_key`, assume the user has lost the key and pass along
   * a `lostRecoveryKey` flag so we don't perform the check and redirect again. */
  useEffect(() => {
    const checkForRecoveryKeyAndNavigate = async (email: string) => {
      try {
        if (await account.hasRecoveryKey(email)) {
          navigate(`/account_recovery_confirm_key${location.search}`, {
            replace: true,
            state: { ...{ email } },
          });
        }
      } catch (error) {
        setErrorType(ErrorType['recovery-key']);
      }
    };

    const handleRecoveryKeyStatus = async () => {
      if (!location.state?.lostRecoveryKey) {
        await checkForRecoveryKeyAndNavigate(params.email);
      }
      setShowLoadingSpinner(false);
    };

    handleRecoveryKeyStatus();
  }, [
    account,
    navigate,
    location.search,
    location.state?.lostRecoveryKey,
    params.email,
  ]);

  useEffect(() => {
    const checkPasswordForgotToken = async (token: string) => {
      try {
        const isValid = await account.resetPasswordStatus(token);
        if (!isValid) {
          setLinkStatus(LinkStatus.expired);
        }
      } catch (e) {
        setLinkStatus(LinkStatus.damaged);
      }
    };

    checkPasswordForgotToken(params.token);
  }, [params.token, account, setLinkStatus]);

  const alertSuccessAndNavigate = useCallback(() => {
    setErrorType(ErrorType.none);
    navigateWithoutRerender('/reset_password_verified', { replace: true });
  }, [navigateWithoutRerender]);

  const onSubmit = useCallback(
    async ({
      newPassword,
      token,
      code,
      email,
      emailToHashWith,
    }: SubmitData) => {
      try {
        // The `emailToHashWith` option is returned by the auth-server to let the front-end
        // know what to hash the new password with. This is important in the scenario where a user
        // has changed their primary email address. In this case, they must still hash with the
        // account's original email because this will maintain backwards compatibility with
        // how account password hashing works previously.
        const emailToUse = emailToHashWith || email;

        const accountResetData = await account.completeResetPassword(
          token,
          code,
          emailToUse,
          newPassword
        );

        /* NOTE: Session check/totp check must come after completeResetPassword since those
         * require session tokens that we retrieve in PW reset. We will want to refactor this
         * later but there's a `mustVerify` check getting in the way (see Account.ts comment).
         *
         * We may also want to consider putting a different error message in place for when
         * PW reset succeeds, but one of these fails. At the moment, the try/catch in Account
         * just returns false for these if the request fails. */
        const [sessionIsVerified, hasTotp] = await Promise.all([
          account.isSessionVerifiedAuthClient(),
          account.hasTotpAuthClient(),
        ]);

        let hardNavigate = false;
        switch (integration.type) {
          // NOTE: SyncBasic check is temporary until we implement codes
          // See https://docs.google.com/document/d/1K4AD69QgfOCZwFLp7rUcMOkOTslbLCh7jjSdR9zpAkk/edit#heading=h.kkt4eylho93t
          case IntegrationType.SyncDesktop:
          case IntegrationType.SyncBasic:
            notifyFirefoxOfLogin(
              {
                authAt: accountResetData.authAt,
                email,
                keyFetchToken: accountResetData.keyFetchToken,
                sessionToken: accountResetData.sessionToken,
                uid: accountResetData.uid,
                unwrapBKey: accountResetData.unwrapBKey,
                verified: accountResetData.verified,
              },
              sessionIsVerified
            );
            break;
          case IntegrationType.OAuth:
            if (
              sessionIsVerified &&
              // only allow this redirect if 2FA is not enabled, otherwise users must enter
              // their TOTP code first
              !hasTotp &&
              // a user can only redirect back to the relier from the original tab
              // to avoid two tabs redirecting.
              isOriginalTab()
            ) {
              // TODO: this.finishOAuthSignInFlow(account)) in FXA-6518 and possibly
              // remove the !OAuth check from the React experiment in router.js
              return;
            } else if (!isOriginalTab()) {
              // allows a navigation to a "complete" screen or TOTP screen if it is setup
              // TODO: check if relier has state
              if (hasTotp) {
                // finishing OAuth flow occurs on this page after entering TOTP
                // TODO: probably need to pass some params
                hardNavigateToContentServer(
                  `/signin_totp_code${location.search}`
                );
                hardNavigate = true;
              }
            }
            break;
          case IntegrationType.Web:
            if (hasTotp) {
              // take users to Settings after entering TOTP
              hardNavigateToContentServer(
                `/signin_totp_code${location.search}`
              );
              hardNavigate = true;
            }
            // TODO: if no TOTP, navigate users to /settings with the alert bar message
            // for now, just navigate to reset_password_verified
            break;
          default:
          // TODO: run unpersistVerificationData in FXA-7308
        }

        if (!hardNavigate) {
          alertSuccessAndNavigate();
        }
      } catch (e) {
        setErrorType(ErrorType['complete-reset']);
      }
    },
    [account, alertSuccessAndNavigate, integration.type, location.search]
  );

  if (showLoadingSpinner) {
    return (
      <LoadingSpinner className="bg-grey-20 flex items-center flex-col justify-center h-screen select-none" />
    );
  }

  const renderCompleteResetPasswordErrorBanner = () => {
    return (
      <Banner type={BannerType.error}>
        <FtlMsg id="complete-reset-password-error-alert">
          <p>Sorry, there was a problem setting your password</p>
        </FtlMsg>
      </Banner>
    );
  };

  const renderRecoveryKeyErrorBanner = () => {
    const hasRecoveryKeyErrorLink = (
      <Link
        to={`/account_recovery_confirm_key${location.search}`}
        className="link-white"
      >
        Reset your password with your account recovery key.
      </Link>
    );

    return (
      <Banner type={BannerType.error}>
        <FtlMsg
          id="complete-reset-password-recovery-key-error"
          elems={{
            hasRecoveryKeyErrorLink,
          }}
        >
          <p>
            Sorry, there was a problem checking if you have an account recovery
            key. {hasRecoveryKeyErrorLink}.
          </p>
        </FtlMsg>
      </Banner>
    );
  };

  return (
    <AppLayout>
      <CardHeader
        headingText="Create new password"
        headingTextFtlId="complete-reset-pw-header"
      />

      {errorType === ErrorType['recovery-key'] &&
        renderRecoveryKeyErrorBanner()}
      {errorType === ErrorType['complete-reset'] &&
        renderCompleteResetPasswordErrorBanner()}

      <WarningMessage
        warningMessageFtlId="complete-reset-password-warning-message-2"
        warningType="Remember:"
      >
        When you reset your password, you reset your account. You may lose some
        of your personal information (including history, bookmarks, and
        passwords). That’s because we encrypt your data with your password to
        protect your privacy. You’ll still keep any subscriptions you may have
        and Pocket data will not be affected.
      </WarningMessage>

      {/* Hidden email field is to allow Fx password manager
          to correctly save the updated password. Without it,
          the password manager tries to save the old password
          as the username. */}
      <input type="email" value={params.email} className="hidden" readOnly />
      <section className="text-start mt-4">
        <FormPasswordWithBalloons
          {...{
            formState,
            errors,
            trigger,
            register,
            getValues,
          }}
          email={params.email}
          passwordFormType="reset"
          onSubmit={handleSubmit(({ newPassword }) =>
            onSubmit({
              newPassword,
              token: params.token,
              code: params.code,
              email: params.email,
              emailToHashWith: params.emailToHashWith,
            })
          )}
          loading={false}
          onFocusMetricsEvent={`${viewName}.engage`}
        />
      </section>
      <LinkRememberPassword email={params.email} />
    </AppLayout>
  );
};

export default CompleteResetPassword;
