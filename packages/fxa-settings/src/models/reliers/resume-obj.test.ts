/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { createResumeToken, parseResumeToken } from './resume-obj';

describe('models/reliers/resume-obj', function () {
  it('creates and parses', () => {
    const token = createResumeToken({ email: '123' });
    const obj = parseResumeToken(token);

    expect(token).toBeDefined();
    expect(token.length).toBeGreaterThan(0);
    expect(obj).toBeDefined();
    expect(obj.email).toEqual('123');
  });
});
