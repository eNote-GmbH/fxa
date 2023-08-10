/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import classNames from 'classnames';
import defaultAvatar from './avatar-default.svg';
import { FtlMsg } from 'fxa-react/lib/utils';

export type AvatarProps = {
  avatar?: { id: string | null; url: string | null; isDefault?: boolean };
  className?: string;
};

export const Avatar = ({ avatar, className }: AvatarProps) => {
  if (avatar && avatar.url) {
    return (
      <FtlMsg id="avatar-your-avatar" attrs={{ alt: true }}>
        <img
          data-testid="avatar-nondefault"
          src={avatar.url}
          alt="Your avatar"
          className={classNames('rounded-full bg-white', className)}
        />
      </FtlMsg>
    );
  }

  return (
    // whatever webkit version firefox on ios 13 uses
    // has a bug that makes the image disappear in some case
    // with inline svgs. img elements don't have this problem.
    // see: https://github.com/mozilla/fxa/issues/6359
    <FtlMsg id="avatar-default-avatar" attrs={{ alt: true }}>
      <img
        data-testid="avatar-default"
        src={defaultAvatar}
        alt="Default avatar"
        className={classNames('rounded-full', className)}
      />
    </FtlMsg>
  );
};

export default Avatar;
