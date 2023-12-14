/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import ThirdPartyAuth from '.';
import AppLayout from '../AppLayout';
import { Meta } from '@storybook/react';
import { Subject } from './mocks';
import { withLocalization } from 'fxa-react/lib/storybooks';
import { MOCK_EMAIL } from '../../pages/mocks';

export default {
  title: 'Components/ThirdPartyAuth',
  component: ThirdPartyAuth,
  decorators: [withLocalization],
} as Meta;

const email = MOCK_EMAIL;
const storeAccountData = () => true;

export const Default = () => {
  return (
    <AppLayout>
      <Subject showSeparator {...{ email, storeAccountData }} />
    </AppLayout>
  );
};

export const NoSeparator = () => {
  return (
    <AppLayout>
      <Subject showSeparator={false} {...{ email, storeAccountData }} />
    </AppLayout>
  );
};
