/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import react from 'react';
import { RouteComponentProps, useNavigate } from '@reach/router';
import { useValidatedQueryParams } from '../../../lib/hooks/useValidate';
import { useAccount } from '../../../models';
import { SigninQueryParams } from '../../../models/pages/signin';
import { SigninTotpCode } from './index';
import { gql, useMutation } from '@apollo/client';
import GleanMetrics from '../../../lib/glean';
import { logViewEvent } from '../../../lib/metrics';
import { hardNavigate } from 'fxa-react/lib/utils';
import { AuthUiErrors } from '../../../lib/auth-errors/auth-errors';
import { currentAccount } from '../../../lib/cache';

export const viewName = 'signin-totp-code';

export const SignInTotpCodeContainer = (_: RouteComponentProps) => {
  const navigate = useNavigate();
  const storedLocalAccount = currentAccount();
  const { queryParamModel } = useValidatedQueryParams(SigninQueryParams);
  const [verifyTotpCode] = useMutation(gql`
    mutation VerifyTotpCode($input: VerifyTotpInput!) {
      verifyTotpCode($input) {
        success
      }
    }
  `);

  const submitCode = async (code: string) => {
    try {
      const result = await verifyTotpCode({
        variables: {
          input: {
            code,
            service: queryParamModel.service,
          },
        },
      });

      console.log('!!! totp verify result', result);
      GleanMetrics.loginConfirmation.submit();

      // Check authentication code
      if (result.data?.verifyTotp.success === true) {
        logViewEvent('flow', `${viewName}.submit`);

        // Note: `redirectTo` looks similar to `redirectPathname`, but they
        // work slightly differently: `redirectTo` redirects automatically,
        // while `redirectPathname` redirects after a form submission.
        if (queryParamModel.redirectToUrl) {
          hardNavigate(queryParamModel.redirectToUrl);
        } else if (queryParamModel.redirectPathname) {
          navigate(queryParamModel.redirectPathname);
        }
        // TBD -- How do we get this? It seems like the auth client used to fill it...
        else if (queryParamModel.verificationReason === 'change_password') {
          navigate('/post_verify/password/force_password_change');
        }
        return true;
      } else {
        return false;
      }
    } catch (error) {
      if (error.errno) {
        return error.errno;
      }
      return AuthUiErrors.UNEXPECTED_ERROR;
    }
  };

  // TODO: redirect to force_auth or signin if user has not initiated sign in
  if (!storedLocalAccount || !account?.totpActive) {
    console.log('!!! no account or totp going back to start');
    hardNavigate('/');
  }

  return <SigninTotpCode {...{ submitCode, account }} />;
};

export default ReportSigninContainer;
