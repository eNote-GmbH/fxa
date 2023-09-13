/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React, { useState } from 'react';
import { RouteComponentProps, useLocation, useNavigate } from '@reach/router';
import { REACT_ENTRYPOINT } from '../../../constants';
import {
  AuthUiErrors,
  composeAuthUiErrorTranslationId,
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
import LoadingSpinner from 'fxa-react/components/LoadingSpinner';
import { ResendStatus } from 'fxa-settings/src/lib/types';
import { useValidatedQueryParams } from '../../../lib/hooks/useValidate';
import { ConfirmSignupCodeQueryParams } from '../../../models/pages/confirm-signup-code';
import { isOAuthIntegration, isSyncDesktopIntegration } from '../../../models';
import { sessionToken } from '../../../lib/cache';
import { ConfirmSignupCodeProps } from './interfaces';

export const viewName = 'confirm-signup-code';

type LocationState = {
  email: string;
  selectedNewsletterSlugs?: string[];
  keyFetchToken: string;
  unwrapBKey: string;
};

const ConfirmSignupCode = ({
  integration,
  finishOAuthFlowHandler,
}: ConfirmSignupCodeProps & RouteComponentProps) => {
  usePageViewEvent(viewName, REACT_ENTRYPOINT);

  const ftlMsgResolver = useFtlMsgResolver();
  const alertBar = useAlertBar();
  const account = useAccount();
  const [codeErrorMessage, setCodeErrorMessage] = useState<string>('');
  const [resendStatus, setResendStatus] = useState<ResendStatus>(
    ResendStatus['not sent']
  );

  const { queryParamModel } = useValidatedQueryParams(
    ConfirmSignupCodeQueryParams
  );
  const navigate = useNavigate();
  const location = useLocation() as ReturnType<typeof useLocation> & {
    state: LocationState;
  };

  // retrieve the email either from location state (if arriving from react)
  // or from queryParams if arriving directly from content-server
  // this second option can be removed once the /signin flow is fully converted to react
  const email = location.state?.email || queryParamModel.email;

  const navigateToSignup = () => {
    hardNavigateToContentServer('/');
  };

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

  // Potential TODO, polling? Do we want this?
  // await broker.invokeBrokerMethod('afterSignUpConfirmationPoll', account);

  // TODO: fix invalid token error received after using new code (verifySession fails on keys)
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
    } catch (e) {
      setResendStatus(ResendStatus['not sent']);
      const localizedErrorMessage = ftlMsgResolver.getMsg(
        composeAuthUiErrorTranslationId(e),
        e.message
      );
      setBanner({
        type: BannerType.error,
        children: <p>{localizedErrorMessage}</p>,
      });
    }
  }

  const getScopes = async () => {
    if (isOAuthIntegration(integration)) {
      const scopes = await integration.getPermissions();
      return scopes;
    }
    return undefined;
  };

  async function verifySession(code: string) {
    logViewEvent(`flow.${viewName}`, 'submit', REACT_ENTRYPOINT);
    try {
      const newsletterSlugs = location.state?.selectedNewsletterSlugs;
      const hasSelectedNewsletters =
        newsletterSlugs && newsletterSlugs.length > 0;

      const options = hasSelectedNewsletters
        ? { newsletters: newsletterSlugs }
        : {};
      await account.verifySession(code, options);

      logViewEvent(
        `flow.${viewName}`,
        'verification.success',
        REACT_ENTRYPOINT
      );

      if (hasSelectedNewsletters) {
        logViewEvent(
          `flow.${viewName}`,
          'newsletter.subscribed',
          REACT_ENTRYPOINT
        );
      }

      // Might need this
      // let isHardNavigate = false;
      if (isSyncDesktopIntegration(integration)) {
        // Tell FF the account is verified with webchannel event, FXA-8287
        // hardNavigateToContentServer('/connect_another_device')
      } else if (isOAuthIntegration(integration)) {
        // Certain reliers (at the time of writing, only AMO) require users to set up
        // 2FA / TOTP before they are redirected back to the RP.
        if (integration.wantsTwoStepAuthentication()) {
          // Must pass along query params to ensure user is redirected to RP after setting up TOTP
          // hardNavigateToContentServer('/inline_totp_setup${location.search}');
        } else {
          const { keyFetchToken, unwrapBKey } = location.state;
          const { redirect } = await finishOAuthFlowHandler(
            integration.data.uid,
            sessionToken()!,
            keyFetchToken,
            unwrapBKey
          );

          // Navigate back to relying party (exit react app)
          hardNavigate(redirect);
        }
      } else {
        // TODO: Check if we ever want to show 'signup_confirmed' (Ready view)
        // Backbone had a base navigation behaviour navigating here
        alertBar.success(
          ftlMsgResolver.getMsg(
            'confirm-signup-code-success-alert',
            'Account confirmed successfully'
          )
        );
        navigate('/settings', { replace: true });
      }

      // TODO: Do we need a ticket for unpersistVerificationData, or remove
      // all TODOs around it?
    } catch (e) {
      const localizedErrorMessage = ftlMsgResolver.getMsg(
        composeAuthUiErrorTranslationId(e),
        e.message
      );
      // If the error is one of the three indicated types, display error in input tooltip
      if (
        e.errno === AuthUiErrors.INVALID_EXPIRED_SIGNUP_CODE.errno ||
        e.errno === AuthUiErrors.OTP_CODE_REQUIRED.errno ||
        e.errno === AuthUiErrors.INVALID_OTP_CODE.errno
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

  // this page shouldn't render if signup was not initiated
  if (!email) {
    navigateToSignup();
    return <LoadingSpinner />;
  }

  // TODO: handle bounced emails/blocked accounts in FXA-8306
  // poll for session verification (does not exist on Settings), and
  // - if invalid token + account does not exist (no account for uid) - email bounced
  //   --> Direct the user to sign up again
  // - if the account is blocked (invalid token, but account exists)
  //   --> redirect to signin_bounced

  return (
    <AppLayout title={localizedPageTitle}>
      <CardHeader
        headingText="Enter confirmation code"
        headingAndSubheadingFtlId="confirm-signup-code-heading"
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
