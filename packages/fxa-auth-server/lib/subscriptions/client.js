/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

const isA = require('@hapi/joi');
const validators = require('../routes/validators');
const createBackendServiceAPI = require('../backendService');

const PATH_PREFIX = '/v1';

const SubscriptionResponse = isA.alternatives().try(
  isA
    .object({
      valid: isA.boolean().required(),
      original_transaction_id: isA.string().optional(),
      product_id: isA.string().optional(),
      expires_date: isA.string().optional(),
      auto_renew_product_id: isA.string().optional(),
      auto_renew_status: isA.number().integer().min(0).max(1).optional(),
    })
    .unknown(true),
  isA
    .object({
      code: isA.number().required(),
      message: isA.string().optional(),
      severity: isA.string().required(),
    })
    .unknown(true)
);

module.exports = function (log, config, statsd) {
  if (
    !config.subscriptions ||
    !config.subscriptions.internal ||
    !config.subscriptions.internal.url
  ) {
    log.info('subscription.internal.init', {
      message: 'Internal subscription support disabled',
    });
    return undefined;
  }

  log.info('subscription.internal.init', {
    message: 'Internal subscription support enabled',
    url: config.subscriptions.internal.url,
  });
  const SubscriptionAPI = createBackendServiceAPI(
    log,
    config,
    'subscription',
    {
      verify: {
        path: `${PATH_PREFIX}/verify`,
        method: 'POST',
        validate: {
          payload: {
            'user-id': validators.uid.required(),
            'receipt-data': isA.string().required(),
          },
          response: SubscriptionResponse,
        },
      },
      check: {
        path: `${PATH_PREFIX}/check/:uid`,
        method: 'GET',
        validate: {
          params: {
            uid: validators.uid.required(),
          },
          response: SubscriptionResponse,
        },
      },
      delete_user: {
        path: `${PATH_PREFIX}/users/:uid`,
        method: 'DELETE',
        validate: {
          params: {
            uid: validators.uid.required(),
          },
          response: isA.object().unknown(true),
        },
      },
    },
    statsd
  );

  const api = new SubscriptionAPI(config.subscriptions.internal.url, {
    headers: {
      Authorization: `Bearer ${config.subscriptions.internal.secretBearerToken}`,
    },
    timeout: 15000,
  });

  return {
    async verify(uid, receiptData) {
      try {
        return await api.verify({
          'user-id': uid,
          'receipt-data': receiptData,
        });
      } catch (err) {
        log.error('subscription.verify.failed', { uid, ...err });
        throw err;
      }
    },
    async check(uid) {
      try {
        return await api.check(uid);
      } catch (err) {
        log.error('subscription.check.failed', { uid, ...err });
        throw err;
      }
    },
    async delete_user(uid) {
      try {
        return await api.delete_user(uid);
      } catch (err) {
        log.error('subscription.delete_user.failed', { uid, ...err });
        throw err;
      }
    },
  };
};
