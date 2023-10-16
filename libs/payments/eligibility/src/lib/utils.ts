/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { EligibilityOfferingResult } from '../../../../shared/contentful/src';
import {
  OfferingComparison,
  Interval,
  IntervalComparison,
} from './eligibility.types';

/**
 * Returns whether the target offering overlaps, and how.
 *
 * @returns OfferingComparison if there's overlap, null otherwise.
 */
export const offeringComparison = (
  fromOfferingProductId: string,
  targetOffering: EligibilityOfferingResult
) => {
  if (targetOffering.stripeProductId === fromOfferingProductId)
    return OfferingComparison.SAME;
  const commonSubgroups =
    targetOffering.linkedFrom.subGroupCollection.items.filter(
      (subgroup) =>
        !!subgroup.offeringCollection.items.find(
          (oc) => oc.stripeProductId === fromOfferingProductId
        )
    );
  if (!commonSubgroups.length) return null;
  const subgroupProductIds = commonSubgroups[0].offeringCollection.items.map(
    (o) => o.stripeProductId
  );
  const existingIndex = subgroupProductIds.indexOf(fromOfferingProductId);
  const targetIndex = subgroupProductIds.indexOf(
    targetOffering.stripeProductId
  );
  switch (targetIndex - existingIndex) {
    case 0:
      return OfferingComparison.SAME;
    case 1:
      return OfferingComparison.UPGRADE;
    default:
      return OfferingComparison.DOWNGRADE;
  }
};

export const intervalComparison = (
  fromInterval: Interval,
  toInterval: Interval
): IntervalComparison => {
  const difference =
    unitToDays(toInterval.unit) * toInterval.count -
    unitToDays(fromInterval.unit) * fromInterval.count;
  if (difference === 0) return IntervalComparison.SAME;
  if (difference > 0) return IntervalComparison.LONGER;
  return IntervalComparison.SHORTER;
};

/**
 * Convert an interval unit to days.
 *
 * Note that due to the nature of months and years, this is an approximation
 * but should be sufficient for calculations in this context with the
 * assumption that one would not make intervals of 52 weeks to mark a year, or
 * 4 weeks to mark a month; instead using the appropriate unit.
 */
const unitToDays = (unit: Interval['unit']) => {
  switch (unit) {
    case 'day':
      return 1;
    case 'week':
      return 7;
    case 'month':
      return 30;
    case 'year':
      return 365;
    default:
      return 0;
  }
};
