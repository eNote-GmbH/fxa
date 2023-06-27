/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const PATH = process.env.PATH.split(':')
  .filter((p) => !p.includes(process.env.TMPDIR))
  .join(':');

const nest = require.resolve('@nestjs/cli/bin/nest.js');

module.exports = {
  apps: [
    {
      name: 'event-broker',
      script: `${nest} start --debug=9180 --watch`,
      cwd: __dirname,
      max_restarts: '1',
      env: {
        NODE_ENV: 'development',
        NODE_OPTIONS: '--dns-result-order=ipv4first',
        TS_NODE_TRANSPILE_ONLY: 'true',
        TS_NODE_FILES: 'true',
        WORKER_HOST: '0.0.0.0',
        PUBSUB_EMULATOR_HOST: 'localhost:8085',
        FIRESTORE_EMULATOR_HOST: 'localhost:9090',
        PUBSUB_PROXY_PORT: '8093',
        PATH,
        SENTRY_ENV: 'local',
        SENTRY_DSN: process.env.SENTRY_DSN_EVENT_BROKER,
        TRACING_SERVICE_NAME: 'fxa-event-broker',
      },
      filter_env: ['npm_'],
      watch: ['src', 'config'],
      min_uptime: '2m',
      time: true,
    },
  ],
};
