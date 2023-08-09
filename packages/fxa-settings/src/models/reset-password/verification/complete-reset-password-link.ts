/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { IsHexadecimal, IsNotEmpty, IsString } from 'class-validator';
import { bind, ModelDataProvider } from '../../../lib/model-data';

export class CompleteResetPasswordLink extends ModelDataProvider {
  // TODO: change `isNonEmptyString` to `email` when validation is properly set up.
  // This is temporary for tests/Storybook so that `email=''` shows a damaged link
  @IsString()
  @IsNotEmpty()
  @bind()
  email: string = '';

  // TODO: add @bind `isEmail` when validation is properly set up.
  // This should be _optional_ but when this exists it should be an email.
  emailToHashWith: string = '';

  @IsString()
  @IsNotEmpty()
  @bind()
  code: string = '';

  @IsString()
  @IsHexadecimal()
  @bind()
  token: string = '';

  @IsString()
  @IsHexadecimal()
  @bind()
  uid: string = '';
}
