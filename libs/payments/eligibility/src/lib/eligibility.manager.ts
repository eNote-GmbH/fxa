/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {
  ContentfulManager,
  EligibilityContentByPlanIdsResultUtil,
} from '@fxa/shared/contentful';
import { Injectable } from '@nestjs/common';

import { EligibilityResult } from './eligibility.types';

@Injectable()
export class EligibilityManager {
  constructor(private contentfulManager: ContentfulManager) {}

  async getPlanEligibility(
    webPlanIds: string[],
    iapPlanIds: string[],
    targetPlanId: string
  ): Promise<[EligibilityResult, string | undefined]> {
    if ([...iapPlanIds, ...webPlanIds].length === 0)
      return [EligibilityResult.CREATE, undefined];

    const detailsResult =
      await this.contentfulManager.getPurchaseDetailsForEligibility([
        ...webPlanIds,
        ...iapPlanIds,
        targetPlanId,
      ]);

    if (
      detailsResult.planIdsInSameOfferingOrSubgroup(iapPlanIds, targetPlanId)
        .length > 0
    )
      return [EligibilityResult.BLOCKED_IAP, undefined];

    const overlappingPlanIds = detailsResult.planIdsInSameOfferingOrSubgroup(
      webPlanIds,
      targetPlanId
    );

    switch (overlappingPlanIds.length) {
      case 0:
        return [EligibilityResult.CREATE, undefined];
      case 1:
        return canChangePlan(
          detailsResult,
          overlappingPlanIds[0],
          targetPlanId
        );
      default:
        // We don't support upgrading from 2+ plans
        return [EligibilityResult.INVALID, undefined];
    }
  }
}

function canChangePlan(
  detailsResult: EligibilityContentByPlanIdsResultUtil,
  existingPlanId: string,
  targetPlanId: string
): [EligibilityResult, string] {
  if (existingPlanId === targetPlanId)
    return [EligibilityResult.EXISTING_PLAN, existingPlanId];

  if (
    !detailsResult.matchingOfferings(existingPlanId, targetPlanId) &&
    detailsResult.targetPlanIsDowngrade(existingPlanId, targetPlanId)
  )
    return [EligibilityResult.DOWNGRADE, existingPlanId];

  // TODO: Determine using Stripe data whether existing plan ID is
  // upgrade or downgrade in interval, as we only support the same
  // or higher interval for now. Return early if interval is downgrade.

  return [EligibilityResult.UPGRADE, existingPlanId];
}
