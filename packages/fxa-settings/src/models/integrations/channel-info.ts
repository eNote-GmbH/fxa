/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {
  bind,
  KeyTransforms as T,
  ModelDataProvider,
} from '../../lib/model-data';
import { IsIn, IsOptional, IsString } from 'class-validator';

// TODO: Figure out valid values
export const CHANNEL_IDS = [];
export const CHANNEL_KEYS = [];

export class ChannelInfo extends ModelDataProvider {
  // TODO: @IsIn(CHANNEL_IDS)
  @IsOptional()
  @IsString()
  @bind(T.snakeCase)
  channelId: string | undefined;

  // TODO: @IsIn(CHANNEL_KEYS)
  @IsOptional()
  @IsString()
  @bind(T.snakeCase)
  channelKey: string | undefined;
}
