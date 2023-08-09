/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {
  IsBoolean,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  IsUrl,
} from 'class-validator';
import {
  bind,
  KeyTransforms as T,
  ModelDataProvider,
} from '../../lib/model-data';

// Sign inflow
// params listed in:
// https://mozilla.github.io/ecosystem-platform/api#tag/OAuth-Server-API-Overview

export class SignInSignUpInfo extends ModelDataProvider {
  // TODO: IsIn([])
  @IsOptional()
  @IsString()
  @bind(T.snakeCase)
  accessType: string | undefined;

  @IsString()
  @IsOptional()
  @bind(T.snakeCase)
  acrValues: string | undefined;

  // TODO @IsIn([])
  @IsOptional()
  @IsString()
  @bind(T.snakeCase)
  action: string | undefined;

  // TODO: ClientID custom validation
  @IsOptional()
  @IsString()
  @bind(T.snakeCase)
  clientId: string | undefined;

  @IsOptional()
  @IsString()
  @bind(T.snakeCase)
  codeChallenge: string | undefined;

  // TODO: @IsIn([])
  @IsOptional()
  @IsString()
  @bind(T.snakeCase)
  codeChallengeMethod: string | undefined;

  // TODO: CustomValidator isKeysJwk
  @IsOptional()
  @IsString()
  @bind(T.snakeCase)
  keysJwk: string | undefined;

  // TODO: Custom Validator
  @IsOptional()
  @IsString()
  @bind(T.snakeCase)
  idTokenHint: string | undefined;

  @IsOptional()
  @IsEmail()
  @bind(T.snakeCase)
  loginHint: string | undefined;

  @IsOptional()
  @IsInt()
  @IsPositive()
  @bind(T.snakeCase)
  maxAge: number | undefined;

  // TODO Custom Validator
  @IsOptional()
  @IsString()
  @bind()
  prompt: string | undefined;

  @IsOptional()
  @IsUrl()
  @bind(T.snakeCase)
  redirectUri: string | undefined;

  @IsOptional()
  @IsUrl()
  @bind(T.snakeCase)
  redirectTo: string | undefined;

  @IsOptional()
  @IsBoolean()
  @bind(T.snakeCase)
  returnOnError: boolean | undefined;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @bind()
  scope: string | undefined;

  // TODO Validation - Needs to be base64?
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @bind()
  state: string | undefined;

  @IsOptional()
  @IsEmail()
  @bind()
  email: string | undefined;
}
