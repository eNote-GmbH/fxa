/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React, { useEffect, useState } from 'react';
import { RouteComponentProps, useLocation } from '@reach/router';
import LoadingSpinner from 'fxa-react/components/LoadingSpinner';
import { FtlMsg, hardNavigateToContentServer } from 'fxa-react/lib/utils';
import AppLayout from '../../../components/AppLayout';
import { useValidatedQueryParams } from '../../../lib/hooks/useValidate';
import { CompleteSigninQueryParams } from '../../../models/pages/signin';
import { SigninLinkDamaged } from '../../../components/LinkDamaged';
import { useAuthClient, useFtlMsgResolver } from '../../../models';
import {
  AuthUiErrorNos,
  AuthUiErrors,
  getLocalizedErrorMessage,
} from '../../../lib/auth-errors/auth-errors';
import Banner, { BannerType } from '../../../components/Banner';
import CardHeader from '../../../components/CardHeader';
import LinkExternal from 'fxa-react/components/LinkExternal';

export const viewName = 'complete-signin';

const CompleteSignin = (_: RouteComponentProps) => {
  // TODO - log email link click, but don't need to log page view (there might not really be a page to view?)
  // this.logViewEvent('verification.clicked');

  const { queryParamModel, validationError } = useValidatedQueryParams(
    CompleteSigninQueryParams
  );

  const authClient = useAuthClient();
  const ftlMsgResolver = useFtlMsgResolver();
  const location = useLocation();

  const [error, setError] = useState<string>('');

  useEffect(() => {
    (async () => {
      if (!validationError) {
        const { uid, code } = queryParamModel;

        try {
          await authClient.verifyCode(uid, code);
          reportSuccessAndNavigate();
        } catch (err) {
          // if we have a localized error message
          if (err.errno && AuthUiErrorNos[err.errno]) {
            const localizedErrorMessage = getLocalizedErrorMessage(
              ftlMsgResolver,
              err
            );
            setError(localizedErrorMessage);
          } else {
            const localizedErrorMessage = getLocalizedErrorMessage(
              ftlMsgResolver,
              AuthUiErrors.UNEXPECTED_ERROR
            );
            setError(localizedErrorMessage);
          }
        }
      }
    })();
  });

  const reportSuccessAndNavigate = () => {
    // log metrics 'verification.success';
    // notify 'verification.success';
    // log metrics 'signin.success';

    // We always navigate to connect_another_device because this flow is only for legacy Sync
    // TODO: replace with navigate once ConnectAnotherDevice is converted to React
    hardNavigateToContentServer(`/connect_another_device?${location.search}`);
  };

  if (validationError) {
    return <SigninLinkDamaged />;
  }
  if (error) {
    return (
      <AppLayout>
        <CardHeader
          headingText="Confirmation error"
          headingTextFtlId="complete-signin-error-header"
        />
        <Banner type={BannerType.error} additionalClassNames="-mb-2">
          {error}
        </Banner>
      </AppLayout>
    );
  } else {
    return (
      <AppLayout>
        <FtlMsg id="validating-signin">
          <p className="text-base">Validating sign-in…</p>
        </FtlMsg>
        <LoadingSpinner className="flex justify-center mt-6" />
      </AppLayout>
    );
  }
};

export default CompleteSignin;
