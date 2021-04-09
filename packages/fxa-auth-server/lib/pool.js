/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

const Poolee = require('poolee');
const url = require('url');
const PROTOCOL_MODULES = {
  http: require('http'),
  https: require('https'),
};
const POOLEE_DEFAULTS = {
  timeout: 5000,
  maxPending: 1000,
  keepAlive: true,
  maxRetries: 0,
  timeout_log: 0,
};
const REQUEST_LOG_FIELDS = ['host', 'port', 'method', 'path', 'failed'];

function Pool(uri, log, options = {}) {
  const parsed = url.parse(uri);
  const { protocol, host } = parsed;
  const protocolModule = PROTOCOL_MODULES[protocol.slice(0, -1)];
  if (!protocolModule) {
    throw new Error(`Protocol ${protocol} is not supported.`);
  }
  const port = parsed.port || protocolModule.globalAgent.defaultPort;

  const poolee_options = { ...POOLEE_DEFAULTS, ...options };

  if (poolee_options.request) {
    this.request_options = poolee_options.request;
    delete poolee_options.request;
  } else {
    this.request_options = {};
  }
  this.poolee = new Poolee(protocolModule, [`${host}:${port}`], poolee_options);

  if (poolee_options.logRetry === true) {
    this.poolee.on('retrying', (err) => {
      const log_data = {};
      if (err.__proto__ && err.__proto__.name) {
        log_data.name = err.__proto__.name;
      } else if (err.name) {
        log_data.name = err.name;
      }

      if (err.message) {
        log_data.message = err.message;
      } else if (err.msg) {
        log_data.message = err.msg;
      }

      if (err.attempt) {
        REQUEST_LOG_FIELDS.forEach((key) => (log_data[key] = err.attempt[key]));
      }
      log.warn('pool.request.retry', log_data);
    });
  }

  if (poolee_options.logSlow === true) {
    const time_slow =
      poolee_options.slowTimeout || Math.floor(poolee_options.timeout / 2);
    this.poolee.on('timing', (milliseconds, options) => {
      if (milliseconds > time_slow) {
        const log_data = { t: milliseconds / 1000 };
        REQUEST_LOG_FIELDS.forEach((key) => (log_data[key] = options[key]));
        log.warn('pool.request.slow', log_data);
      }
    });
  }
}

Pool.prototype.request = function (
  method,
  url,
  params,
  query,
  body,
  headers = {}
) {
  let path;
  try {
    path = url.render(params, query);
  } catch (err) {
    return Promise.reject(err);
  }

  return new Promise((resolve, reject) => {
    let data;
    if (body) {
      headers['Content-Type'] = 'application/json';
      data = JSON.stringify(body);
    }
    const options = Object.assign(this.request_options, {
      method: method || 'GET',
      path,
      headers,
      data,
    });
    this.poolee.request(options, (err, res, body) => {
      const parsedBody = safeParse(body);

      if (err) {
        return reject(err);
      }

      if (res.statusCode < 200 || res.statusCode >= 300) {
        const error = new Error();
        if (!parsedBody) {
          error.message = body;
        } else {
          Object.assign(error, parsedBody);
        }
        error.statusCode = res.statusCode;
        return reject(error);
      }

      if (!body) {
        return resolve();
      }

      if (!parsedBody) {
        return reject(new Error('Invalid JSON'));
      }

      resolve(parsedBody);
    });
  });
};

Pool.prototype.post = function (
  path,
  params,
  body,
  { query = {}, headers = {} } = {}
) {
  return this.request('POST', path, params, query, body, headers);
};

Pool.prototype.put = function (
  path,
  params,
  body,
  { query = {}, headers = {} } = {}
) {
  return this.request('PUT', path, params, query, body, headers);
};

Pool.prototype.get = function (
  path,
  params,
  { query = {}, headers = {} } = {}
) {
  return this.request('GET', path, params, query, null, headers);
};

Pool.prototype.del = function (
  path,
  params,
  body,
  { query = {}, headers = {} } = {}
) {
  return this.request('DELETE', path, params, query, body, headers);
};

Pool.prototype.head = function (
  path,
  params,
  { query = {}, headers = {} } = {}
) {
  return this.request('HEAD', path, params, query, null, headers);
};

Pool.prototype.close = function () {
  /*/
    This is a hack to coax the server to close its existing connections
  /*/
  const socketCount = this.poolee.options.maxSockets || 20;
  function noop() {}
  for (let i = 0; i < socketCount; i++) {
    this.poolee.request(
      {
        method: 'GET',
        path: '/',
        headers: {
          Connection: 'close',
        },
      },
      noop
    );
  }
};

module.exports = Pool;

function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch (e) {}
}
