/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { BaseIntegration, IntegrationType } from './base-integration';
import {
  bind,
  KeyTransforms as T,
  ModelDataProvider,
  ModelDataStore,
} from '../../lib/model-data';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

// TODO: move this to other file, FXA-8099
export class BaseIntegrationData extends ModelDataProvider {
  // TODO Validation - Do we we need custom validation?
  @IsOptional()
  @IsString()
  @bind()
  context: string | undefined;

  @IsOptional()
  @IsEmail()
  @bind()
  email: string | undefined;

  @IsOptional()
  @IsEmail()
  @bind()
  emailToHashWith: string | undefined;

  // TODO - Validation - Custom validator?
  @IsOptional()
  @IsString()
  @bind()
  entrypoint: string | undefined;

  @IsOptional()
  @IsString()
  @bind(T.snakeCase)
  entrypointExperiment: string | undefined;

  @IsOptional()
  @IsString()
  @bind(T.snakeCase)
  entrypointVariation: string | undefined;

  @IsOptional()
  @IsBoolean()
  @bind(T.snakeCase)
  resetPasswordConfirm: boolean | undefined;

  @IsOptional()
  @IsString()
  @bind()
  setting: string | undefined;

  @IsOptional()
  @IsString()
  @bind()
  service: string | undefined;

  @IsOptional()
  @IsString()
  @bind()
  style: string | undefined;

  // TODO - Validation - Uid Validation?
  @IsOptional()
  @IsString()
  @bind()
  uid: string | undefined;

  @IsOptional()
  @IsString()
  @bind(T.snakeCase)
  utmCampaign: string | undefined;

  @IsOptional()
  @IsString()
  @bind(T.snakeCase)
  utmContent: string | undefined;

  @IsOptional()
  @IsString()
  @bind(T.snakeCase)
  utmMedium: string | undefined;

  @IsOptional()
  @IsString()
  @bind(T.snakeCase)
  utmSource: string | undefined;

  @IsOptional()
  @IsString()
  @bind(T.snakeCase)
  utmTerm: string | undefined;
}

export class WebIntegration extends BaseIntegration {
  constructor(data: ModelDataStore) {
    super(IntegrationType.Web, new BaseIntegrationData(data));
    this.setFeatures({
      reuseExistingSession: true,
      fxaStatus: this.isFxaStatusSupported(),
    });
  }

  private isFxaStatusSupported(): boolean {
    // TODO: check if `navigator.userAgent` is firefox desktop.
    // content-server also checks for FF version 55+ but that's nearly 6 years old
    return true;
  }
}
