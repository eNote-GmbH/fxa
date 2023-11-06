/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {
  ServicesWithCapabilitiesQueryFactory,
  ServicesWithCapabilitiesResult,
  ServicesWithCapabilitiesResultUtil,
} from '.';

describe('ServicesWithCapabilitiesResultUtil', () => {
  it('should create a util from response', () => {
    const result = ServicesWithCapabilitiesQueryFactory();
    const util = new ServicesWithCapabilitiesResultUtil(
      result as ServicesWithCapabilitiesResult
    );
    expect(util).toBeDefined();
    expect(util.serviceCollection.items.length).toBe(1);
  });

  it('getServices - should return services and capabilities', () => {
    const result = ServicesWithCapabilitiesQueryFactory();
    const util = new ServicesWithCapabilitiesResultUtil(
      result as ServicesWithCapabilitiesResult
    );
    expect(util.getServices()[0].oauthClientId).toBeDefined();
    expect(util.getServices()[0].oauthClientId).toEqual(
      result.serviceCollection?.items[0]?.oauthClientId
    );
    expect(util.getServices()[0].capabilitiesCollection).toBeDefined();
    expect(util.getServices()[0].capabilitiesCollection.items[0].slug).toEqual(
      result.serviceCollection?.items[0]?.capabilitiesCollection?.items[0]?.slug
    );
  });
});
