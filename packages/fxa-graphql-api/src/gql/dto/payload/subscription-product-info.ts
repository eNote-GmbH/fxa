/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class SubscriptionProductInfo {
  @Field({ description: 'Unique identifier for subscription product' })
  public subscriptionProductId!: string;

  @Field({ description: 'Human readable name for subscription product' })
  public subscriptionProductName!: string;
}
