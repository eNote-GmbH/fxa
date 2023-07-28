/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React, { useEffect, useState } from 'react';
import { RouteComponentProps, Router } from '@reach/router';
import { ScrollToTop } from '../Settings/ScrollToTop';
import { currentAccount, sessionToken } from '../../lib/cache';
import {
  useAccount,
  useConfig,
  useIntegration,
  useInitialSettingsState,
  useAuthClient,
} from '../../models';
import * as Metrics from '../../lib/metrics';
import Storage from '../../lib/storage';

import sentryMetrics from 'fxa-shared/lib/sentry';

import { PageWithLoggedInStatusState } from '../PageWithLoggedInStatusState';
import Settings from '../Settings';
import CannotCreateAccount from '../../pages/CannotCreateAccount';
import Clear from '../../pages/Clear';
import CookiesDisabled from '../../pages/CookiesDisabled';
import ResetPassword from '../../pages/ResetPassword';
import ConfirmResetPassword from '../../pages/ResetPassword/ConfirmResetPassword';

import ResetPasswordWithRecoveryKeyVerified from '../../pages/ResetPassword/ResetPasswordWithRecoveryKeyVerified';
import Legal from '../../pages/Legal';
import LegalTerms from '../../pages/Legal/Terms';
import LegalPrivacy from '../../pages/Legal/Privacy';

import PrimaryEmailVerified from '../../pages/Signup/PrimaryEmailVerified';

import ResetPasswordConfirmed from '../../pages/ResetPassword/ResetPasswordConfirmed';
import AccountRecoveryConfirmKey from '../../pages/ResetPassword/AccountRecoveryConfirmKey';

import SigninConfirmed from '../../pages/Signin/SigninConfirmed';

import SignupConfirmed from '../../pages/Signup/SignupConfirmed';
import ConfirmSignupCode from '../../pages/Signup/ConfirmSignupCode';
import SigninReported from '../../pages/Signin/SigninReported';
// import SigninBounced from '../../pages/Signin/SigninBounced';
import LinkValidator from '../LinkValidator';
import { LinkType } from 'fxa-settings/src/lib/types';
import Confirm from 'fxa-settings/src/pages/Signup/Confirm';
import WebChannelExample from '../../pages/WebChannelExample';
import { CreateCompleteResetPasswordLink } from '../../models/reset-password/verification/factory';
import ThirdPartyAuthCallback from '../../pages/PostVerify/ThirdPartyAuthCallback';
import { searchParams } from '../../lib/utilities';
import { gql } from '@apollo/client';
import {
  SettingsContext,
  initializeSettingsContext,
} from '../../models/contexts/SettingsContext';
import CompleteResetPasswordContainer from '../../pages/ResetPassword/CompleteResetPassword/container';
import AccountRecoveryResetPasswordContainer from '../../pages/ResetPassword/AccountRecoveryResetPassword/container';

interface FlowQueryParams {
  broker?: string;
  context?: string;
  deviceId?: string;
  flowBeginTime?: number;
  flowId?: string;
  isSampledUser?: boolean;
  service?: string;
  uniqueUserId?: string;
}

// TODO: check against `session/status` and if valid, run this.
// Or check against what's returned for invalid token error.
export const INITIAL_METRICS_QUERY = gql`
  query GetInitialMetricsState {
    account {
      recoveryKey
      metricsEnabled
      emails {
        email
        isPrimary
        verified
      }
      totp {
        exists
        verified
      }
    }
  }
`;

// temporary until we can safely direct all users to all routes currently in content-server
interface QueryParams extends FlowQueryParams {
  showReactApp?: string;
  isInRecoveryKeyExperiment?: string;
}

export const App = (_: RouteComponentProps) => {
  const flowQueryParams = searchParams(window.location.search) as QueryParams;
  const { isInRecoveryKeyExperiment } = flowQueryParams;

  // const [isSignedIn, setIsSignedIn] = useState<boolean>();
  // const { loading, error } = useInitialState();
  // const account = useAccount();

  const config = useConfig();

  // const { metricsEnabled } = account;

  // TODO Remove feature flag and experiment logic in FXA-7419
  const showRecoveryKeyV2 = !!(
    config.showRecoveryKeyV2 && isInRecoveryKeyExperiment === 'true'
  );

  // useEffect(() => {
  //   Metrics.init(metricsEnabled || !isSignedIn, flowQueryParams);
  //   if (metricsEnabled) {
  //     Metrics.initUserPreferences(account);
  //   }
  // }, [account, metricsEnabled, isSignedIn, flowQueryParams]);

  // useEffect(() => {
  //   if (!loading && error?.message.includes('Invalid token')) {
  //     setIsSignedIn(false);
  //   } else if (!loading && !error) {
  //     setIsSignedIn(true);
  //   }
  // }, [error, loading]);

  // useEffect(() => {
  //   if (!loading) {
  //     // Previously, when Sentry was just loaded in Settings, we only enabled
  //     // Sentry once we know the user's metrics preferences (and of course,
  //     // only when the user was logged in, since all users in Settings are.)
  //     // Now we enable Sentry for logged out users, and for logged in users
  //     // who opt to have metrics enabled.
  //     // A bit of chicken and egg but it could be possible that we miss some
  //     // errors while the page is loading and user is being fetched.
  //     if (metricsEnabled || !isSignedIn) {
  //       sentryMetrics.configure({
  //         release: config.version,
  //         sentry: {
  //           ...config.sentry,
  //         },
  //       });
  //     } else {
  //       sentryMetrics.disable();
  //     }
  //   }
  // }, [metricsEnabled, config.sentry, config.version, loading, isSignedIn]);

  return (
    <Router basepath="/">
      <AuthAndSetUpRoutes path="/*" />
      <SettingsRoutes path="/settings/*" {...{ showRecoveryKeyV2 }} />
    </Router>
  );
};

const SettingsRoutes = ({
  showRecoveryKeyV2,
}: {
  showRecoveryKeyV2?: boolean;
} & RouteComponentProps) => {
  // TODO some checks here
  const { loading, error } = useInitialSettingsState();
  const account = useAccount();
  const settingsContext = initializeSettingsContext();

  return (
    <SettingsContext.Provider value={settingsContext}>
      <ScrollToTop default>
        <Settings path="/settings/*" {...{ showRecoveryKeyV2 }} />
      </ScrollToTop>
    </SettingsContext.Provider>
  );
};

const AuthAndSetUpRoutes = (_: RouteComponentProps) => {
  const sessionTokenId = sessionToken();
  // const localAccount = currentAccount();

  // temporary until the relier + integration is combined
  const integration = useIntegration();
  console.log('integration', integration);

  return (
    <Router>
      <WebChannelExample path="/web_channel_example/*" />

      <CannotCreateAccount path="/cannot_create_account/*" />
      <Clear path="/clear/*" />
      <CookiesDisabled path="/cookies_disabled/*" />

      <Legal path="/legal/*" />
      <LegalTerms path="/legal/terms/*" />
      <LegalTerms path="/:locale/legal/terms/*" />
      <LegalPrivacy path="/legal/privacy/*" />
      <LegalPrivacy path="/:locale/legal/privacy/*" />

      <ResetPassword path="/reset_password/*" {...{ integration }} />
      <ConfirmResetPassword
        path="/confirm_reset_password/*"
        {...{ integration }}
      />
      <CompleteResetPasswordContainer
        path="/complete_reset_password/*"
        {...{ integration }}
      />

      <LinkValidator
        path="/account_recovery_confirm_key/*"
        linkType={LinkType['reset-password']}
        viewName="account-recovery-confirm-key"
        getParamsFromModel={() => {
          return CreateCompleteResetPasswordLink();
        }}
        {...{ integration }}
      >
        {({ setLinkStatus, params }) => (
          <AccountRecoveryConfirmKey
            {...{
              setLinkStatus,
              params,
            }}
          />
        )}
      </LinkValidator>

      <AccountRecoveryResetPasswordContainer
        path="/account_recovery_reset_password/*"
        {...{ integration }}
      />

      <SigninReported path="/signin_reported/*" />
      {/* <SigninBounced
        {...{ localAccount }}
        path="/signin_bounced/*"
      /> */}
      {/* Pages using the Ready view need to be accessible to logged out viewers,
       * but need to be able to check if the user is logged in or logged out,
       * so they are wrapped in this component.
       */}
      <PageWithLoggedInStatusState
        Page={ResetPasswordConfirmed}
        path="/reset_password_verified/*"
        {...{ integration }}
      />
      <PageWithLoggedInStatusState
        Page={ResetPasswordWithRecoveryKeyVerified}
        path="/reset_password_with_recovery_key_verified/*"
        {...{ integration }}
      />
      <PageWithLoggedInStatusState
        Page={PrimaryEmailVerified}
        path="/primary_email_verified/*"
        {...{ integration }}
      />
      <PageWithLoggedInStatusState
        Page={SignupConfirmed}
        path="/signup_verified/*"
        {...{ integration }}
      />
      <PageWithLoggedInStatusState
        Page={SignupConfirmed}
        path="/signup_confirmed/*"
        {...{ integration }}
      />
      <PageWithLoggedInStatusState
        Page={SigninConfirmed}
        path="/signin_verified/*"
        {...{ integration }}
      />
      <PageWithLoggedInStatusState
        Page={SigninConfirmed}
        path="/signin_confirmed/*"
        {...{ integration }}
      />

      <Confirm path="/confirm/*" {...{ sessionTokenId }} />
      <ConfirmSignupCode path="/confirm_signup_code/*" />

      <ThirdPartyAuthCallback path="/post_verify/third_party_auth/callback/*" />
    </Router>
  );
};

export default App;
