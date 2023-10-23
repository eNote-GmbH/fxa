/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { ContentfulManager } from '../../../../shared/contentful/src';
import { Injectable } from '@nestjs/common';

import { ClientIdCapabilityResult } from './capability.types';

@Injectable()
export class CapabilityManager {
  constructor(private contentfulManager: ContentfulManager) {}

  /**
   * Fetch the list of capabilities for the given price ids.
   */
  async planIdsToClientCapabilities(
    subscribedPrices: string[]
  ): Promise<ClientIdCapabilityResult> {
    if (!subscribedPrices.length) return [];

    const detailsResult =
      await this.contentfulManager.getPurchaseDetailsForCapabilityService([
        ...subscribedPrices,
      ]);

    const result: ClientIdCapabilityResult[] = [];

    for (const subscribedPrice of subscribedPrices) {
      const fromOffering = detailsResult.offeringForPlanId(subscribedPrice);
      if (!fromOffering) continue;

      result.push({ subscribedPrice });
    }

    return result;
  }
}
