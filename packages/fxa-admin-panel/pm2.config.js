/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { resolve } = require('path');
const PATH = process.env.PATH.split(':')
  .filter((p) => !p.includes(process.env.TMPDIR))
  .join(':');

module.exports = {
  apps: [
    {
      name: 'admin',
      cwd: resolve(__dirname, 'server'),
      script: 'node -r esbuild-register bin/fxa-admin-panel.ts',
      max_restarts: '1',
      min_uptime: '2m',
      env: {
        LOGGING_FORMAT: 'pretty',
        NODE_ENV: 'development',
        NODE_OPTIONS: '--inspect=9140 --dns-result-order=ipv4first',
        PROXY_STATIC_RESOURCES_FROM: 'http://localhost:8092',
        CONFIG_FILES: '../config/secrets.json',
        PORT: '8091',
        PATH,
        SENTRY_ENV: 'local',
        SENTRY_DSN: process.env.SENTRY_DSN_ADMIN_PANEL,
        TEST_USER_EMAIL: 'hello@mozilla.com',
        TEST_USER_GROUP: 'vpn_fxa_admin_panel_prod',
      },
      filter_env: ['npm_'],
      time: true,
    },
    {
      name: 'admin-react',
      cwd: __dirname,
      script: 'yarn rescripts start',
      max_restarts: '1',
      min_uptime: '2m',
      env: {
        SKIP_PREFLIGHT_CHECK: 'true',
        NODE_ENV: 'development',
        NODE_OPTIONS: '--openssl-legacy-provider',
        PUBLIC_URL: 'http://localhost:8091',
        BROWSER: 'NONE',
        PORT: '8092',
        PATH,
      },
      filter_env: ['npm_', 'BERRY_BIN_FOLDER'],
      time: true,
      SENTRY_ENV: 'local',
      SENTRY_DSN: process.env.SENTRY_DSN_ADMIN_PANEL,
    },
    {
      name: 'admin-css',
      script: 'yarn build-css',
      cwd: __dirname,
      env: {
        PATH,
      },
      filter_env: ['npm_'],
      autorestart: false,
      watch: [
        'postcss.config.js',
        'tailwind.config.js',
        'src/styles',
        'src/components/**/*.css',
        'src/**/*.tsx',
        require.resolve('fxa-react/configs/tailwind'),
      ],
      ignore_watch: ['src/styles/tailwind.out.css'],
      time: true,
    },
    {
      name: 'gql-whitelist',
      autorestart: false,
      script: 'yarn gql:whitelist',
      watch: ['src/**/*.ts'],
    },
  ],
};
