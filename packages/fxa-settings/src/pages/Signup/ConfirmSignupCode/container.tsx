/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import { RouteComponentProps, useLocation } from '@reach/router';
import { currentAccount } from '../../../lib/cache';
import { useFinishOAuthFlowHandler } from '../../../lib/oauth/hooks';
import {
  Integration,
  isOAuthIntegration,
  useAuthClient,
} from '../../../models';
import AppLayout from '../../../components/AppLayout';
import CardHeader from '../../../components/CardHeader';
import ConfirmSignupCode from '.';
import { hardNavigateToContentServer } from 'fxa-react/lib/utils';
import LoadingSpinner from 'fxa-react/components/LoadingSpinner';
import { GetSessionStatusResponse, LocationState } from './interfaces';
import sentryMetrics from 'fxa-shared/lib/sentry';
import { GET_SESSION_STATUS } from './gql';
import { useQuery } from '@apollo/client';
import { AuthUiErrors } from '../../../lib/auth-errors/auth-errors';
import { StoredAccountData } from '../../../lib/storage-utils';
const SignupConfirmCodeContainer = ({
  integration,
}: {
  integration: Integration;
} & RouteComponentProps) => {
  const authClient = useAuthClient();
  const location = useLocation() as ReturnType<typeof useLocation> & {
    state: LocationState;
  };
  const {
    selectedNewsletterSlugs: newsletterSlugs,
    keyFetchToken,
    unwrapBKey,
  } = location.state || {};

  const storedLocalAccount: StoredAccountData | undefined = currentAccount();

  const params = new URLSearchParams(location.search);
  const { finishOAuthFlowHandler, oAuthDataError } = useFinishOAuthFlowHandler(
    authClient,
    integration
  );

  const navigateToSignin = (hasBounced?: boolean) => {
    // Passing back the 'email' param causes various behaviors in
    // content-server since it marks the email as "coming from a RP".
    // Also remove `emailFromContent` since we pass that when coming
    // from content-server to Backbone, see Signup container component
    // for more info.
    params.delete('emailFromContent');
    params.delete('email');
    hasBounced && params.set('has_bounced', 'true');
    hardNavigateToContentServer(`/?${params.toString()}`);
  };

  // TODO ***** replace with emailBounceStatus query poll ****

  // Poll for session verification errors
  const { error: sessionStatusError } = useQuery<GetSessionStatusResponse>(
    GET_SESSION_STATUS,
    {
      pollInterval: 2000,
    }
  );

  if (sessionStatusError) {
    if (sessionStatusError.message === AuthUiErrors.INVALID_TOKEN.message) {
      // Something has tripped an invalid token error. Note, there are quite a
      // few ways this can happen. One of which is cross contamination due
      // to interactions on other tabs. This error state is a bit nebulous,
      // so let's redirect the user to the main sign in, as it indicates that
      // something invalidated local storage or perhaps their session token has
      // expired and a polling operation picked up on this. Either way, the user
      // is likely in the middle of login flow on another tab, or the tab has been
      // idle for quite some time. See #13806
      navigateToSignin();
      return <LoadingSpinner fullScreen />;
    } else if ('hello') {
      // If the uid is not associated with an account,
      // the user's email may have bounced because it was invalid.
      // If arriving from signup, redirect them to the email first page.
      // Adding the 'hasBounced' param will display an error message on '/'
      const hasBounced = true;
      navigateToSignin(hasBounced);
      return <LoadingSpinner fullScreen />;

      // TODO in FXA-6488: if this page is instead reached from signin,
      // redirect to signin_bounced for support info
    } else if (
      sessionStatusError.message ===
      (AuthUiErrors.UNEXPECTED_ERROR.message ||
        AuthUiErrors.BACKEND_SERVICE_FAILURE.message)
    ) {
      // Hide the error from the user if it is an unexpected error.
      // an error may happen here if the status api is overloaded or
      // if the user is switching networks.
    } else {
      // TODO display localized error message in banner
    }
  }

  // TODO: UX for this, FXA-8106
  if (oAuthDataError) {
    return (
      <AppLayout>
        <CardHeader
          headingText="Unexpected error"
          headingTextFtlId="auth-error-999"
        />
      </AppLayout>
    );
  }

  // Users in this state should never reach this as they should see the Backbone version
  // of this page until we convert signin to React, but guard against anyway. See
  // comment in `router.js` for this route for more info.
  if (isOAuthIntegration(integration) && (!keyFetchToken || !unwrapBKey)) {
    // Report an error to Sentry on the off-chance that this React page is reached without required state
    sentryMetrics.captureException(
      new Error(
        'WARNING: User should not have reached ConfirmSignupCode in React without required state for OAuth integration. Redirecting to Backbone signin page.'
      )
    );
    navigateToSignin();
    return <LoadingSpinner fullScreen />;
  }

  /* Users who reach this page should have account data set in localStorage.
   * Account data is persisted local storage after creating an (unverified) account
   * and after sign in. Users may also have localStorage set by the browser if
   * they are logged in.

   * The session token from local storage is required to verify the signup code.
   * If this page is reached without an account in localStorage (e.g., directly from
   * URL), redirect to `/`.

   * TOOD: when we pull the account.verifySession call into the container component,
   * ensure we're only reading from localStorage once. `sessionToken()` also reads from
   * localStorage. */

  if (!integration || !storedLocalAccount) {
    navigateToSignin();
    return <LoadingSpinner fullScreen />;
  }

  const { email, sessionToken } = storedLocalAccount;
  return (
    <ConfirmSignupCode
      {...{
        email,
        sessionToken,
        integration,
        finishOAuthFlowHandler,
        newsletterSlugs,
        keyFetchToken,
        unwrapBKey,
      }}
    />
  );
};

export default SignupConfirmCodeContainer;
