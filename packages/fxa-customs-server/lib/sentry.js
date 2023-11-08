/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

const Hoek = require('@hapi/hoek');
const Sentry = require('@sentry/node');
const {
  buildSentryConfig,
  tagCriticalEvent,
  tagFxaName,
} = require('fxa-shared/sentry');
const version = require('../package.json').version;

async function configureSentry(server, config, log) {
  const logger = require('../lib/log')(config.log.level, 'configure-sentry');

  const opts = buildSentryConfig(
    {
      ...config,
      release: version,
    },
    logger
  );

  console.log('!!! sentry init');
  Sentry.init({
    ...opts,
    integrations: [new Sentry.Integrations.LinkedErrors({ key: 'jse_cause' })],
    beforeSend(event, _hint) {
      event = tagCriticalEvent(event);
      event = tagFxaName(event, opts.serverName);
      return event;
    },
  });

  Sentry.configureScope((scope) => {
    scope.setTag('process', 'customs_server');
  });

  // Attach a new Sentry scope to the request for breadcrumbs/tags/extras
  server.ext({
    type: 'onRequest',
    method(request, h) {
      request.sentryScope = new Sentry.Scope();

      // Make a transaction per request so we can get performance monitoring. There are
      // some limitations to this approach, and distributed tracing will be off due to
      // hapi's architecture.
      //
      // See https://github.com/getsentry/sentry-javascript/issues/2172 for more into. It
      // looks like there might be some other solutions that are more complex, but would work
      // with hapi and distributed tracing.
      //
      const transaction = Sentry.startTransaction(
        {
          op: 'auth-server',
          name: `${request.method.toUpperCase()} ${request.path}`,
        },
        {
          request: Sentry.Handlers.extractRequestData(request.raw.req),
        }
      );

      Sentry.configureScope((scope) => {
        scope.setSpan(transaction);
      });

      request.app.sentry = {
        transaction,
      };

      return h.continue;
    },
  });

  // Sentry handler for hapi errors
  server.events.on({ name: 'request', channels: 'error' }, (request, event) => {
    const err = (event && event.error) || null;

    if (config.sentry.dsn) {
      let exception = '';
      if (err && err.stack) {
        try {
          exception = err.stack.split('\n')[0];
        } catch (e) {
          // ignore bad stack frames
        }
      }
      Sentry.withScope((scope) => {
        scope.addEventProcessor((_sentryEvent) => {
          const sentryEvent = Sentry.Handlers.parseRequest(
            _sentryEvent,
            request.raw.req
          );
          sentryEvent.level = 'error';
          return sentryEvent;
        });
        scope.setExtra('exception', exception);

        // Merge the request scope into the temp scope
        Hoek.merge(scope, request.sentryScope);
        Sentry.captureException(err);
      });
    }

    log.error({ op: 'error', message: err.message });
  });
}

module.exports = { configureSentry };
