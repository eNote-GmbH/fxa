/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import assert from 'assert';

import {
  EligibilityContentByPlanIdsResult,
  EligibilityOfferingResult,
  EligibilityPurchaseResult,
  EligibilitySubgroupResult,
} from './types';

export class EligibilityContentByPlanIdsResultUtil {
  private purchaseByPlanId: Record<string, EligibilityPurchaseResult> = {};

  constructor(private rawResult: EligibilityContentByPlanIdsResult) {
    for (const purchase of rawResult.purchaseCollection.items) {
      for (const planId of purchase.stripePlanChoices) {
        this.purchaseByPlanId[planId] = purchase;
      }
    }
  }

  offeringForPlanId(planId: string): EligibilityOfferingResult | undefined {
    return this.purchaseByPlanId[planId]?.offering;
  }

  subgroupsForPlanId(planId: string): EligibilitySubgroupResult[] {
    return (
      this.purchaseByPlanId[planId]?.offering.linkedFrom.subGroupCollection
        .items || []
    );
  }

  matchingOfferings(planId: string, targetPlanId: string): boolean {
    return (
      this.offeringForPlanId(planId)?.stripeProductId ===
      this.offeringForPlanId(targetPlanId)?.stripeProductId
    );
  }

  /**
   * Filter and return only purchases that include any of the given plan IDs.
   *
   * The planId for each matching purchase is returned as the second element
   * for convenience.
   *
   * @returns Array of [planId, purchase] tuples
   */
  purchasesByPlanIds(planIds: string[]): [string, EligibilityPurchaseResult][] {
    return Object.entries(this.purchaseByPlanId).filter(([planId]) =>
      planIds.includes(planId)
    );
  }

  /**
   * Find all plan IDs that are in the same offering or subgroup as the target plan.
   *
   * @param planIds Plan IDs to check
   * @param targetPlanId Target plan that we want to check against
   * @returns Plan IDs that are in the same offering or subgroup as the target plan
   */
  planIdsInSameOfferingOrSubgroup(
    planIds: string[],
    targetPlanId: string
  ): string[] {
    const targetOffering = this.offeringForPlanId(targetPlanId);
    assert(targetOffering, `No offering found for ${targetPlanId}`);

    const targetSubgroupNames = this.subgroupsForPlanId(targetPlanId).map(
      (subgroup) => subgroup.groupName
    );
    const result: string[] = [];
    for (const [planId, purchase] of this.purchasesByPlanIds(planIds)) {
      if (
        purchase.offering.stripeProductId === targetOffering.stripeProductId
      ) {
        result.push(planId);
        continue;
      }
      for (const subgroup of this.subgroupsForPlanId(planId)) {
        if (
          targetSubgroupNames.includes(subgroup.groupName) &&
          !result.includes(planId)
        ) {
          result.push(planId);
        }
      }
    }
    return result;
  }

  /**
   * Evaluate for two plan IDs whether the target plan is an upgrade from the existing plan.
   */
  targetPlanIsDowngrade(existingPlanId: string, targetPlanId: string): boolean {
    const existingSubgroups = this.subgroupsForPlanId(existingPlanId);
    const targetSubgroups = this.subgroupsForPlanId(targetPlanId);
    const commonSubgroups: EligibilitySubgroupResult[] = [];
    for (const subgroup of existingSubgroups) {
      commonSubgroups.push(
        ...targetSubgroups.filter(
          (s) =>
            s.groupName === subgroup.groupName && !commonSubgroups.includes(s)
        )
      );
    }
    assert(commonSubgroups.length === 1);
    const subgroupByProductId = commonSubgroups[0].offeringCollection.items.map(
      (o) => o.stripeProductId
    );
    return (
      subgroupByProductId.indexOf(
        this.offeringForPlanId(existingPlanId)?.stripeProductId ?? ''
      ) >
      subgroupByProductId.indexOf(
        this.offeringForPlanId(targetPlanId)?.stripeProductId ?? ''
      )
    );
  }

  get purchaseCollection() {
    return this.rawResult.purchaseCollection;
  }
}
