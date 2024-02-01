/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { initMonitoring } = require('fxa-shared/monitoring');
const Sentry = require('@sentry/node');
const { config } = require('../config');
const logger = require('./log')(
  config.getProperties().log.level,
  'configure-sentry'
);
const { version } = require('../package.json');
const { ERRNO } = require('./error');

// Maintain list of errors that should not be sent to Sentry
const IGNORED_ERROR_NUMBERS = [
  ERRNO.BOUNCE_HARD,
  ERRNO.BOUNCE_SOFT,
  ERRNO.BOUNCE_COMPLAINT,
];

/**
 * Initialize sentry & otel
 */
initMonitoring({
  logger,
  config: {
    ...config.getProperties(),
    release: version,
    eventFilters: [filterSentryEvent],
    integrations: [new Sentry.Integrations.LinkedErrors({ key: 'jse_cause' })],
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
  // If we encounter a WError, we likely want to filter it out. These errors are
  // intentionally relayed to the client, and don't constitute unexpected errors.
  // Note, that these might arrive here from our reportSentryError function, or
  // some other instrumentation that has captured the error.
  if (hint?.originalException != null && ignoreErrors(hint.originalException)) {
    return null;
  }

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
  // return event;
}

/**
 * Prevents errors from being captured in sentry.
 *
 * @param {Error} error An error with an error number. Note that errors of type vError will
 *                use the underlying jse_cause error if possible.
 */
function ignoreErrors(error) {
  if (!error) {
    return;
  }

  // Prefer jse_cause, but fallback to top level error if needed
  const statusCode =
    determineStatusCode(error.jse_cause) || determineStatusCode(error);

  const errno = error.jse_cause?.errno || error.errno;

  // Ignore non 500 status codes and specific error numbers
  return statusCode < 500 || IGNORED_ERROR_NUMBERS.includes(errno);
}

/**
 * Given an error tries to determine the HTTP status code associated with the error.
 * @param {*} error
 * @returns
 */
function determineStatusCode(error) {
  if (!error) {
    return;
  }

  return error.statusCode || error.output?.statusCode || error.code;
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
