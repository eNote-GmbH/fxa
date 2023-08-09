/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import {
  bind,
  KeyTransforms as T,
  ModelDataProvider,
} from '../../lib/model-data';

export class SupplicantInfo extends ModelDataProvider {
  // TODO Validation - Custom Validator - IsAccessType
  @IsOptional()
  @IsString()
  @bind(T.snakeCase)
  accessType: string | undefined;

  // TODO Validation - Custom Validator - IsClientId
  @IsOptional()
  @IsString()
  @bind(T.snakeCase)
  clientId: string | undefined;

  // TODO Validation - Custom Validator - IsCodeChallenge
  @IsOptional()
  @IsString()
  @bind(T.snakeCase)
  codeChallenge: string | undefined;

  // TODO Validation - Custom Validator - isCodeChallengeMethod
  @IsOptional()
  @IsString()
  @bind(T.snakeCase)
  codeChallengeMethod: string | undefined;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @bind()
  scope: string | undefined;

  @IsOptional()
  @IsString()
  @bind(T.snakeCase)
  state: string | undefined;
}
