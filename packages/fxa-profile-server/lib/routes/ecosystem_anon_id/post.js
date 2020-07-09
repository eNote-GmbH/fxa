/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const Joi = require('@hapi/joi');

const logger = require('../../logging')('routes.ecosystem_anon_id.post');
const notifyProfileUpdated = require('../../updates-queue');
const AppError = require('../../error');
const config = require('../../config');
const request = require('../../request');

const AUTH_SERVER_URL =
  config.get('authServer.url') + '/account/metrics/ecosystemAnonId';

const updateAuthServer = function (credentials, anonId) {
  return new Promise((resolve, reject) => {
    request.get(
      AUTH_SERVER_URL,
      {
        headers: {
          Authorization: 'Bearer ' + credentials.token,
        },
        body: {
          anonId,
        },
        json: true,
      },
      (err, res, body) => {
        if (err) {
          logger.error('request.auth_server.network', err);
          return reject(new AppError.authError('network error'));
        }

        if (res.statusCode >= 400) {
          body = body && body.code ? body : { code: res.statusCode };

          if (res.statusCode >= 500) {
            logger.error('request.auth_server.fail', body);
            return reject(new AppError.authError('auth-server server error'));
          }

          if (body.code === 401 || body.errno === 102) {
            logger.info('request.auth_server.fail', body);
            return reject(new AppError.unauthorized(body.message));
          }

          logger.error('request.auth_server.fail', body);
          return reject(
            new AppError({
              code: 500,
              message: 'error communicating with auth server',
            })
          );
        }

        return resolve();
      }
    );
  });
};

module.exports = {
  auth: {
    strategy: 'oauth',
    scope: ['profile:ecosystem_anon_id:write'],
  },
  validate: {
    payload: {
      ecosystemAnonId: Joi.string().required(),
    },
  },
  handler: async function ecosystemAnonIdPost(req) {
    const uid = req.auth.credentials.user;
    logger.info('activityEvent', { event: 'ecosystemAnonId.post', uid: uid });

    await req.server.methods.profileCache.drop(uid);
    await updateAuthServer(req.auth.credentials, req.payload.ecosystemAnonId);

    // When DB is ready, insert/update req.payload.ecosystemAnonId.
    // For now, just notify and return.
    notifyProfileUpdated(uid);
    return {};
  },
};
