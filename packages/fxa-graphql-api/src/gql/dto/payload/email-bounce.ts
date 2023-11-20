/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class EmailBounceStatusPayload {
  @Field({
    description:
      'Whether or not there are email bounces for the provided email',
  })
  public hasBounces!: boolean | undefined;
}
