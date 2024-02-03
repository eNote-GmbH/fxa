/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import SigninUnblock from '.';
import { LocationProvider } from '@reach/router';
import { Meta } from '@storybook/react';
import { withLocalization } from 'fxa-react/lib/storybooks';

export default {
  title: 'Pages/Signin/SigninUnblock',
  component: SigninUnblock,
  decorators: [withLocalization],
} as Meta;

const mockSuccessResponse = () => {
  alert('Success!');
};

export const Default = () => (
  <LocationProvider>
    <SigninUnblock
      signinWithUnblockCode={mockSuccessResponse}
      resendUnblockCodeHandler={mockSuccessResponse}
    />
  </LocationProvider>
);
