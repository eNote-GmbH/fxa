/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import Signin from '.';
import { Meta } from '@storybook/react';
import { Subject } from './mocks';
import { withLocalization } from 'fxa-react/lib/storybooks';
import { Account } from '../../models';
import {
  MOCK_ACCOUNT,
  createAppContext,
  mockAppContext,
  produceComponent,
} from '../../models/mocks';
import { SigninProps } from './interfaces';
import { MozServices } from '../../lib/types';

export default {
  title: 'Pages/Signin',
  component: Signin,
  decorators: [withLocalization],
} as Meta;

type RenderStoryOptions = {
  account?: Account;
};

function renderStory(
  { account }: RenderStoryOptions,
  {
    bannerErrorMessage,
    isPasswordNeeded,
    thirdPartyAuthEnabled,
    serviceName,
  }: Partial<SigninProps> = {},
  storyName?: string
) {
  const story = () =>
    produceComponent(
      <Subject
        {...{
          bannerErrorMessage,
          isPasswordNeeded,
          thirdPartyAuthEnabled,
          serviceName,
        }}
      />,
      {},
      {
        ...mockAppContext({
          ...createAppContext(),
          account,
        }),
      }
    );
  story.storyName = storyName;
  return story();
}

const loggedInAccount = MOCK_ACCOUNT as unknown as Account;

const noAccountLoggedIn = {
  avatar: { id: null, url: null },
} as unknown as Account;

export const Default = () => {
  return renderStory({ account: loggedInAccount });
};

export const NotLoggedIn = () => {
  return renderStory({ account: noAccountLoggedIn });
};

export const WithThirdPartyAuth = () => {
  return renderStory(
    { account: noAccountLoggedIn },
    { isPasswordNeeded: false, thirdPartyAuthEnabled: true }
  );
};

export const WithThirdPartyAuthAndPassword = () => {
  return renderStory(
    { account: noAccountLoggedIn },
    { isPasswordNeeded: true, thirdPartyAuthEnabled: true }
  );
};

export const WithErrorBanner = () => {
  return renderStory(
    { account: noAccountLoggedIn },
    { bannerErrorMessage: 'Uh oh there was an error' }
  );
};

// TODO fix logo in header (does not work)
export const ServiceIsPocket = () => {
  return renderStory(
    { account: loggedInAccount },
    { isPasswordNeeded: false, serviceName: MozServices.Pocket }
  );
};

// TODO : REWRITE STORIES

// TODO: Add in error and success states when the Banner is added in
// const SigninWithProvider = ({
//   email,
//   isPasswordNeeded,
//   serviceName,
// }: SigninProps) => {
//   return (
//     <LocationProvider>
//       <AppLayout>
//         <Signin {...{ email, isPasswordNeeded, serviceName }} />
//       </AppLayout>
//     </LocationProvider>
//   );
// };

// export const PasswordNeeded = () => (
//   <SigninWithProvider email={MOCK_EMAIL} isPasswordNeeded />
// );

// export const PasswordNotNeeded = () => (
//   <SigninWithProvider email={MOCK_EMAIL} isPasswordNeeded={false} />
// );

// export const PasswordNotNeededCustomServiceName = () => (
//   <SigninWithProvider
//     email={MOCK_EMAIL}
//     isPasswordNeeded={false}
//     serviceName={MOCK_SERVICE}
//   />
// );

// export const PasswordNeededCustomServiceName = () => (
//   <SigninWithProvider
//     email={MOCK_EMAIL}
//     isPasswordNeeded={true}
//     serviceName={MOCK_SERVICE}
//   />
// );

// export const IsPocketClient = () => (
//   <SigninWithProvider
//     email={MOCK_EMAIL}
//     isPasswordNeeded={false}
//     serviceName={MozServices.Pocket}
//   />
// );
