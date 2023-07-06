/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import Joi from 'joi';

export const capabilitiesClientIdPattern = /^capabilities/;

export const legalResourceDomainPattern =
  /^https:\/\/accounts-static\.cdn\.mozilla\.net\/legal\/(.*)/;

export const subscriptionProductMetadataBaseValidator = Joi.object({
  webIconURL: Joi.string().uri().required(),
  upgradeCTA: Joi.string().optional(),
  successActionButtonURL: Joi.string().uri().required(),
  appStoreLink: Joi.string().uri().optional(),
  playStoreLink: Joi.string().uri().optional(),
  newsletterSlug: Joi.string()
    .optional()
    .valid('security-privacy-news', 'hubs', 'mdnplus'),
  newsletterString: Joi.string()
    .optional()
    .valid('mozilla', 'snp', 'hubs', 'mdnplus'),
  productSet: Joi.string().required(),
  productOrder: Joi.number().optional(),
  'product:termsOfServiceDownloadURL': Joi.string()
    .regex(legalResourceDomainPattern)
    .required(),
  'product:termsOfServiceURL': Joi.string().uri().required(),
  'product:privacyNoticeDownloadURL': Joi.string()
    .regex(legalResourceDomainPattern)
    .optional(),
  'product:privacyNoticeURL': Joi.string().uri().required(),
  'product:cancellationSurveyURL': Joi.string().uri().optional(),
})
  .pattern(capabilitiesClientIdPattern, Joi.string())
  .unknown(true);
