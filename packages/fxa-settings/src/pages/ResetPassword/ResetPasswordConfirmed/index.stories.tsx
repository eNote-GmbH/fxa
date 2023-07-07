/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import ResetPasswordConfirmed, { ResetPasswordConfirmedProps } from '.';
import { MozServices } from '../../../lib/types';
import { Meta } from '@storybook/react';
import { withLocalization } from '../../../../.storybook/decorators';
import { renderStoryWithHistory } from '../../../lib/storybook-utils';

export default {
  title: 'Pages/ResetPassword/ResetPasswordConfirmed',
  component: ResetPasswordConfirmed,
  decorators: [withLocalization],
} as Meta;

function renderStory(
  props: ResetPasswordConfirmedProps,

  queryParams: string
) {
  return renderStoryWithHistory(
    <ResetPasswordConfirmed {...props} />,
    '/reset_password_verified',
    undefined,
    queryParams
  );
}

export const DefaultSignedIn = () => renderStory({ isSignedIn: true }, ``);

export const DefaultIsSync = () =>
  renderStory({ isSignedIn: true }, 'service=sync');

export const DefaultSignedOut = () =>
  renderStory({ isSignedIn: false }, 'service=');

export const WithRelyingPartyNoContinueAction = () =>
  renderStory({ isSignedIn: true }, `service=${MozServices.MozillaVPN}`);

export const WithRelyingPartyAndContinueAction = () =>
  renderStory(
    {
      isSignedIn: true,
      continueHandler: () => {
        console.log('Arbitrary action');
      },
    },
    `service=`
  );
