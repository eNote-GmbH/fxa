/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

export type ResumeTokenType = {
  email?: string;
  deviceId?: string;
  flowId?: string;
  flowBegin?: string;
  entrypoint?: string;
  entrypointExperiment?: string;
  entrypointVariation?: string;
  resetPasswordConfirm?: boolean;
  style?: string;
  scope?: string;
  state?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmMedium?: string;
  utmSource?: string;
  utmTerm?: string;
};

/**
 * A base64 encoded version of the resume token
 * @param opts - Set of optional data to hold in the resume token
 * @returns Base64 encoded json string
 */
export function createResumeToken(opts: ResumeTokenType) {
  const token = {
    email: opts.email,
    entrypoint: opts.entrypoint,
    entrypointExperiment: opts.entrypointExperiment,
    entrypointVariation: opts.entrypointVariation,
    resetPasswordConfirm: opts.resetPasswordConfirm,
    style: opts.style,
    utmCampaign: opts.utmCampaign,
    utmContent: opts.utmContent,
    utmMedium: opts.utmMedium,
    utmSource: opts.utmSource,
    utmTerm: opts.utmTerm,
    deviceId: opts.deviceId,
    flowId: opts.flowId,
    flowBegin: opts.flowBegin,
    scope: opts.scope,
    state: opts.state,
  };

  return Buffer.from(JSON.stringify(token)).toString('base64');
}

/**
 * Decodes the resume token back into it's original state
 * @param token
 * @returns A resume token
 */
export function parseResumeToken(token: string) {
  const raw = Buffer.from(token, 'base64').toString();
  const obj: ResumeTokenType = JSON.parse(raw);
  return obj;
}
