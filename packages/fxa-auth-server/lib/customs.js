/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

import axios from 'axios';
import { config } from '../config';
const localizeTimestamp =
  require('../../../libs/shared/l10n/src').localizeTimestamp({
    supportedLanguages: config.get('i18n').supportedLanguages,
    defaultLanguage: config.get('i18n').defaultLanguage,
  });
const serviceName = 'customs';

class Customs {
  constructor(url, log, error, statsd) {
    this.log = log;
    this.error = error;
    this.statsd = statsd;
    if (url !== 'none') {
      this.axiosInstance = axios.create({ baseURL: url });
    }
  }

  async makeRequest(endpoint, requestData) {
    if (!this.axiosInstance) {
      return;
    }

    try {
      const response = await this.axiosInstance.post(endpoint, requestData);
      return response.data;
    } catch (err) {
      if (err.errno > -1 || (err.statusCode && err.statusCode < 500)) {
        throw err;
      } else {
        throw this.error.backendServiceFailure(
          serviceName,
          'POST',
          { method: 'POST', path: endpoint },
          err
        );
      }
    }
  }

  async check(request, email, action) {
    const result = await this.makeRequest('/check', {
      ...this.sanitizePayload({
        ip: request.app.clientAddress,
        email,
        action,

        // Payload in this case is additional user related data (ie phone number)
        payload: this.sanitizePayload(request.payload),

        // Headers and query params are used only in the `check` endpoint to
        // verify request is from a real user
        query: request.query,
        headers: request.headers,
      }),
    });

    this.optionallyReportStatsD('request.check', action, result);
    return this.handleCustomsResult(request, result);
  }

  async checkAuthenticated(request, uid, action) {
    const result = await this.makeRequest('/checkAuthenticated', {
      ...this.sanitizePayload({
        action,
        ip: request.app.clientAddress,
        uid,
      }),
    });

    this.optionallyReportStatsD('request.checkAuthenticated', action, result);
    return this.handleCustomsResult(request, result);
  }

  async checkIpOnly(request, action) {
    const result = await this.makeRequest('/checkIpOnly', {
      ...this.sanitizePayload({
        action,
        ip: request.app.clientAddress,
      }),
    });

    this.optionallyReportStatsD('request.checkIpOnly', action, result);
    return this.handleCustomsResult(request, result);
  }

  async flag(ip, info) {
    await this.makeRequest('/failedLoginAttempt', {
      ...this.sanitizePayload({
        ip,
        email: info.email,
        errno: info.errno || this.error.ERRNO.UNEXPECTED_ERROR,
      }),
    });
  }

  async reset(email) {
    await this.makeRequest('/passwordReset', {
      ...this.sanitizePayload({ email }),
    });
  }

  /**
   * Remove sensitive fields from the payload before sending to customs.
   *
   * @param payload
   * @return {*}
   */
  sanitizePayload(payload) {
    if (!payload) {
      return;
    }

    const clonePayload = { ...payload };
    const fieldsToOmit = ['authPW', 'oldAuthPW', 'paymentToken'];
    fieldsToOmit.forEach((name) => delete clonePayload[name]);

    return clonePayload;
  }

  optionallyReportStatsD(name, action, options = {}) {
    if (!options) {
      return;
    }

    if (this.statsd) {
      const tags = { action, block: options.block, ...options };
      this.statsd.increment(`${serviceName}.${name}`, tags);
    }
  }

  handleCustomsResult(request, result) {
    if (!result) {
      return;
    }

    if (result.suspect) {
      request.app.isSuspiciousRequest = true;
    }

    if (result.block) {
      // Log a flow event that the user got blocked.
      request.emitMetricsEvent('customs.blocked');
      const unblock = !!result.unblock;

      if (result.retryAfter) {
        // Create a localized retryAfterLocalized value from retryAfter.
        // For example '713' becomes '12 minutes' in English.
        const retryAfterLocalized = localizeTimestamp.format(
          Date.now() + result.retryAfter * 1000,
          request.headers['accept-language']
        );

        throw this.error.tooManyRequests(
          result.retryAfter,
          retryAfterLocalized,
          unblock
        );
      }

      throw this.error.requestBlocked(unblock);
    }
  }
}

module.exports = Customs;
