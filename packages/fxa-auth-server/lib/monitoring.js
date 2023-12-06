/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { initMonitoring } = require('fxa-shared/monitoring');
const { LinkedErrors } = require('@sentry/integrations');
const { config } = require('../config');
const logger = require('./log')(config.log.level, 'configure-sentry');

/**
 * Initialize sentry & otel
 */
initMonitoring({
  logger,
  config: {
    ...config.getProperties(),
    release: require('../package.json').version,
    eventFilters: [filterSentryEvent],
    integrations: [new LinkedErrors({ key: 'jse_cause' })],
  },
});

const TOKENREGEX = /[a-fA-F0-9]{32,}/gi;
const FILTERED = '[Filtered]';
const URIENCODEDFILTERED = encodeURIComponent(FILTERED);

/**
 * Filter a sentry event for PII in addition to the default filters.
 *
 * Current replacements:
 *   - A 32-char hex string that typically is a FxA user-id.
 *
 * Data Removed:
 *   - Request body.
 *
 * @param {Sentry.Event} event
 */
function filterSentryEvent(event, hint) {
  if (event.breadcrumbs) {
    for (const bc of event.breadcrumbs) {
      if (bc.message) {
        bc.message = bc.message.replace(TOKENREGEX, FILTERED);
      }
      if (bc.data) {
        bc.data = filterObject(bc.data);
      }
    }
  }
  if (event.request) {
    if (event.request.url) {
      event.request.url = event.request.url.replace(TOKENREGEX, FILTERED);
    }
    if (event.request.query_string) {
      event.request.query_string = event.request.query_string.replace(
        TOKENREGEX,
        URIENCODEDFILTERED
      );
    }
    if (event.request.headers) {
      event.request.headers = filterObject(event.request.headers);
    }
    if (event.request.data) {
      // Remove request data entirely
      delete event.request.data;
    }
  }
  if (event.tags && event.tags.url) {
    event.tags.url = event.tags.url.replace(TOKENREGEX, FILTERED);
  }
  return event;
}

/**
 * Filters all of an objects string properties to remove tokens.
 *
 * @param {Object} obj Object to filter values on
 */
function filterObject(obj) {
  if (typeof obj === 'object') {
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        obj[key] = value.replace(TOKENREGEX, FILTERED);
      }
    }
  }
  return obj;
}
