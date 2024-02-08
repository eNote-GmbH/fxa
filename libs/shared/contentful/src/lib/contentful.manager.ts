/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { Injectable } from '@nestjs/common';

import {
  EligibilityContentByPlanIdsQuery,
  PurchaseWithDetailsOfferingContentQuery,
  ServicesWithCapabilitiesQuery,
  CapabilityServiceByPlanIdsQuery,
} from '../__generated__/graphql';
import { DEFAULT_LOCALE } from './constants';
import { ContentfulClient } from './contentful.client';

import {
  capabilityServiceByPlanIdsQuery,
  CapabilityServiceByPlanIdsResultUtil,
} from './queries/capability-service-by-plan-ids';
import {
  EligibilityContentByPlanIdsResultUtil,
  eligibilityContentByPlanIdsQuery,
} from './queries/eligibility-content-by-plan-ids';
import {
  PurchaseWithDetailsOfferingContentUtil,
  purchaseWithDetailsOfferingContentQuery,
} from './queries/purchase-with-details-offering-content';
import {
  ServicesWithCapabilitiesResultUtil,
  servicesWithCapabilitiesQuery,
} from './queries/services-with-capabilities';
import { DeepNonNullable } from './types';
import { StatsD } from 'hot-shots';
import { Container } from 'typedi';

@Injectable()
export class ContentfulManager {
  private statsd: StatsD | null;
  constructor(private client: ContentfulClient) {
    this.statsd = Container.has(StatsD) ? Container.get(StatsD) : null;
    if (this.statsd) {
      this.client.on('response', (response) => {
        this.statsd?.timing('contentful_request', response.elapsed, undefined, {
          method: response.method,
          error: response.error ? 'true' : 'false',
          cache: `${response.cache}`,
        });
      });
    }
  }

  async getPurchaseDetailsForCapabilityServiceByPlanIds(
    stripePlanIds: string[]
  ): Promise<CapabilityServiceByPlanIdsResultUtil> {
    let total: number | undefined;
    let count = 0;
    const queryResults: DeepNonNullable<CapabilityServiceByPlanIdsQuery>[] = [];
    const pageSize = 20;

    while (total === undefined || count < total) {
      const queryResult = (await this.client.query(
        capabilityServiceByPlanIdsQuery,
        {
          skip: count,
          limit: pageSize,
          locale: DEFAULT_LOCALE,
          stripePlanIds,
        }
      )) as DeepNonNullable<CapabilityServiceByPlanIdsQuery>;

      queryResults.push(queryResult);
      count += pageSize;
      total = queryResult.purchaseCollection.total;
    }

    return new CapabilityServiceByPlanIdsResultUtil(queryResults);
  }

  async getPurchaseDetailsForEligibility(
    stripePlanIds: string[]
  ): Promise<EligibilityContentByPlanIdsResultUtil> {
    let total: number | undefined;
    let count = 0;
    const queryResults: DeepNonNullable<EligibilityContentByPlanIdsQuery>[] =
      [];
    const pageSize = 20;

    while (total === undefined || count < total) {
      const queryResult = (await this.client.query(
        eligibilityContentByPlanIdsQuery,
        {
          skip: count,
          limit: pageSize,
          locale: DEFAULT_LOCALE,
          stripePlanIds,
        }
      )) as DeepNonNullable<EligibilityContentByPlanIdsQuery>;

      queryResults.push(queryResult);
      count += pageSize;
      total = queryResult.purchaseCollection.total;
    }

    return new EligibilityContentByPlanIdsResultUtil(queryResults);
  }

  async getServicesWithCapabilities(): Promise<ServicesWithCapabilitiesResultUtil> {
    const queryResult = await this.client.query(servicesWithCapabilitiesQuery, {
      skip: 0,
      limit: 100,
      locale: DEFAULT_LOCALE,
    });

    return new ServicesWithCapabilitiesResultUtil(
      queryResult as DeepNonNullable<ServicesWithCapabilitiesQuery>
    );
  }

  async getPurchaseWithDetailsOfferingContentByPlanIds(
    stripePlanIds: string[],
    acceptLanguage: string
  ): Promise<PurchaseWithDetailsOfferingContentUtil> {
    const locale = await this.client.getLocale(acceptLanguage);
    const queryResults: DeepNonNullable<PurchaseWithDetailsOfferingContentQuery>[] =
      [];
    const stripePlans: string[][] = [];

    // reduce query size by making multiple calls to Contentful
    for (let i = 0; i < stripePlanIds.length; i += 150) {
      stripePlans.push(stripePlanIds.slice(i, i + 150));
    }

    while (stripePlans.length > 0) {
      const queryResult = (await this.client.query(
        purchaseWithDetailsOfferingContentQuery,
        {
          skip: 0,
          limit: 100,
          locale,
          stripePlanIds: stripePlans[0],
        }
      )) as DeepNonNullable<PurchaseWithDetailsOfferingContentQuery>;
      queryResults.push(queryResult);
      stripePlans.shift();
    }

    return new PurchaseWithDetailsOfferingContentUtil(queryResults);
  }
}
