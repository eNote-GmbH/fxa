/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React, { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { RouteComponentProps, Router, useLocation } from '@reach/router';
import { ScrollToTop } from '../Settings/ScrollToTop';
import LoadingSpinner from 'fxa-react/components/LoadingSpinner';

import { currentAccount, sessionToken } from '../../lib/cache';
import {
  useConfig,
  useInitialMetricsQueryState,
  useIntegration,
  useLocalSignedInQueryState,
} from '../../models';
import * as Metrics from '../../lib/metrics';

import sentryMetrics from 'fxa-shared/lib/sentry';
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

import ConfirmSignupCodeContainer from '../../pages/Signup/ConfirmSignupCode/container';
import SignupConfirmed from '../../pages/Signup/SignupConfirmed';

import SigninConfirmed from '../../pages/Signin/SigninConfirmed';
import SigninReported from '../../pages/Signin/SigninReported';
import SigninBounced from '../../pages/Signin/SigninBounced';
import LinkValidator from '../LinkValidator';
import { LinkType, MozServices } from 'fxa-settings/src/lib/types';
import Confirm from 'fxa-settings/src/pages/Signup/Confirm';
import WebChannelExample from '../../pages/WebChannelExample';
import { CreateCompleteResetPasswordLink } from '../../models/reset-password/verification/factory';
import ThirdPartyAuthCallback from '../../pages/PostVerify/ThirdPartyAuthCallback';
import {
  SettingsContext,
  initializeSettingsContext,
} from '../../models/contexts/SettingsContext';
import CompleteResetPasswordContainer from '../../pages/ResetPassword/CompleteResetPassword/container';
import AccountRecoveryResetPasswordContainer from '../../pages/ResetPassword/AccountRecoveryResetPassword/container';
import { QueryParams } from '../..';
import SignupContainer from '../../pages/Signup/container';
import GleanMetrics from '../../lib/glean';
import { hardNavigateToContentServer } from 'fxa-react/lib/utils';

const Settings = lazy(() => import('../Settings'));

// TODO: FXA-8305, DRY this up in the codebase
const fullPageLoadingSpinner = (
  <LoadingSpinner className="bg-grey-20 flex items-center flex-col justify-center h-screen select-none" />
);

export const App = ({
  flowQueryParams,
}: { flowQueryParams: QueryParams } & RouteComponentProps) => {
  const config = useConfig();
  const integration = useIntegration();

  const { loading, data } = useInitialMetricsQueryState();
  // Because this query depends on the result of an initial query (in this case,
  // metrics), we need to run it separately.
  const { data: isSignedInData } = useLocalSignedInQueryState();

  const isSignedIn = isSignedInData?.isSignedIn;

  useMemo(() => {
    GleanMetrics.initialize(
      {
        ...config.glean,
        enabled: data?.metricsEnabled || !isSignedIn,
        appDisplayVersion: config.version,
        channel: config.glean.channel,
      },
      {
        flowQueryParams,
        account: { metricsEnabled: data?.metricsEnabled, uid: data?.uid },
        userAgent: navigator.userAgent,
        integration,
      }
    );
  }, [
    config.glean,
    config.version,
    data?.metricsEnabled,
    data?.uid,
    isSignedIn,
    flowQueryParams,
    integration,
  ]);

  useEffect(() => {
    Metrics.init(data?.metricsEnabled || !isSignedIn, flowQueryParams);
    if (data?.metricsEnabled) {
      Metrics.initUserPreferences({
        recoveryKey: data.recoveryKey,
        hasSecondaryVerifiedEmail:
          data.emails.length > 1 && data.emails[1].verified,
        totpActive: data.totp.exists && data.totp.verified,
      });
    }
  }, [
    data?.metricsEnabled,
    data?.emails,
    data?.totp,
    data?.recoveryKey,
    isSignedIn,
    flowQueryParams,
    config,
  ]);

  useEffect(() => {
    if (!loading) {
      // Previously, when Sentry was just loaded in Settings, we only enabled
      // Sentry once we know the user's metrics preferences (and of course,
      // only when the user was logged in, since all users in Settings are.)
      // Now we enable Sentry for logged out users, and for logged in users
      // who opt to have metrics enabled.
      // A bit of chicken and egg but it could be possible that we miss some
      // errors while the page is loading and user is being fetched.
      if (data?.metricsEnabled || !isSignedIn) {
        sentryMetrics.configure({
          release: config.version,
          sentry: {
            ...config.sentry,
          },
        });
      } else {
        sentryMetrics.disable();
      }
    }
  }, [
    data?.metricsEnabled,
    config.sentry,
    config.version,
    loading,
    isSignedIn,
  ]);

  if (loading || isSignedIn === undefined) {
    return fullPageLoadingSpinner;
  }

  // TODO: Do we like passing `isSignedIn` here, or query in page components instead?
  // If we want to query in the Settings for example, we can after FXA-8286 (first
  // container component test coverage) and we follow the pattern set for tests.
  // Can be looked at in FXA-7626 or FXA-7184
  return (
    <Router basepath="/">
      <AuthAndAccountSetupRoutes {...{ isSignedIn }} path="/*" />
      <SettingsRoutes {...{ isSignedIn }} path="/settings/*" />
    </Router>
  );
};

const SettingsRoutes = ({
  isSignedIn,
}: { isSignedIn: boolean } & RouteComponentProps) => {
  const location = useLocation();
  if (isSignedIn === false) {
    hardNavigateToContentServer(
      `/signin?redirect_to=${encodeURIComponent(location.pathname)}`
    );
    return fullPageLoadingSpinner;
  }

  const settingsContext = initializeSettingsContext();
  return (
    <SettingsContext.Provider value={settingsContext}>
      <ScrollToTop default>
        <Suspense fallback={fullPageLoadingSpinner}>
          <Settings path="/settings/*" {...{ isSignedIn }} />
        </Suspense>
      </ScrollToTop>
    </SettingsContext.Provider>
  );
};

const AuthAndAccountSetupRoutes = ({
  isSignedIn,
}: { isSignedIn: boolean } & RouteComponentProps) => {
  const sessionTokenId = sessionToken();
  const localAccount = currentAccount();
  const integration = useIntegration();

  // TODO: remove async requirements from relier, FXA-6836
  // The approach here may change or we'll want to update other components to receive
  // `serviceName` from this instead of calling integration.getServiceName() within pages
  const [serviceName, setServiceName] = useState<MozServices>();
  useEffect(() => {
    (async () => {
      // TODO: MozServices / string discrepancy, FXA-6802
      setServiceName((await integration.getServiceName()) as MozServices);
    })();
  });

  if (serviceName === undefined) {
    return (
      <LoadingSpinner className="bg-grey-20 flex items-center flex-col justify-center h-screen select-none" />
    );
  }

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
        createLinkModel={() => {
          return CreateCompleteResetPasswordLink();
        }}
        {...{ integration }}
      >
        {({ setLinkStatus, linkModel }) => (
          <AccountRecoveryConfirmKey
            {...{
              setLinkStatus,
              linkModel,
              integration,
            }}
          />
        )}
      </LinkValidator>

      <AccountRecoveryResetPasswordContainer
        path="/account_recovery_reset_password/*"
        {...{ integration }}
      />

      <SigninReported path="/signin_reported/*" />
      <SigninBounced email={localAccount?.email} path="/signin_bounced/*" />

      <ResetPasswordConfirmed
        path="/reset_password_verified/*"
        {...{ isSignedIn, serviceName }}
      />

      <ResetPasswordWithRecoveryKeyVerified
        path="/reset_password_with_recovery_key_verified/*"
        {...{ integration, isSignedIn }}
      />

      <PrimaryEmailVerified
        path="/primary_email_verified/*"
        {...{ isSignedIn, serviceName }}
      />

      <SignupConfirmed
        path="/signup_verified/*"
        {...{ isSignedIn, serviceName }}
      />
      <SignupConfirmed
        path="/signup_confirmed/*"
        {...{ isSignedIn, serviceName }}
      />

      <SigninConfirmed
        path="/signin_verified/*"
        {...{ isSignedIn, serviceName }}
      />
      <SigninConfirmed
        path="/signin_confirmed/*"
        {...{ isSignedIn, serviceName }}
      />

      <SignupContainer path="/signup/*" {...{ integration, serviceName }} />
      <SignupContainer
        path="/oauth/signup/*"
        {...{ integration, serviceName }}
      />

      <Confirm path="/confirm/*" {...{ sessionTokenId }} />
      <ConfirmSignupCodeContainer
        path="/confirm_signup_code/*"
        {...{ integration }}
      />

      <ThirdPartyAuthCallback path="/post_verify/third_party_auth/callback/*" />
    </Router>
  );
};

export default App;
