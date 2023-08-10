/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React, { useCallback } from 'react';
import { RouteComponentProps, Link } from '@reach/router';
import { useForm } from 'react-hook-form';
import { FtlMsg } from 'fxa-react/lib/utils';
import { REACT_ENTRYPOINT } from '../../constants';
import { usePageViewEvent } from '../../lib/metrics';
import { MozServices } from '../../lib/types';
import { viewName } from './container';
import { SigninFormData, SigninProps, SigninSubmitData } from './interfaces';
import AppLayout from '../../components/AppLayout';
import Avatar from '../../components/Settings/Avatar';
import Banner, { BannerType } from '../../components/Banner';
import CardHeader from '../../components/CardHeader';
import InputPassword from '../../components/InputPassword';
import TermsPrivacyAgreement from '../../components/TermsPrivacyAgreement';
import ThirdPartyAuth from '../../components/ThirdPartyAuth';

const Signin = ({
  bannerErrorMessage,
  email,
  isPasswordNeeded,
  thirdPartyAuthEnabled = false,
  serviceName,
  integration,
  finishOAuthFlowHandler,
}: SigninProps & RouteComponentProps) => {
  usePageViewEvent(viewName, REACT_ENTRYPOINT);

  const isPocketClient = serviceName === MozServices.Pocket;

  const { handleSubmit, register, formState } = useForm<SigninFormData>({
    mode: 'onTouched',
    criteriaMode: 'all',
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // TODO These methods should be passed in from the container
  const signInUsingLoggedInAccount = useCallback(() => {
    // TODO handle sign in without password
  }, []);

  const signInWithPassword = useCallback((email: string, password: string) => {
    // TODO: handle signin with password
  }, []);

  const onSubmit = useCallback(
    async ({ email, password }: SigninSubmitData) => {
      try {
        password && isPasswordNeeded
          ? signInWithPassword(email, password)
          : signInUsingLoggedInAccount();
      } catch (e) {
        // handle error
      }
    },
    [signInUsingLoggedInAccount, signInWithPassword, isPasswordNeeded]
  );

  return (
    <AppLayout>
      {/* TODO: Can we simplify these headers?? */}
      {isPasswordNeeded ? (
        <CardHeader
          headingText="Enter your password"
          headingAndSubheadingFtlId="signin-password-needed-header"
        />
      ) : (
        <CardHeader
          headingText="Sign in"
          headingTextFtlId="signin-header"
          subheadingWithDefaultServiceFtlId="signin-subheader-without-logo-default"
          subheadingWithCustomServiceFtlId="signin-subheader-without-logo-with-servicename"
          // TODO fix header with logo - does not load image when localized
          subheadingWithLogoFtlId="signin-subheader-with-logo"
          {...{ serviceName }}
        />
      )}
      {bannerErrorMessage && (
        <Banner type={BannerType.error}>{bannerErrorMessage}</Banner>
      )}
      {/* TODO retrieve profile data for avatar without breaking if not logged in */}
      {/* The avatar size must not increase until the tablet breakpoint due to logging into
       * Pocket with FxA and maybe others later: an Apple-controlled modal displays FxA in a
       * web view and we want the "Sign in" button to be displayed above the fold. See FXA-7425 */}
      <Avatar className="mt-5 mx-auto h-24 w-24 tablet:h-40 tablet:w-40" />
      <form
        noValidate
        onSubmit={handleSubmit(({ email, password }: SigninSubmitData) =>
          onSubmit({
            email,
            password,
          })
        )}
      >
        <input
          name="email"
          type="email"
          className="my-5 text-base break-all w-full text-center"
          value={email}
          disabled
        />

        {isPasswordNeeded && (
          <FtlMsg id="signin-password-input" attrs={{ label: true }}>
            <InputPassword
              name="password"
              anchorPosition="start"
              className="mb-5 text-start"
              label="Password"
              tooltipPosition="bottom"
              required
              autoFocus
              inputRef={register}
            />
          </FtlMsg>
        )}
        {/* This non-fulfilled input tricks the browser, when trying to
              sign in with the wrong password, into not showing the doorhanger.
           */}
        <input className="hidden" required />

        <div className="flex">
          <FtlMsg id="signin-button">
            <button
              className="cta-primary cta-xl"
              type="submit"
              disabled={!formState.errors}
            >
              Sign in
            </button>
          </FtlMsg>
        </div>
      </form>

      {/* TODO: Handle logic for showing/enabling third party auth form
      We will need to pull the enabled flag from feature flags or experiment data
       */}
      <ThirdPartyAuth {...{ enabled: thirdPartyAuthEnabled }} />

      <TermsPrivacyAgreement {...{ isPocketClient }} />

      <div className="flex justify-between">
        <FtlMsg id="signin-use-a-different-account">
          <Link to="/" className="text-sm link-blue">
            Use a different account
          </Link>
        </FtlMsg>
        <FtlMsg id="signin-forgot-password">
          <Link to="/reset_password" className="text-sm link-blue">
            Forgot password?
          </Link>
        </FtlMsg>
      </div>
    </AppLayout>
  );
};

export default Signin;
