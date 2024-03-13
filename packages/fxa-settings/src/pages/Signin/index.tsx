/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {
  Link,
  RouteComponentProps,
  useLocation,
  useNavigate,
} from '@reach/router';
import classNames from 'classnames';
import LoadingSpinner from 'fxa-react/components/LoadingSpinner';
import { FtlMsg, hardNavigateToContentServer } from 'fxa-react/lib/utils';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import AppLayout from '../../components/AppLayout';
import Banner, { BannerType } from '../../components/Banner';
import { BrandMessagingPortal } from '../../components/BrandMessaging';
import CardHeader from '../../components/CardHeader';
import InputPassword from '../../components/InputPassword';
import Avatar from '../../components/Settings/Avatar';
import TermsPrivacyAgreement from '../../components/TermsPrivacyAgreement';
import ThirdPartyAuth from '../../components/ThirdPartyAuth';
import { REACT_ENTRYPOINT } from '../../constants';
import {
  AuthUiErrors,
  getLocalizedErrorMessage,
} from '../../lib/auth-errors/auth-errors';
import GleanMetrics from '../../lib/glean';
import { usePageViewEvent } from '../../lib/metrics';
import { StoredAccountData, storeAccountData } from '../../lib/storage-utils';
import { isOAuthIntegration, useFtlMsgResolver } from '../../models';
import {
  isClientMonitor,
  isClientPocket,
} from '../../models/integrations/client-matching';
import { NavigationOptions, SigninFormData, SigninProps } from './interfaces';
import { getNavigationTarget } from './utils';

export const viewName = 'signin';

/* The avatar size must not increase until the tablet breakpoint due to logging into
 * Pocket with FxA and maybe others later: an Apple-controlled modal displays FxA in a
 * web view and we want the "Sign in" button to be displayed above the fold. See FXA-7425 */
const avatarClassNames = 'mx-auto h-24 w-24 tablet:h-40 tablet:w-40';

const Signin = ({
  integration,
  email,
  sessionToken,
  serviceName,
  hasLinkedAccount,
  beginSigninHandler,
  cachedSigninHandler,
  sendUnblockEmailHandler,
  hasPassword,
  avatarData,
  avatarLoading,
  localizedErrorFromLocationState,
}: SigninProps & RouteComponentProps) => {
  usePageViewEvent(viewName, REACT_ENTRYPOINT);
  const location = useLocation();
  const navigate = useNavigate();
  const ftlMsgResolver = useFtlMsgResolver();

  const [localizedBannerMessage, setLocalizedBannerMessage] = useState(
    localizedErrorFromLocationState || ''
  );
  const [passwordTooltipErrorText, setPasswordTooltipErrorText] =
    useState<string>('');
  const [signinLoading, setSigninLoading] = useState<boolean>(false);

  const isOAuth = isOAuthIntegration(integration);
  const isPocketClient = isOAuth && isClientPocket(integration.getService());
  const isMonitorClient = isOAuth && isClientMonitor(integration.getService());
  const hasLinkedAccountAndNoPassword = hasLinkedAccount && !hasPassword;

  // We must use a ref because we may update this value in a callback
  let isPasswordNeededRef = useRef(
    (!sessionToken && hasPassword) ||
      (isOAuth && (integration.wantsKeys() || integration.wantsLogin()))
  );

  const localizedPasswordFormLabel = ftlMsgResolver.getMsg(
    'signin-password-button-label',
    'Password'
  );
  const localizedValidPasswordError = ftlMsgResolver.getMsg(
    'auth-error-1010',
    'Valid password required'
  );

  const { handleSubmit, register } = useForm<SigninFormData>({
    mode: 'onTouched',
    criteriaMode: 'all',
    defaultValues: {
      email,
      password: '',
    },
  });

  useEffect(() => {
    if (!isPasswordNeededRef.current) {
      GleanMetrics.cachedLogin.view();
    } else {
      GleanMetrics.login.view();
    }
  }, [isPasswordNeededRef]);

  const wantsTwoStepAuthentication =
    isOAuth && integration.wantsTwoStepAuthentication();

  const signInWithCachedAccount = useCallback(
    async (sessionToken: hexstring) => {
      setSigninLoading(true);
      GleanMetrics.cachedLogin.submit();

      const { data, error } = await cachedSigninHandler(sessionToken);

      if (data) {
        GleanMetrics.cachedLogin.success();

        const navigationOptions: NavigationOptions = {
          email,
          verified: data.verified,
          verificationMethod: data.verificationMethod,
          verificationReason: data.verificationReason,
          sessionVerified: data.sessionVerified,
          wantsTwoStepAuthentication,
        };

        const { to, state } = getNavigationTarget(navigationOptions);
        state ? navigate(to, { state }) : navigate(to);
      }
      if (error) {
        const localizedErrorMessage = getLocalizedErrorMessage(
          ftlMsgResolver,
          error
        );
        if (error.errno === AuthUiErrors.SESSION_EXPIRED.errno) {
          isPasswordNeededRef.current = true;
        }
        setLocalizedBannerMessage(localizedErrorMessage);
        setSigninLoading(false);
      }
    },
    [
      cachedSigninHandler,
      email,
      ftlMsgResolver,
      navigate,
      setLocalizedBannerMessage,
      wantsTwoStepAuthentication,
    ]
  );

  const signInWithPassword = useCallback(
    async (password: string) => {
      GleanMetrics.login.submit();

      setSigninLoading(true);
      const { data, error } = await beginSigninHandler(email, password);

      if (data) {
        GleanMetrics.login.success();

        const accountData: StoredAccountData = {
          email,
          uid: data.signIn.uid,
          lastLogin: Date.now(),
          sessionToken: data.signIn.sessionToken,
          verified: data.signIn.verified,
          metricsEnabled: data.signIn.metricsEnabled,
        };

        storeAccountData(accountData);

        const navigationOptions: NavigationOptions = {
          email,
          verified: data.signIn.verified,
          verificationMethod: data.signIn.verificationMethod,
          verificationReason: data.signIn.verificationReason,
          wantsTwoStepAuthentication,
        };

        const { to, state } = getNavigationTarget(navigationOptions);
        state ? navigate(to, { state }) : navigate(to);
      }
      if (error) {
        GleanMetrics.login.error({ reason: error.message });
        const { errno } = error;

        const localizedErrorMessage = getLocalizedErrorMessage(
          ftlMsgResolver,
          error
        );

        if (
          errno === AuthUiErrors.PASSWORD_REQUIRED.errno ||
          errno === AuthUiErrors.INCORRECT_PASSWORD.errno
        ) {
          setLocalizedBannerMessage('');
          setPasswordTooltipErrorText(localizedErrorMessage);
        } else {
          switch (errno) {
            case AuthUiErrors.THROTTLED.errno:
            case AuthUiErrors.REQUEST_BLOCKED.errno:
              const { localizedErrorMessage: unblockErrorMessage } =
                await sendUnblockEmailHandler(email);
              if (unblockErrorMessage) {
                // Sending the unblock email could itself be rate limited.
                // If it is, the error should be displayed on this screen
                // and the user shouldn't even have the chance to continue.
                setLocalizedBannerMessage(unblockErrorMessage);
                setSigninLoading(false);
                break;
              }
              // navigate only if sending the unblock code email is successful
              navigate('/signin_unblock', {
                state: {
                  email,
                  password,
                  // TODO: in FXA-9177, remove hasLinkedAccount and hasPassword from state
                  // will be stored in Apollo cache at the container level
                  hasPassword,
                  hasLinkedAccount,
                },
              });
              break;
            case AuthUiErrors.EMAIL_HARD_BOUNCE.errno:
            case AuthUiErrors.EMAIL_SENT_COMPLAINT.errno:
              navigate('/signin_bounced');
              break;
            case AuthUiErrors.TOTP_REQUIRED.errno:
            case AuthUiErrors.INSUFFICIENT_ACR_VALUES.errno:
              navigate('/inline_totp_setup');
              break;
            default:
              setLocalizedBannerMessage(localizedErrorMessage);
              setSigninLoading(false);
              break;
          }
        }
      }
    },
    [
      beginSigninHandler,
      email,
      ftlMsgResolver,
      hasLinkedAccount,
      hasPassword,
      navigate,
      sendUnblockEmailHandler,
      setLocalizedBannerMessage,
      wantsTwoStepAuthentication,
    ]
  );

  const onSubmit = useCallback(
    async ({ password }: { password: string }) => {
      if (isPasswordNeededRef.current && password === '') {
        setPasswordTooltipErrorText(localizedValidPasswordError);
        return;
      }

      !isPasswordNeededRef.current && sessionToken
        ? signInWithCachedAccount(sessionToken)
        : signInWithPassword(password);
    },
    [
      signInWithCachedAccount,
      signInWithPassword,
      isPasswordNeededRef,
      localizedValidPasswordError,
      sessionToken,
    ]
  );

  const hideThirdPartyAuth =
    integration.isSync() && hasLinkedAccount && hasPassword;

  return (
    <AppLayout>
      <BrandMessagingPortal {...{ viewName }} />
      {isPasswordNeededRef.current ? (
        <CardHeader
          headingText="Enter your password"
          headingAndSubheadingFtlId="signin-password-needed-header-2"
        />
      ) : (
        <CardHeader
          headingText="Sign in"
          headingTextFtlId="signin-header"
          subheadingWithDefaultServiceFtlId="signin-subheader-without-logo-default"
          subheadingWithCustomServiceFtlId="signin-subheader-without-logo-with-servicename"
          subheadingWithLogoFtlId="signin-subheader-with-logo"
          {...{ serviceName }}
        />
      )}
      {localizedBannerMessage && (
        <Banner type={BannerType.error}>
          <p>{localizedBannerMessage}</p>
        </Banner>
      )}
      <div className="mt-9">
        {avatarData?.account.avatar ? (
          <Avatar
            className={avatarClassNames}
            avatar={avatarData.account.avatar}
          />
        ) : avatarLoading ? (
          <div
            className={classNames(
              avatarClassNames,
              'flex justify-center items-center'
            )}
          >
            <LoadingSpinner />
          </div>
        ) : (
          // There was an error, so just show default avatar
          <Avatar className={avatarClassNames} />
        )}
        <div className="my-5 text-base break-all">{email}</div>
      </div>
      {!hasLinkedAccountAndNoPassword && (
        <form onSubmit={handleSubmit(onSubmit)}>
          <input type="email" className="hidden" value={email} disabled />

          {isPasswordNeededRef.current && (
            <InputPassword
              name="password"
              anchorPosition="start"
              className="mb-5 text-start"
              label={localizedPasswordFormLabel}
              errorText={passwordTooltipErrorText}
              tooltipPosition="bottom"
              required
              autoFocus
              onChange={() => {
                // clear error tooltip if user types in the field
                if (passwordTooltipErrorText) {
                  setPasswordTooltipErrorText('');
                }
                // if the request errored, loading state must be marked as false to reenable submission on input type
                setSigninLoading(false);
              }}
              inputRef={register()}
            />
          )}
          {/* This non-fulfilled input tricks the browser, when trying to
              sign in with the wrong password, into not showing the doorhanger.
              TODO: this causes problems with react-hook-form, do we even need it?
           */}
          {/* <input className="hidden" required /> */}

          <div className="flex">
            <FtlMsg id="signin-button">
              <button
                className="cta-primary cta-xl"
                type="submit"
                disabled={signinLoading}
              >
                Sign in
              </button>
            </FtlMsg>
          </div>
        </form>
      )}

      {!hideThirdPartyAuth && (
        <ThirdPartyAuth showSeparator={!hasLinkedAccountAndNoPassword} />
      )}

      <TermsPrivacyAgreement {...{ isPocketClient, isMonitorClient }} />

      <div className="flex justify-between mt-5">
        <FtlMsg id="signin-use-a-different-account-link">
          <a
            href="/"
            className="text-sm link-blue"
            onClick={(e) => {
              e.preventDefault();
              const params = new URLSearchParams(location.search);
              // Tell content-server to stay on index and prefill the email
              params.set('prefillEmail', email);
              // Passing back the 'email' param causes various behaviors in
              // content-server since it marks the email as "coming from a RP".
              // Also remove other params that are passed when coming
              // from content-server to Backbone, see Signup container component
              // for more info.
              params.delete('email');
              params.delete('hasLinkedAccount');
              params.delete('hasPassword');
              params.delete('showReactApp');
              hardNavigateToContentServer(`/?${params.toString()}`);
            }}
          >
            Use a different account
          </a>
        </FtlMsg>
        {!hasLinkedAccountAndNoPassword && (
          <FtlMsg id="signin-forgot-password-link">
            <Link
              // TODO, pass params?
              to="/reset_password"
              className="text-sm link-blue"
              onClick={() =>
                !isPasswordNeededRef.current
                  ? GleanMetrics.cachedLogin.forgotPassword()
                  : GleanMetrics.login.forgotPassword()
              }
            >
              Forgot password?
            </Link>
          </FtlMsg>
        )}
      </div>
    </AppLayout>
  );
};

export default Signin;
