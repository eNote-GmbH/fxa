/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { ModelDataStore, GenericData } from '../../lib/model-data';
import { OAuthRelier } from './oauth-relier';

describe('models/reliers/oauth-relier', function () {
  let data: ModelDataStore;
  let oauthData: ModelDataStore;
  let model: OAuthRelier;

  beforeEach(function () {
    data = new GenericData({});
    oauthData = new GenericData({});
    model = new OAuthRelier(data, oauthData, {
      scopedKeysEnabled: true,
      scopedKeysValidation: {},
      isPromptNoneEnabled: true,
      isPromptNoneEnabledClientIds: [],
    });
  });

  it('exists', () => {
    expect(model).toBeDefined();
  });

  it('gets normalized scopes', () => {
    data = new GenericData({
      scope: 'profile+https://identity.mozilla.com/account/subscriptions',
    });
    oauthData = new GenericData({});
    model = new OAuthRelier(data, oauthData, {
      scopedKeysEnabled: true,
      scopedKeysValidation: {},
      isPromptNoneEnabled: true,
      isPromptNoneEnabledClientIds: [],
    });

    expect(model.scope).toEqual(
      'profile+https://identity.mozilla.com/account/subscriptions'
    );
    expect(model.getNormalizedScope()).toEqual(
      'profile https://identity.mozilla.com/account/subscriptions'
    );
  });

  // TODO: OAuth Relier Model Test Coverage
});
