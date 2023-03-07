/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import { Meta } from '@storybook/react';
import LinkExpired from '.';
import { withLocalization } from '../../../.storybook/decorators';

export default {
  title: 'Components/LinkExpired',
  component: LinkExpired,
  decorators: [withLocalization],
} as Meta;

export const ResetPasswordLinkExpired = () => (
  <LinkExpired linkType="reset-password" />
);

export const SigninLinkExpired = () => <LinkExpired linkType="signin" />;