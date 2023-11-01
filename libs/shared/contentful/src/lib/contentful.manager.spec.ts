/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
import { Test, TestingModule } from '@nestjs/testing';

import { ContentfulClient } from './contentful.client';
import { ContentfulManager } from './contentful.manager';
import {
  EligibilityContentByPlanIdsQueryFactory,
  ServicesWithCapabilitiesQueryFactory,
} from './factories';
import {
  EligibilityContentByPlanIdsResultUtil,
  ServicesWithCapabilitiesResultUtil,
} from '../../src';
describe('ContentfulManager', () => {
  let manager: ContentfulManager;
  let mockClient: ContentfulClient;

  beforeEach(async () => {
    mockClient = {} as any;
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        { provide: ContentfulClient, useValue: mockClient },
        ContentfulManager,
      ],
    }).compile();

    manager = module.get<ContentfulManager>(ContentfulManager);
  });

  it('should be defined', () => {
    expect(manager).toBeDefined();
  });

  describe('getPurchaseDetailsForEligibility', () => {
    it('should return empty result', async () => {
      mockClient.query = jest.fn().mockReturnValue({
        purchaseCollection: { items: [] },
      });
      const result = await manager.getPurchaseDetailsForEligibility(['test']);
      expect(result).toBeInstanceOf(EligibilityContentByPlanIdsResultUtil);
      expect(result.purchaseCollection.items).toHaveLength(0);
    });

    it('should return successfully with subgroups and offering', async () => {
      const queryData = EligibilityContentByPlanIdsQueryFactory();
      mockClient.query = jest.fn().mockResolvedValueOnce(queryData);
      const result = await manager.getPurchaseDetailsForEligibility(['test']);
      const planId = result.purchaseCollection.items[0].stripePlanChoices[0];
      expect(result).toBeInstanceOf(EligibilityContentByPlanIdsResultUtil);
      expect(
        result.offeringForPlanId(planId)?.linkedFrom.subGroupCollection.items
      ).toHaveLength(1);
      expect(result.offeringForPlanId(planId)).toBeDefined();
    });
  });

  describe('getServicesWithCapabilities', () => {
    it('should return results', async () => {
      mockClient.query = jest.fn().mockReturnValue({
        serviceCollection: { items: [] },
      });
      const result = await manager.getServicesWithCapabilities();
      expect(result).toBeInstanceOf(ServicesWithCapabilitiesResultUtil);
      expect(result.serviceCollection.items).toHaveLength(0);
    });

    it('should return successfully with services and capabilities', async () => {
      const queryData = ServicesWithCapabilitiesQueryFactory();
      mockClient.query = jest.fn().mockResolvedValueOnce(queryData);
      const result = await manager.getServicesWithCapabilities();
      expect(result).toBeInstanceOf(ServicesWithCapabilitiesResultUtil);
      expect(result.serviceCollection.items).toHaveLength(1);
    });
  });
});
