/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { ReactElement, useEffect, useState } from 'react';
import { RouteComponentProps } from '@reach/router';
import { Integration, useAuthClient } from '../../models';
import { useFinishOAuthFlowHandler } from '../../lib/oauth/hooks';
import Signin from '.';
import { MozServices } from '../../lib/types';
import { GET_BASIC_ACCOUNT } from './gql';
import { useLazyQuery } from '@apollo/client';
import LoadingSpinner from 'fxa-react/components/LoadingSpinner';
import { BasicAccountData } from './interfaces';

export const viewName = 'signin';

const SigninContainer = ({
  // TODO figure out why getting the email from localStorage isn't working
  email = 'dummy@gmail.com',
  integration,
}: {
  email?: string;
  integration: Integration;
} & RouteComponentProps) => {
  const authClient = useAuthClient();
  // TODO verify whatthis does and if this is needed
  const { finishOAuthFlowHandler, oAuthDataError } = useFinishOAuthFlowHandler(
    authClient,
    integration
  );
  // Temporary values
  const serviceName = MozServices.Default;
  const [accountData, setAccountData] = useState<BasicAccountData>();
  const [bannerErrorMessage, setBannerErrorMessage] = useState<
    string | ReactElement
  >('');

  // Retrieve account data from logged in account (if any)
  // This provides is with the logged in account's email, avatar, passwordCreated, linkedAccount, metricsEnabled
  const [getBasicAccount, { data: basicAccount }] =
    useLazyQuery(GET_BASIC_ACCOUNT);

  useEffect(() => {
    !basicAccount && getBasicAccount();
    basicAccount && setAccountData(basicAccount);
  }, [getBasicAccount, basicAccount]);

  // TODO: Handle oAuthDataError in FXA-8106
  oAuthDataError && console.log(oAuthDataError);

  // From Lauren:
  // We’ll have to manually update the cache for auth-client API calls similar to what we’re doing now in Account.
  // Using GQL it automatically updates. So say you query a few different fields in GQL on one page -
  // when you query those same fields on another page, it first checks the cache and uses that data instead,
  // unless you have network-only or whatever that option is, in which case it always fetches fresh data.

  // I don’t think we can automatically read from the cache using auth-client, but we might be able to check
  // the cache first and perform the call if the data doesn’t exist and then store it in the cache

  // **NOTES FROM CONTENT_SERVER**
  // TODO Redirect to '/' if there is no account and/or no account email

  // TODO If a previously authenticated account was found locally and it had opted
  // out of data collection
  //   if (account && account.get('metricsEnabled') === false) {
  //     GleanMetrics.setEnabled(false);
  //   }

  // We need an explicit call here in case a user directly navigates to
  // /signin or they're redirected, e.g. when directly accessing settings.
  // However, we don't want to call this if the previous enter email screen
  // already called this, verified the account exists, and set the third party
  // auth data because of rate limiting on the POST account/status endpoint.
  // We can't use account/status GET since we don't always have the uid.
  //     if (
  //       account &&
  //       (account.get('hasLinkedAccount') === undefined ||
  //         account.get('hasPassword') === undefined)
  //     ) {
  //       return account.checkAccountStatus().catch(() => {
  // Unlikely, but if this errors, it's probably due to rate limiting,
  // see note above. Regardless, don't block the user from proceeding
  // because this check failed, and assume they have a password set
  // (since most users do) via defaults set in setInitialContext.
  // See https://github.com/mozilla/fxa/pull/15456#discussion_r1237799514
  //       });
  //     }
  //   },

  //   logView() {
  //     GleanMetrics.login.view();
  //     return FormView.prototype.logView.call(this);
  //   },

  //   setInitialContext(context) {
  //     const account = this.getAccount();
  //     const hasLinkedAccount = account.get('hasLinkedAccount') ?? false;
  //     const hasPassword = account.get('hasPassword') ?? true;

  //     context.set({
  //       email: account.get('email'),
  //       isPasswordNeeded: this.isPasswordNeededForAccount(account) && hasPassword,
  //       hasLinkedAccountAndNoPassword: hasLinkedAccount && !hasPassword,
  //       unsafeThirdPartyAuthHTML: this.renderTemplate(ThirdPartyAuth, {
  //         isSignup: false,
  //       }),
  //     });
  //   },

  //   submit() {
  //     const account = this.getAccount();
  //     if (this.isPasswordNeededForAccount(account)) {
  //       const password = this.getElementValue('input[type=password]');
  //       GleanMetrics.login.submit();
  //       return this.signIn(account, password).catch((error) =>
  //         this.onSignInError(account, password, error)
  //       );
  //     } else {
  //       return this.useLoggedInAccount(account);
  //     }
  //   },

  //   onSignInError(account, password, err) {
  //     if (AuthErrors.is(err, 'USER_CANCELED_LOGIN')) {
  //       this.logViewEvent('canceled');
  //       // if user canceled login, just stop
  //       return;
  //     } else if (AuthErrors.is(err, 'ACCOUNT_RESET')) {
  //       return this.notifyOfResetAccount(account);
  //     } else if (AuthErrors.is(err, 'INCORRECT_PASSWORD')) {
  //       return this.showValidationError(this.$('input[type=password]'), err);
  //     } else if (AuthErrors.is(err, 'UNABLE_TO_LOGIN_NO_PASSWORD_SET')) {
  //       return this.unsafeDisplayError(err);
  //     }

  //     // re-throw error, it will be handled at a lower level.
  //     throw err;
  //   },
  // });

  // Cocktail.mixin(
  //   SignInPasswordView,
  //   AccountResetMixin,
  //   CachedCredentialsMixin,
  //   FlowEventsMixin,
  //   FormPrefillMixin,
  //   PasswordMixin,
  //   ServiceMixin,
  //   SignInMixin,
  //   SignedInNotificationMixin,
  //   ThirdPartyAuthMixin,
  //   UserCardMixin,
  //   PocketMigrationMixin
  // );

  if (!email && !accountData) {
    return <LoadingSpinner />;
  }

  return (
    <Signin
      email={accountData?.account.primaryEmail.email || email}
      avatar={accountData?.account.avatar}
      isPasswordNeeded={!!accountData ? false : true}
      {...{
        bannerErrorMessage,
        serviceName,
        integration,
        finishOAuthFlowHandler,
      }}
    />
  );
};

export default SigninContainer;
