/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { ConfigType } from '../../../config';
import { createAccountsEventsEvent } from './server_events';
import { version } from '../../../package.json';
import { createHash } from 'crypto';
import { AuthRequest } from '../../types';
import * as AppError from '../../error';
import { clientId as clientIdValidator } from '../../oauth/validators';

// According to @types/hapi, request.auth.credentials.user is of type
// UserCredentials, which is just {}. That's not actually the case and it
// mismatches the real type, which is string.  I extended AuthRequest below but
// the type, MetricsRquest is for this file only.
interface MetricsRequest extends Omit<AuthRequest, 'auth'> {
  payload: Record<string, any>;
  auth: { credentials: Record<string, string> };
}

type MetricsData = {
  uid?: string;
  reason?: string;
  oauthClientId?: string;
  syncDeviceId?: string;
};

type GleanEventFnOptions = {
  // for certain events, passing in the "client" ip address isn't helpful since
  // the client in question is a service from an RP
  skipClientIp?: boolean;
};

type ErrorLoggerFnParams = {
  glean: ReturnType<typeof gleanMetrics>;
  request: AuthRequest;
  error: AppError;
};

let appConfig: ConfigType;
let gleanEventLogger: ReturnType<typeof createAccountsEventsEvent>;

const isEnabled = async (request: MetricsRequest) =>
  appConfig.gleanMetrics.enabled && (await request.app.isMetricsEnabled);

const findUid = (request: MetricsRequest, metricsData?: MetricsData): string =>
  metricsData?.uid ||
  request.auth?.credentials?.uid ||
  request.auth?.credentials?.user ||
  '';

const sha256HashUid = (uid: string) =>
  createHash('sha256').update(uid).digest('hex');

const findServiceName = async (request: MetricsRequest) => {
  const metricsContext = await request.app.metricsContext;
  return metricsContext.service || '';
};

const findOauthClientId = async (
  request: MetricsRequest,
  metricsData?: MetricsData
): Promise<string> => {
  const clientId =
    metricsData?.oauthClientId ||
    request.auth.credentials?.client_id ||
    request.payload?.client_id;

  // for OAuth the content-server places the client id into the service
  // property for metrics, so we'll check that value for something shaped like
  // an oauth id
  const clientIdInService = async () => {
    const service = await findServiceName(request);
    const { error } = clientIdValidator.validate(service);

    if (!error) {
      return service;
    }

    return null;
  };

  return clientId || (await clientIdInService()) || '';
};

const createEventFn =
  // On MetricsData: for an event like successful login, the uid isn't known at
  // the time of request since the request itself isn't authenticated.  We'll
  // accept data from the event logging call for metrics that are known/easily
  // accessible in the calling scope but difficult/not possible to get from any
  // context attached to the request.


    (eventName: string, options?: GleanEventFnOptions) =>
    async (req: AuthRequest, metricsData?: MetricsData) => {
      // where the function is called the request object is likely to be declared
      // to be AuthRequest, so we do a cast here.
      const request = req as unknown as MetricsRequest;
      const enabled = await isEnabled(request);
      if (!enabled) {
        return;
      }

      const metricsContext = await request.app.metricsContext;

      const metrics = {
        user_agent: request.headers['user-agent'],
        ip_address:
          options?.skipClientIp === true ? '' : request.app.clientAddress,
        account_user_id_sha256: '',
        event_name: eventName,
        event_reason: metricsData?.reason || '',
        relying_party_oauth_client_id: await findOauthClientId(
          request,
          metricsData
        ),
        relying_party_service: await findServiceName(request),
        session_device_type: request.app.ua.deviceType || '',
        session_entrypoint: metricsContext.entrypoint || '',
        session_flow_id: metricsContext.flowId || '',
        session_sync_device_id: metricsData?.syncDeviceId || '',
        utm_campaign: metricsContext.utmCampaign || '',
        utm_content: metricsContext.utmContent || '',
        utm_medium: metricsContext.utmMedium || '',
        utm_source: metricsContext.utmSource || '',
        utm_term: metricsContext.utmTerm || '',
      };

      // uid needs extra handling because we need to hash the value
      const uid = findUid(request, metricsData);
      if (uid !== '') {
        metrics.account_user_id_sha256 = sha256HashUid(uid);
      }

      await gleanEventLogger.record(metrics);
    };

export function gleanMetrics(config: ConfigType) {
  appConfig = config;
  gleanEventLogger = createAccountsEventsEvent({
    applicationId: config.gleanMetrics.applicationId,
    appDisplayVersion: version,
    channel: config.gleanMetrics.channel,
    logger_options: { app: config.gleanMetrics.loggerAppName },
  });

  return {
    registration: {
      accountCreated: createEventFn('reg_acc_created'),
      confirmationEmailSent: createEventFn('reg_email_sent'),
      accountVerified: createEventFn('reg_acc_verified'),
      complete: createEventFn('reg_complete'),
      error: createEventFn('reg_submit_error'),
    },

    login: {
      success: createEventFn('login_success'),
      error: createEventFn('login_submit_backend_error'),
      totpSuccess: createEventFn('login_totp_code_success'),
      totpFailure: createEventFn('login_totp_code_failure'),
      recoveryCodeSuccess: createEventFn('login_backup_code_success'),
      verifyCodeEmailSent: createEventFn('login_email_confirmation_sent'),
      verifyCodeConfirmed: createEventFn('login_email_confirmation_success'),
      complete: createEventFn('login_complete'),
    },

    resetPassword: {
      emailSent: createEventFn('password_reset_email_sent'),
      createNewSuccess: createEventFn('password_reset_create_new_success'),
      accountReset: createEventFn('account_password_reset'),
      recoveryKeySuccess: createEventFn('password_reset_recovery_key_success'),

      recoveryKeyCreatePasswordSuccess: createEventFn(
        'password_reset_recovery_key_create_success'
      ),
    },

    oauth: {
      tokenCreated: createEventFn('access_token_created'),
      tokenChecked: createEventFn('access_token_checked', {
        skipClientIp: true,
      }),
    },
  };
}

const routePathToErrorPingFnMap = {
  '/account/create': 'registration.error',
  '/account/login': 'login.error',
};

const getPingFnWithPath = (path: string) =>
  Object.entries(routePathToErrorPingFnMap)
    .find(([k, _]) => path.endsWith(k))
    ?.at(1);

export const logErrorWithGlean = ({
  glean,
  request,
  error,
}: ErrorLoggerFnParams) => {
  const pingFn = getPingFnWithPath(request.path);
  if (pingFn) {
    const [funnel, event] = pingFn.split('.');
    const funnelFns =
      glean[
        funnel as keyof Omit<
          ReturnType<typeof gleanMetrics>,
          'resetPassword' | 'oauth'
        >
      ];
    funnelFns[event as keyof typeof funnelFns](request, {
      // we use the errno's key here because the human readable error message
      // can be too verbose, while the short error title is too low resolution
      // since some errors are grouped under the same title (e.g. "Bad
      // Request")
      reason: AppError.mapErrnoToKey(error),
    });
  }
};
