/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React, { useCallback, useState } from 'react';
import { RouteComponentProps, useLocation, useNavigate } from '@reach/router';
import { REACT_ENTRYPOINT } from '../../../constants';
import { usePageViewEvent, logViewEvent } from '../../../lib/metrics';
import { ResendStatus } from '../../../lib/types';
import {
  isOAuthIntegration,
  useAccount,
  useFtlMsgResolver,
} from '../../../models';
import AppLayout from '../../../components/AppLayout';
import ConfirmWithLink, {
  ConfirmWithLinkPageStrings,
} from '../../../components/ConfirmWithLink';
import LinkRememberPassword from '../../../components/LinkRememberPassword';
import {
  ConfirmResetPasswordIntegration,
  ConfirmResetPasswordLocationState,
} from './interfaces';
import { getLocalizedErrorMessage } from '../../../lib/auth-errors/auth-errors';

export const viewName = 'confirm-reset-password';

const ConfirmResetPassword = ({
  integration,
}: {
  integration: ConfirmResetPasswordIntegration;
} & RouteComponentProps) => {
  usePageViewEvent(viewName, REACT_ENTRYPOINT);
  const ftlMsgResolver = useFtlMsgResolver();

  const navigate = useNavigate();
  let { state } = useLocation();

  if (!state) {
    state = {};
  }

  const { email, passwordForgotToken } =
    state as ConfirmResetPasswordLocationState;

  const account = useAccount();
  const [resendStatus, setResendStatus] = useState<ResendStatus>(
    ResendStatus['not sent']
  );
  const [errorMessage, setErrorMessage] = useState<string>();

  const navigateToPasswordReset = useCallback(() => {
    navigate('reset_password?showReactApp=true', { replace: true });
  }, [navigate]);

  if (!email || !passwordForgotToken) {
    navigateToPasswordReset();
  }

  const resendEmailHandler = async () => {
    try {
      if (isOAuthIntegration(integration)) {
        await account.resetPassword(
          email,
          integration.getService(),
          integration.getRedirectUri()
        );
      } else {
        await account.resetPassword(email);
      }

      setResendStatus(ResendStatus['sent']);
      logViewEvent(viewName, 'resend', REACT_ENTRYPOINT);
    } catch (err) {
      const localizedErrorMessage = getLocalizedErrorMessage(
        ftlMsgResolver,
        err
      );
      setResendStatus(ResendStatus.error);
      setErrorMessage(localizedErrorMessage);
    }
  };

  const confirmResetPasswordStrings: ConfirmWithLinkPageStrings = {
    headingFtlId: 'confirm-pw-reset-header',
    headingText: 'Reset email sent',
    instructionFtlId: 'confirm-pw-reset-instructions',
    instructionText: `Click the link emailed to ${email} within the next hour to create a new password.`,
  };

  return (
    <AppLayout>
      <ConfirmWithLink
        {...{ email, resendEmailHandler, resendStatus, errorMessage }}
        confirmWithLinkPageStrings={confirmResetPasswordStrings}
      />
      <LinkRememberPassword {...{ email }} />
    </AppLayout>
  );
};

export default ConfirmResetPassword;
