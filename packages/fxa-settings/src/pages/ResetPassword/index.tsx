/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { RouteComponentProps, useNavigate } from '@reach/router';
import React, { useCallback, useEffect, useState } from 'react';
import { Control, useForm, useWatch } from 'react-hook-form';
import { REACT_ENTRYPOINT } from '../../constants';
import {
  AuthUiErrorNos,
  AuthUiErrors,
  composeAuthUiErrorTranslationId,
} from '../../lib/auth-errors/auth-errors';
import { usePageViewEvent, useMetrics } from '../../lib/metrics';
import { MozServices } from '../../lib/types';
import {
  Relier,
  Integration,
  isOAuthRelier,
  useAccount,
  useFtlMsgResolver,
} from '../../models';

import { FtlMsg } from 'fxa-react/lib/utils';

import AppLayout from '../../components/AppLayout';
import Banner, { BannerType } from '../../components/Banner';
import CardHeader from '../../components/CardHeader';
import { ConfirmResetPasswordLocationState } from './ConfirmResetPassword';
import { InputText } from '../../components/InputText';
import LinkRememberPassword from '../../components/LinkRememberPassword';
import WarningMessage from '../../components/WarningMessage';
import { isEmailValid } from 'fxa-shared/email/helpers';
import sentryMetrics from 'fxa-shared/lib/sentry';
import { setOriginalTabMarker } from '../../lib/storage-utils';

export const viewName = 'reset-password';

export type ResetPasswordProps = {
  prefillEmail?: string;
  forceAuth?: boolean;
  serviceName?: MozServices;
  integrationAndRelier: { relier: Relier; integration: Integration };
};

type FormData = {
  email: string;
};

// eslint-disable-next-line no-empty-pattern
const ResetPassword = ({
  prefillEmail,
  forceAuth,
  integrationAndRelier,
}: ResetPasswordProps & RouteComponentProps) => {
  usePageViewEvent(viewName, REACT_ENTRYPOINT);
  const [errorText, setErrorText] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [hasFocused, setHasFocused] = useState<boolean>(false);
  const account = useAccount();
  const relier = integrationAndRelier.relier;
  const navigate = useNavigate();
  const ftlMsgResolver = useFtlMsgResolver();

  // NOTE: This was previously part of the persistVerificationData. Let's keep these operations atomic in the new version though.
  setOriginalTabMarker();

  const [serviceName, setServiceName] = useState<string>(MozServices.Default);
  useEffect(() => {
    (async () => {
      const name = await relier.getServiceName();
      setServiceName(name);
    })();
  }, [relier]);

  const { control, getValues, handleSubmit, register } = useForm<FormData>({
    mode: 'onTouched',
    criteriaMode: 'all',
    // The email field is not pre-filled for the reset_password page,
    // but if the user enters an email address, the entered email
    // address should be propagated back to the signin page. If
    // the user enters no email and instead clicks "Remember password?"
    // immediately, the /signin page should have the original email.
    // See https://github.com/mozilla/fxa-content-server/issues/5293.
    defaultValues: {
      email: '',
    },
  });

  // Log a metrics event when a user first engages with the form
  const { logViewEventOnce: logEngageEvent } = useMetrics();
  const onFocus = useCallback(() => {
    if (!hasFocused) {
      logEngageEvent(viewName, 'engage', REACT_ENTRYPOINT);
      setHasFocused(true);
    }
  }, [hasFocused, logEngageEvent]);

  const navigateToConfirmPwReset = useCallback(
    (stateData: ConfirmResetPasswordLocationState) => {
      navigate('confirm_reset_password?showReactApp=true', {
        state: stateData,
        replace: true,
      });
    },
    [navigate]
  );

  const clearError = useCallback(() => {
    if (errorText !== '') {
      setErrorText('');
      setErrorMessage('');
    }
  }, [errorText, setErrorText]);

  const submitEmail = useCallback(
    async (email: string) => {
      try {
        clearError();

        // This will save the scope and oauth state for later
        if (isOAuthRelier(relier)) {
          relier.saveOAuthState();
          const result = await account.resetPassword(
            email,
            relier.getService(),
            relier.getRedirectUri()
          );
          navigateToConfirmPwReset({
            passwordForgotToken: result.passwordForgotToken,
            email,
          });
        } else {
          const result = await account.resetPassword(email);
          navigateToConfirmPwReset({
            passwordForgotToken: result.passwordForgotToken,
            email,
          });
        }
      } catch (err) {
        let localizedError;
        if (err.errno && AuthUiErrorNos[err.errno]) {
          if (
            err.errno === AuthUiErrors.THROTTLED.errno &&
            err.retryAfterLocalized
          ) {
            localizedError = ftlMsgResolver.getMsg(
              composeAuthUiErrorTranslationId(err),
              AuthUiErrorNos[err.errno].message,
              { retryAfter: err.retryAfterLocalized }
            );
          } else {
            localizedError = ftlMsgResolver.getMsg(
              composeAuthUiErrorTranslationId(err),
              AuthUiErrorNos[err.errno].message
            );
          }
        } else {
          // TEMPORARY deliberate log to help debug FXA-7347, this should be captured server-side
          // but for some reason isn't logging to Sentry
          sentryMetrics.captureException(err);
          const unexpectedError = AuthUiErrors.UNEXPECTED_ERROR;
          localizedError = ftlMsgResolver.getMsg(
            composeAuthUiErrorTranslationId(unexpectedError),
            unexpectedError.message
          );
        }
        setErrorMessage(localizedError);
      }
    },
    [account, clearError, ftlMsgResolver, navigateToConfirmPwReset, relier]
  );

  const onSubmit = useCallback(async () => {
    const sanitizedEmail = getValues('email').trim();
    if (sanitizedEmail === '') {
      setErrorText(
        ftlMsgResolver.getMsg(
          'reset-password-email-required-error',
          'Email required'
        )
      );
      return;
    } else if (!isEmailValid(sanitizedEmail)) {
      setErrorText(
        ftlMsgResolver.getMsg('auth-error-1011', 'Valid email required')
      );
    } else {
      submitEmail(sanitizedEmail);
    }
  }, [ftlMsgResolver, getValues, submitEmail]);

  const ControlledLinkRememberPassword = ({
    control,
  }: {
    control: Control<FormData>;
  }) => {
    const email: string = useWatch({
      control,
      name: 'email',
      defaultValue: getValues().email,
    });
    return <LinkRememberPassword {...{ email }} />;
  };

  return (
    <AppLayout>
      <CardHeader
        headingWithDefaultServiceFtlId="reset-password-heading-w-default-service"
        headingWithCustomServiceFtlId="reset-password-heading-w-custom-service"
        headingText="Reset password"
        {...{ serviceName }}
      />

      {errorMessage && (
        <Banner type={BannerType.error}>
          <p>{errorMessage}</p>
        </Banner>
      )}

      <WarningMessage
        warningMessageFtlId="reset-password-warning-message-2"
        warningType="Note:"
      >
        When you reset your password, you reset your account. You may lose some
        of your personal information (including history, bookmarks, and
        passwords). That’s because we encrypt your data with your password to
        protect your privacy. You’ll still keep any subscriptions you may have
        and Pocket data will not be affected.
      </WarningMessage>
      <form
        noValidate
        className="flex flex-col gap-4"
        onSubmit={handleSubmit(onSubmit)}
        data-testid="reset-password-form"
      >
        {/* if email is forced, display a read-only email */}
        {/* do not provide input field to modify the email */}
        {forceAuth && prefillEmail && (
          <p
            data-testid="reset-password-force-email"
            className="text-base break-all"
          >
            {prefillEmail}
          </p>
        )}

        {/* if email is not forced, display input field */}
        {!forceAuth && (
          <FtlMsg id="reset-password-password-input" attrs={{ label: true }}>
            <InputText
              type="email"
              label="Email"
              name="email"
              onChange={clearError}
              onFocusCb={onFocus}
              autoFocus
              errorText={errorText}
              className="text-start"
              anchorStart
              autoComplete="off"
              spellCheck={false}
              prefixDataTestId="reset-password"
              inputRef={register}
            />
          </FtlMsg>
        )}

        <FtlMsg id="reset-password-button">
          <button
            data-testid="reset-password-button"
            type="submit"
            className="cta-primary cta-xl"
          >
            Begin reset
          </button>
        </FtlMsg>
      </form>

      <ControlledLinkRememberPassword {...{ control }} />
    </AppLayout>
  );
};

export default ResetPassword;
