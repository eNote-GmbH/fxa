/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { LinkedErrors } = require('@sentry/integrations');
const { initMonitoring } = require('fxa-shared/monitoring');
const { config } = require('../config');
const log = require('./log')(config.log.level, 'configure-sentry');

/**
 * Initialize sentry and otel tracing. Note that order matters!
 */
initMonitoring({
  log,
  config: {
    ...config,
    release: require('../../package.json').version,
    integrations: [new LinkedErrors({ key: 'jse_cause' })],
  },
});
