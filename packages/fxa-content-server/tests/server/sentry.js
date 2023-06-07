/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
const { registerSuite } = intern.getInterface('object');
const assert = intern.getPlugin('chai').assert;
const sentry = require('../../server/lib/sentry');

var suite = {
  tests: {},
};

suite.tests['exports correctly'] = function () {
  assert.ok(sentry.sentryModule);
  assert.ok(sentry._eventFilter);
};

suite.tests['eventFilter'] = function () {
  var badUrl =
    'https://accounts.firefox.com/page?token=foo&code=bar&email=a@a.com&service=sync&resume=barbar';
  var goodUrl = 'https://accounts.firefox.com/page';

  var mockData = {
    exception: [
      {
        stacktrace: {
          frames: new Array(120),
        },
      },
    ],
    request: {
      headers: {
        Referer: badUrl,
      },
      url: badUrl,
    },
  };

  var response = sentry._eventFilter(mockData);

  assert.equal(response.request.headers.Referer, goodUrl);
  assert.equal(response.request.url, goodUrl);
  assert.equal(response.request.query_string, null);
  assert.equal(response.exception[0].stacktrace.frames.length, 10);
};

suite.tests['captures validation errors'] = function () {
  var err = {
    details: new Map([
      [
        'body',
        {
          details: [
            {
              message: 'test1',
              type: 'test2',
              path: ['test3'],
            },
          ],
        },
      ],
    ]),
  };
  assert.ok(sentry.tryCaptureValidationError(err));
};

suite.tests['it ignores errors that are not validation based'] = function () {
  assert.isFalse(sentry.tryCaptureValidationError(new Error('BOOM')));
  assert.isFalse(sentry.tryCaptureValidationError({}));
  assert.isFalse(sentry.tryCaptureValidationError('BOOM'));
};

suite.tests['it ignores navigation timing errors'] = function () {
  var err = {
    details: new Map([
      [
        'body',
        {
          details: [
            {
              message:
                'ValidationError: "navigationTiming.navigationStart" must be a number',
              type: 'number.base',
              path: ['metrics'],
            },
          ],
        },
      ],
    ]),
  };
  assert.isFalse(sentry.tryCaptureValidationError(err));
};

registerSuite('sentry', suite);
