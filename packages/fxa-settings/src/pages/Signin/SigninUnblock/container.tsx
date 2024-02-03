/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { useCallback, useState } from 'react';
import { useMutation } from '@apollo/client';
import { RouteComponentProps, useLocation, useNavigate } from '@reach/router';

import { getCredentials } from 'fxa-auth-client/browser';
import LoadingSpinner from 'fxa-react/components/LoadingSpinner';

import VerificationMethods from '../../../constants/verification-methods';
import {
  AuthUiErrors,
  getLocalizedErrorMessage,
} from '../../../lib/auth-errors/auth-errors';
import { useAuthClient, useFtlMsgResolver } from '../../../models';

// using default signin handlers
import { BEGIN_SIGNIN_MUTATION } from '../gql';
import { BeginSigninResponse } from '../interfaces';

import SigninUnblock from '.';
import {
  BeginSigninWithUnblockCodeHandler,
  ResendUnblockCodeHandler,
  SigninUnblockLocationState,
} from './interfaces';

const SigninUnblockContainer = (_: RouteComponentProps) => {
  const [bannerErrorMessage, setBannerErrorMessage] = useState('');
  const authClient = useAuthClient();
  const ftlMsgResolver = useFtlMsgResolver();

  // is it possible to land on this page from somewhere else than react signin?
  const location = useLocation() as ReturnType<typeof useLocation> & {
    state: SigninUnblockLocationState;
  };
  const { email, password } = location.state;

  const navigate = useNavigate();

  const [beginSignin] = useMutation<BeginSigninResponse>(BEGIN_SIGNIN_MUTATION);

  const signinWithUnblockCode: BeginSigninWithUnblockCodeHandler = async (
    code: string
  ) => {
    setBannerErrorMessage('');
    // TODO in oauth ticket
    // const service = integration.getService();
    const options = {
      verificationMethod: VerificationMethods.EMAIL_OTP,
      unblockCode: code,
    };
    // TODO in oauth ticket
    //   // keys must be true to receive keyFetchToken for oAuth and syncDesktop
    //   keys: isOAuth || isSyncDesktopV3,
    //   service: service !== MozServices.Default ? service : undefined,
    // };
    try {
      const { authPW } = await getCredentials(email, password);
      const { data } = await beginSignin({
        variables: {
          input: {
            email,
            authPW,
            options,
          },
        },
      });

      return { data };
    } catch (error) {
      if (error.errno === AuthUiErrors.INCORRECT_PASSWORD.errno) {
        // if the unblock code was successfull, but previously entered password was invalid, return to sign in to try again
        navigate('/signin');
      } else {
        const localizedErrorMessage = getLocalizedErrorMessage(
          ftlMsgResolver,
          error
        );
        return { errorMessage: localizedErrorMessage };
      }
    }
  };

  const resendUnblockCodeHandler: ResendUnblockCodeHandler = async () => {
    try {
      await authClient.sendUnblockCode(email);
      return { resendSuccess: true };
    } catch (error) {
      const localizedErrorMessage = getLocalizedErrorMessage(
        ftlMsgResolver,
        error
      );
      return { errorMessage: localizedErrorMessage };
    }
  };

  if (!email || !password) {
    navigate('/signin');
    return <LoadingSpinner fullScreen />;
  } else
    return (
      <SigninUnblock
        {...{
          bannerErrorMessage,
          signinWithUnblockCode,
          resendUnblockCodeHandler,
        }}
      />
    );
};

export default SigninUnblockContainer;
