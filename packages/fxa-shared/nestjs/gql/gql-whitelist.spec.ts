/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
import { GqlWhitelist } from './gql-whitelist';

describe('Gql Whitelist', () => {
  let whitelist: GqlWhitelist;

  function runGuard({ body = {}, query = {} }) {
    return whitelist.allowed({
      body,
      query,
    });
  }

  beforeEach(async () => {
    whitelist = new GqlWhitelist({
      whitelist: ['nestjs/gql/example-whitelist.json'],
      enabled: true,
    });
  });

  it('should be defined', () => {
    expect(whitelist).toBeDefined();
  });

  it('should have parsed whitelist', () => {
    expect(whitelist.valid).toBeDefined();
    expect(whitelist.valid.length).toBeGreaterThan(0);
    expect(Object.keys(whitelist.valid[0]).length).toBeGreaterThan(0);
  });

  it('allowsValid query', () => {
    const body = {
      query: 'query GetUid {\n  account {\n    uid\n  }\n}\n',
    };
    expect(runGuard({ body })).toBeTruthy();
  });

  it('denies invalid query', () => {
    const body = {
      query:
        'query GetRecoveryKeyExists {\n  account {\n    totp {\n      exists\n      verified\n    }\n  }\n}\n',
    };
    expect(runGuard({ body })).toBeFalsy();
  });
});
