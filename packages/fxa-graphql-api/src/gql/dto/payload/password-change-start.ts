/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class PasswordChangeStartPayload {
  @Field()
  keyFetchToken!: String;

  @Field()
  passwordChangeToken!: String;

  @Field()
  verified!: Boolean;
}
