/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { IsEmail, IsHexadecimal, IsNotEmpty, IsString } from 'class-validator';
import { ModelDataProvider, bind } from '../../lib/model-data';

export * from './verification-info';

export type VerificationInfoLinkStatus = 'expired' | 'damaged' | 'valid';

export class VerificationInfo extends ModelDataProvider {
  @IsEmail()
  @bind()
  email: string = '';

  @IsEmail()
  @bind()
  emailToHashWith: string = '';

  // TODO - Validation - Custom IsVerificationCode
  @IsString()
  @IsNotEmpty()
  @bind()
  code: string = '';

  @IsString()
  @IsHexadecimal()
  @bind()
  token: string = '';

  // TODO - Validation - UID validator?
  @IsString()
  @bind()
  uid: string = '';
}
