/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React, { useEffect, useState } from 'react';
import { RouteComponentProps, useLocation, useNavigate } from '@reach/router';
import { REACT_ENTRYPOINT } from '../../../constants';
import {
  AuthUiErrors,
  composeAuthUiErrorTranslationId,
  getLocalizedErrorMessage,
} from '../../../lib/auth-errors/auth-errors';
import { logViewEvent, usePageViewEvent } from '../../../lib/metrics';
import {
  FtlMsg,
  hardNavigate,
  hardNavigateToContentServer,
} from 'fxa-react/lib/utils';
import {
  useAccount,
  useAlertBar,
  useFtlMsgResolver,
} from '../../../models/hooks';
import AppLayout from '../../../components/AppLayout';
import Banner, {
  BannerProps,
  BannerType,
  ResendEmailSuccessBanner,
} from '../../../components/Banner';
import CardHeader from '../../../components/CardHeader';
import FormVerifyCode, {
  FormAttributes,
} from '../../../components/FormVerifyCode';
import { MailImage } from '../../../components/images';
import { ResendStatus } from 'fxa-settings/src/lib/types';
import { isOAuthIntegration, isSyncDesktopIntegration } from '../../../models';
import { ConfirmSignupCodeProps } from './interfaces';
import firefox from '../../../lib/channels/firefox';
import { StoredAccountData, persistAccount } from '../../../lib/storage-utils';
import { BrandMessagingPortal } from '../../../components/BrandMessaging';
import { currentAccount } from '../../../lib/cache';
import GleanMetrics from '../../../lib/glean';
import { useRedirect } from '../../../lib/hooks/useRedirect';

export const viewName = 'confirm-signup-code';

const ConfirmSignupCode = ({
  email,
  sessionToken,
  uid,
  integration,
  finishOAuthFlowHandler,
  newsletterSlugs: newsletters,
  keyFetchToken,
  unwrapBKey,
}: ConfirmSignupCodeProps & RouteComponentProps) => {
  usePageViewEvent(viewName, REACT_ENTRYPOINT);

  const ftlMsgResolver = useFtlMsgResolver();
  const location = useLocation();
  const alertBar = useAlertBar();
  const account = useAccount();
  const [codeErrorMessage, setCodeErrorMessage] = useState<string>('');
  const [resendStatus, setResendStatus] = useState<ResendStatus>(
    ResendStatus['not sent']
  );
  // TODO: Sync mobile cleanup, see note in oauth-integration isSync
  const isSyncMobileWebChannel =
    isOAuthIntegration(integration) && integration.isSync();

  const navigate = useNavigate();
  const redirectCheck = useRedirect(integration.data.redirectTo);

  useEffect(() => {
    GleanMetrics.signupConfirmation.view();
  }, []);

  const [banner, setBanner] = useState<Partial<BannerProps>>({
    type: undefined,
    children: undefined,
  });

  const formAttributes: FormAttributes = {
    inputFtlId: 'confirm-signup-code-input-label',
    inputLabelText: 'Enter 6-digit code',
    pattern: '[0-9]{6}',
    maxLength: 6,
    submitButtonFtlId: 'confirm-signup-code-confirm-button',
    submitButtonText: 'Confirm',
  };

  const localizedCustomCodeRequiredMessage = ftlMsgResolver.getMsg(
    'confirm-signup-code-is-required-error',
    'Confirmation code is required'
  );

  async function handleResendCode() {
    try {
      await account.sendVerificationCode();
      // if resending a code is succesful, clear any banner already present on screen
      if (resendStatus !== ResendStatus['sent']) {
        setBanner({
          type: undefined,
          children: undefined,
        });
        setResendStatus(ResendStatus['sent']);
      }
    } catch (error) {
      setResendStatus(ResendStatus['not sent']);
      const localizedErrorMessage = getLocalizedErrorMessage(
        ftlMsgResolver,
        error
      );
      setBanner({
        type: BannerType.error,
        children: <p>{localizedErrorMessage}</p>,
      });
    }
  }

  async function verifySession(code: string) {
    logViewEvent(`flow.${viewName}`, 'submit', REACT_ENTRYPOINT);
    GleanMetrics.signupConfirmation.submit();
    try {
      const hasSelectedNewsletters = newsletters && newsletters.length > 0;

      const options = {
        ...(hasSelectedNewsletters && { ...{ newsletters } }),
        ...(isOAuthIntegration(integration) && {
          scopes: integration.getPermissions(),
          service: integration.getService(),
        }),
      };

      await account.verifySession(code, options);

      logViewEvent(
        `flow.${viewName}`,
        'verification.success',
        REACT_ENTRYPOINT
      );

      // Update verification status of stored current account
      const storedAccount: StoredAccountData = currentAccount();
      storedAccount.verified = true;
      persistAccount(storedAccount);

      if (hasSelectedNewsletters) {
        // to match parity with content-server event, viewName is NOT included
        logViewEvent(`flow`, 'newsletter.subscribed', REACT_ENTRYPOINT);
      }

      if (isSyncDesktopIntegration(integration)) {
        // Connect another device tells Sync the user is signed in
        hardNavigateToContentServer(
          `/connect_another_device${location.search}`
        );
      } else if (isOAuthIntegration(integration)) {
        // Check to see if the relier wants TOTP.
        // Newly created accounts wouldn't have this so lets redirect them to signin.
        // Certain reliers may require users to set up 2FA / TOTP
        // before they can be redirected back to the RP.
        // Notes in content-server indicate that a message should be displayed on the signin page
        // to explain why totp setup is required, but this does not currently
        // appear to be implemented.

        // TODO enable wantsTwoStepAuthentication check
        // Currently, does not correctly check for acr_values param
        // and is returned as false even if search params contain acr_values=AAL2 (or higher)

        // Params are included to eventually allow for redirect to RP after 2FA setup
        if (integration.wantsTwoStepAuthentication()) {
          hardNavigateToContentServer(`oauth/signin${location.search}`);
          return;
        } else {
          const { redirect, code, state } = await finishOAuthFlowHandler(
            integration.data.uid,
            sessionToken,
            // yes, non-null operator is gross, but it's temporary.
            // see note in container component / router.js for this page, once
            // we've converted the index page we can remove
            keyFetchToken!,
            unwrapBKey!
          );

          if (isSyncMobileWebChannel) {
            firefox.fxaOAuthLogin({
              // TODO: is this 'action' correct?
              action: 'signup',
              code,
              redirect,
              state,
            });
            // Mobile sync will close the web view, so nothing else to do
            return;
          } else {
            // Navigate to relying party
            hardNavigate(redirect);
            return;
          }
        }
        // Web integration, SubPlat redirect
      } else if (integration.data.redirectTo) {
        if (redirectCheck.isValid) {
          hardNavigate(integration.data.redirectTo);
        } else {
          // For now we just want to show the user this error message to match parity
          // even if the code is successful - this matches parity with content-server
          // behavior but may be revisited when we look at our signup flows as a whole.
          setBanner({
            type: BannerType.error,
            children: <p>{redirectCheck.localizedErrorMessage}</p>,
          });
        }
        // Web integration, no redirect
      } else {
        // TODO: Check if we ever want to show 'signup_confirmed' (Ready view)
        // Backbone had a base navigation behaviour navigating there
        alertBar.success(
          ftlMsgResolver.getMsg(
            'confirm-signup-code-success-alert',
            'Account confirmed successfully'
          )
        );
        navigate(`/settings${location.search}`, { replace: true });
      }
    } catch (error) {
      let localizedErrorMessage: string;
      // Intercept invalid parameter error and set the error message to INVALID_EXPIRED_SIGNUP_CODE
      // This error occurs when the submitted code does not pass validation for the code param
      // e.g., if the submitted code contains spaces or characters other than numbers
      if (error.errno === 107) {
        localizedErrorMessage = ftlMsgResolver.getMsg(
          composeAuthUiErrorTranslationId(
            AuthUiErrors.INVALID_EXPIRED_SIGNUP_CODE
          ),
          AuthUiErrors.INVALID_EXPIRED_SIGNUP_CODE.message
        );
      } else {
        localizedErrorMessage = getLocalizedErrorMessage(ftlMsgResolver, error);
      }

      // In any case where the submitted code is invalid/expired, show the error message in a tooltip
      if (
        error.errno === AuthUiErrors.INVALID_EXPIRED_SIGNUP_CODE.errno ||
        error.errno === AuthUiErrors.OTP_CODE_REQUIRED.errno ||
        error.errno === AuthUiErrors.INVALID_OTP_CODE.errno ||
        error.errno === 107
      ) {
        setCodeErrorMessage(localizedErrorMessage);
      } else {
        // Clear resend link success banner (if displayed) before rendering an error banner
        setResendStatus(ResendStatus['not sent']);
        // Any other error messages should be displayed in an error banner
        setBanner({
          type: BannerType.error,
          children: <p>{localizedErrorMessage}</p>,
        });
      }
    }
  }

  const localizedPageTitle = ftlMsgResolver.getMsg(
    'confirm-signup-code-page-title',
    'Enter confirmation code'
  );

  // TODO: handle bounced emails/blocked accounts in FXA-8306
  // poll for session verification (does not exist on Settings), and
  // - if invalid token + account does not exist (no account for uid) - email bounced
  //   --> Direct the user to sign up again
  // - if the account is blocked (invalid token, but account exists)
  //   --> redirect to signin_bounced

  return (
    <AppLayout title={localizedPageTitle}>
      <BrandMessagingPortal {...{ viewName }} />
      <CardHeader
        headingText="Enter confirmation code"
        headingAndSubheadingFtlId="confirm-signup-code-heading-2"
      />

      {banner.type && banner.children && (
        <Banner type={banner.type}>{banner.children}</Banner>
      )}

      {resendStatus === ResendStatus['sent'] && <ResendEmailSuccessBanner />}

      <div className="flex justify-center mx-auto">
        <MailImage className="w-3/5" />
      </div>

      <FtlMsg id="confirm-signup-code-instruction" vars={{ email: email! }}>
        <p className="m-5 text-sm">
          Enter the code that was sent to {email} within 5 minutes.
        </p>
      </FtlMsg>

      <FormVerifyCode
        {...{
          formAttributes,
          viewName,
          verifyCode: verifySession,
          localizedCustomCodeRequiredMessage,
          codeErrorMessage,
          setCodeErrorMessage,
        }}
      />

      <div className="animate-delayed-fade-in opacity-0 mt-5 text-grey-500 text-xs inline-flex gap-1">
        <>
          <FtlMsg id="confirm-signup-code-code-expired">
            <p>Code expired?</p>
          </FtlMsg>
          <FtlMsg id="confirm-signup-code-resend-code-link">
            <button
              id="resend"
              className="link-blue"
              onClick={handleResendCode}
            >
              Email new code.
            </button>
          </FtlMsg>
        </>
      </div>
    </AppLayout>
  );
};

export default ConfirmSignupCode;
