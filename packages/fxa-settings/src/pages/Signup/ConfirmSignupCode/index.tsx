/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React, { useEffect, useState } from 'react';
import { navigate, RouteComponentProps, useLocation } from '@reach/router';
import {
  CLEAR_MESSAGES_TIMEOUT,
  REACT_ENTRYPOINT,
  RESEND_CODE_TIMEOUT,
} from '../../../constants';
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
  ResendCodeErrorBanner,
  ResendEmailSuccessBanner,
} from '../../../components/Banner';
import CardHeader from '../../../components/CardHeader';
import FormVerifyCode, {
  FormAttributes,
} from '../../../components/FormVerifyCode';
import { MailImage } from '../../../components/images';
import LoadingSpinner from 'fxa-react/components/LoadingSpinner';
import { Newsletter } from '../../../components/ChooseNewsletters/newsletters';
import { ResendStatus } from 'fxa-settings/src/lib/types';
import { ConfirmSignupCodeProps } from './interfaces';
import { IntegrationType, isOAuthIntegration } from '../../../models';
import { notifyFirefoxOfLogin } from '../../../lib/channels/helpers';
import {
  clearOAuthData,
  clearOriginalTab,
  isOriginalTab,
} from '../../../lib/storage-utils';

export const viewName = 'confirm-signup-code';

type LocationState = { email: string; newsletters?: Newsletter[] };

const ConfirmSignupCode = ({
  integration,
  finishOAuthFlowHandler,
}: ConfirmSignupCodeProps & RouteComponentProps) => {
  usePageViewEvent(viewName, REACT_ENTRYPOINT);

  const ftlMsgResolver = useFtlMsgResolver();
  const alertBar = useAlertBar();
  const account = useAccount();
  const [codeErrorMessage, setCodeErrorMessage] = useState<string>('');
  const [resendCodeCount, setResendCodeCount] = useState<number>(0);
  const [clearMessages, setClearMessages] = useState<boolean>(false);
  const [resendStatus, setResendStatus] = useState<ResendStatus>(
    ResendStatus['not sent']
  );

  const location = useLocation() as ReturnType<typeof useLocation> & {
    state: LocationState;
  };

  // email will be obtained from location state (passed in from /signup submit)
  // in the meantime, here's a hard-coded email
  const email = location.state?.email || 'potato@potatoes.com';

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
    submitButtonFtlId: 'confirm-signup-code-submit-button',
    submitButtonText: 'Confirm',
  };

  const localizedCustomCodeRequiredMessage = ftlMsgResolver.getMsg(
    'confirm-signup-code-is-required-error',
    'Confirmation code is required'
  );

  // When the user types in the code input field, all banners and tooltips should be cleared
  // Timeout is added to reduce jankiness, but does not include a smooth hiding effect.
  useEffect(() => {
    if (clearMessages) {
      const timer = setTimeout(() => {
        setCodeErrorMessage('');
        setBanner({ type: undefined, children: undefined });
        setClearMessages(false);
      }, CLEAR_MESSAGES_TIMEOUT);
      return () => clearTimeout(timer);
    }
    return;
  }, [clearMessages]);

  // Hide the ResendCode button after too many attempts. Redisplay button after a delay.
  useEffect(() => {
    if (resendCodeCount > 3) {
      const timer = setTimeout(() => {
        setResendCodeCount(0);
      }, RESEND_CODE_TIMEOUT);
      return () => clearTimeout(timer);
    }
    return;
  }, [resendCodeCount]);

  async function handleResendCode() {
    try {
      await account.sendVerificationCode();
      setResendCodeCount(resendCodeCount + 1);
      setResendStatus(ResendStatus['sent']);
    } catch (e) {
      setResendStatus(ResendStatus['error']);
    }
  }

  async function alertSuccessAndGoForward() {
    switch (integration.type) {
      case IntegrationType.SyncBasic:
        // TODO: ConnectAnotherDeviceBehavior
        break;
      case IntegrationType.SyncDesktop:
        // TODO notifyRelierOfLogin
        // The relier is notified of login here because `beforeSignUpConfirmationPoll`
        // is never called for users who verify at CWTS. Without the login notice,
        // the browser will never know the user signed up.
        break;
      case IntegrationType.OAuth:
        // TODO just use type guard instead of switch, FXA-8111
        // TODO build redirect for ConfirmSignupCode
        // if (sessionIsVerified && isOAuthIntegration(integration)) {
        //   const { redirect } = await finishOAuthFlowHandler(
        //     integration.data.uid || account.uid,
        //     accountResetData.sessionToken,
        //     accountResetData.keyFetchToken,
        //     accountResetData.unwrapBKey
        //   );

        // Clear session / local storage states
        //   clearOAuthData();
        // }

        // Check to see if the relier wants TOTP. Newly created accounts wouldn't have this
        // so lets redirect them to signin and show a message on how it can be setup.
        // This is temporary until we have a better landing page for this error.
        if (
          isOAuthIntegration(integration) &&
          integration.wantsTwoStepAuthentication()
        ) {
          // TODO verify which message should be displayed, and how to ensure user is redirected to RP after setting up TOTP
          navigate('/signin');
        }

        if (isOAuthIntegration(integration)) {
          const { redirect } = await finishOAuthFlowHandler(
            integration.data.uid,
            sessionToken()
          );
        }

        // return finishOAuthSignUpFlow(account);

        /**
         * Chrome for Android will not allow the page to redirect
         * unless its the result of a user action such as a click.
         *
         * Instead of redirecting automatically after confirmation
         * poll, force the user to the /sign(in|up)_complete page
         * where they can click a "continue" button.
         */
        //     return new NavigateBehavior('signup_confirmed', {account, continueBrokerMethod: 'finishOAuthSignUpFlow', });
        break;
      case IntegrationType.Web:
        alertBar.success(
          ftlMsgResolver.getMsg(
            'confirm-signup-code-success-alert',
            'Account confirmed successfully'
          )
        );
        navigate('/settings', { replace: true });
        break;
      default:
        navigate('signup_confirmed');
      // TODO: run unpersistVerificationData when reliers are combined
    }
  }

  async function verifySession(code: string) {
    logViewEvent(`flow.${viewName}`, 'submit', REACT_ENTRYPOINT);
    try {
      await account.verifySession(code);

      // FOLLOW-UP: does not yet exist in Settings
      // BEFORE: notifier.trigger('verification.success');
      logViewEvent(
        `flow.${viewName}`,
        'verification.success',
        REACT_ENTRYPOINT
      );
      // FOLLOW-UP: enable once state can be accessed from previous component
      // BEFORE: this.notifier.trigger('flow.event', {event: 'newsletter.subscribed',})
      // This might just be a logged event, but will depend if subscription is entirely
      // handled on the signup page or if it should only happen after verification
      // if (newsletters) {
      //   logViewEvent(`flow.${viewName}`, 'newsletter.subscribed', REACT_ENTRYPOINT);
      // }

      // FOLLOW-UP: Broker not yet implemented
      // The broker handles navigation behaviour that varies depending on the relier
      // and may include web channel notifications to ensure the verification is propagated
      // to other tabs
      // await broker.invokeBrokerMethod('afterSignUpConfirmationPoll', account);
      alertSuccessAndGoForward();
    } catch (e) {
      // TODO log error
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
        setBanner({ type: undefined, children: undefined });
        setCodeErrorMessage(localizedErrorMessage);
      } else {
        // Any other error messages should be displayed in an error banner
        // Should we display a generic user-friendly error?
        // Right now this shows errors like "Invalid parameter in request body"
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
  // BEFORE: if (!this.getAccount) redirect to signup
  if (!email) {
    navigateToSignup();
    return <LoadingSpinner />;
  }

  // FOLLOW-UP: handle bounced emails/blocked accounts
  // TODO: poll for session verification (does not exist on Settings), and
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
      {resendStatus === ResendStatus['error'] && <ResendCodeErrorBanner />}

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
          setClearMessages,
        }}
      />

      <div className="animate-delayed-fade-in opacity-0 mt-5 text-grey-500 text-xs inline-flex gap-1">
        {resendCodeCount < 4 && (
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
        )}
      </div>
    </AppLayout>
  );
};

export default ConfirmSignupCode;
