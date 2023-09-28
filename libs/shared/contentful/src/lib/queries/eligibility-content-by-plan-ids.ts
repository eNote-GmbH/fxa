/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { Expose, plainToClass, Transform, Type } from 'class-transformer';
import { IsArray, IsString, MaxLength, ValidateNested } from 'class-validator';

import { graphql } from '../../__generated__/gql';

export const eligibilityContentByPlanIdsQuery = graphql(`
  query EligibilityContentByPlanIds(
    $skip: Int!
    $limit: Int!
    $locale: String!
    $stripePlanIds: [String]!
  ) {
    purchaseCollection(
      skip: $skip
      limit: $limit
      locale: $locale
      where: { stripePlanChoices_contains_some: $stripePlanIds }
    ) {
      items {
        stripePlanChoices
        offering {
          stripeProductId
          countries
          linkedFrom {
            subGroupCollection(skip: $skip, limit: $limit) {
              items {
                groupName
                offeringCollection(skip: $skip, limit: $limit) {
                  items {
                    stripeProductId
                    countries
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`);

/**
 * Transform for the `purchaseCollection` field in the Contentful GraphQL response.
 */
function parseEligibilityPurchaseResult({ value }: any) {
  return (value?.items ?? []).map((value: any) =>
    plainToClass(EligibilityPurchaseResult, value)
  );
}

/**
 * Transform for the `linkedFrom` field in the Contentful GraphQL response.
 */
function parseEligibilitySubGroupResult({ value }: any) {
  return (value?.subGroupCollection?.items ?? []).map((value: any) =>
    plainToClass(EligibilitySubGroupResult, value)
  );
}

/**
 * Transform for the `offeringCollection` field in the Contentful GraphQL response.
 */
function parseEligibilitySubGroupOfferingResult({ value }: any) {
  return (value?.items ?? []).map((value: any) =>
    plainToClass(EligibilitySubGroupOfferingResult, value)
  );
}

export class EligibilityContentByPlanIdsResult {
  @ValidateNested()
  @Expose({ name: 'purchaseCollection' })
  @Transform(parseEligibilityPurchaseResult)
  purchases!: EligibilityPurchaseResult[];
}

export class EligibilityPurchaseResult {
  @MaxLength(100, { each: true })
  stripePlanChoices!: string[];

  @ValidateNested()
  @Type(() => EligibilityOfferingResult)
  offering!: EligibilityOfferingResult;
}

export class EligibilityOfferingResult {
  @IsString()
  stripeProductId!: string;

  @MaxLength(50, { each: true })
  @IsArray()
  countries!: string[];

  @ValidateNested()
  @Expose({ name: 'linkedFrom' })
  @Transform(parseEligibilitySubGroupResult)
  subGroups!: EligibilitySubGroupResult[];
}

export class EligibilitySubGroupResult {
  @IsString()
  groupName!: string;

  @ValidateNested()
  @Expose({ name: 'offeringCollection' })
  @Transform(parseEligibilitySubGroupOfferingResult)
  offerings!: EligibilitySubGroupOfferingResult[];
}

export class EligibilitySubGroupOfferingResult {
  @IsString()
  stripeProductId!: string;
}
