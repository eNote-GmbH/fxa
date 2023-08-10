/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import Avatar, { AvatarProps } from '.';
import { MOCK_AVATAR_DEFAULT, MOCK_AVATAR_NON_DEFAULT } from './mocks';
import { Meta } from '@storybook/react';
import { withLocalization } from 'fxa-react/lib/storybooks';

export default {
  title: 'Components/Settings/Avatar',
  component: Avatar,
  decorators: [withLocalization],
} as Meta;

const storyWithProps = (
  { avatar }: Partial<AvatarProps>,
  storyName?: string
) => {
  const story = () => <Avatar className="w-32 h-32" {...{ avatar }} />;
  if (storyName) story.storyName = storyName;
  return story;
};

export const DefaultAvatar = storyWithProps({ avatar: MOCK_AVATAR_DEFAULT });

export const NonDefaultAvatar = storyWithProps({
  avatar: MOCK_AVATAR_NON_DEFAULT,
});
