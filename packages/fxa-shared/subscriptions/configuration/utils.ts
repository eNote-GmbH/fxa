/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import parser from 'accept-language-parser';

import { CapabilityManager } from '@fxa/payments/capability';

import {
  DEFAULT_PRODUCT_DETAILS,
  metadataFromPlan,
  productDetailsFromPlan,
} from '../metadata';
import { AbbrevPlan, Plan, SubscriptionEligibilityResult } from '../types';
import { MergedPlanConfig, PlanConfig } from './plan';
import { ProductConfig, ProductConfigLocalesConfig } from './product';
import {
  EligibilityManager,
  IntervalComparison,
  OfferingComparison,
  intervalComparison,
} from '../../../../libs/payments/eligibility/src';
import assert from 'assert';

const DEFAULT_LOCALE = 'en';

/**
 * Build a "complete" config from merging the product's config into the plan's
 * config.  The plan's config values have a high precedence.
 */
export const mergeConfigs = (
  planConfig: PlanConfig,
  productConfig: ProductConfig
): MergedPlanConfig => ({
  ...planConfig,

  capabilities: {
    ...productConfig.capabilities,
    ...planConfig.capabilities,
  },
  urls: { ...productConfig.urls, ...planConfig.urls },
  uiContent: { ...productConfig.uiContent, ...planConfig.uiContent },
  styles: { ...productConfig.styles, ...planConfig.styles },
  locales: { ...productConfig.locales, ...planConfig.locales },
  support: { ...productConfig.support, ...planConfig.support },
  productSet: planConfig.productSet || productConfig.productSet,
  promotionCodes: [
    ...new Set([
      ...(productConfig.promotionCodes || []),
      ...(planConfig.promotionCodes || []),
    ]),
  ],
});

export const mapPlanConfigsByPriceId = (configs: PlanConfig[]) =>
  configs.reduce(
    (acc: { [key: string]: PlanConfig }, planConfig: PlanConfig) => {
      if (planConfig.stripePriceId) {
        acc[planConfig.stripePriceId] = planConfig;
      }
      return acc;
    },
    {}
  );

/**
 * Return the best matched localized localizable configuration values.
 * Otherwise return the default from the plan config.  Any missing value will
 * fall back to the default.
 */
export const localizedPlanConfig = (
  planConfig: Readonly<PlanConfig>,
  userLocales: string[]
) => {
  const planConfigLocales = Object.keys(planConfig.locales || {});
  const defaults = {
    uiContent: planConfig.uiContent,
    urls: planConfig.urls,
    support: planConfig.support,
  };

  if (!planConfigLocales.length || !userLocales.length) {
    return defaults;
  }

  if (!planConfigLocales.includes(DEFAULT_LOCALE)) {
    planConfigLocales.push(DEFAULT_LOCALE);
  }

  const pickedLang = parser.pick(planConfigLocales, userLocales.join(','));

  if (pickedLang && pickedLang !== DEFAULT_LOCALE) {
    const localizedConfigs = planConfig.locales![pickedLang];

    return {
      uiContent: { ...defaults.uiContent, ...localizedConfigs.uiContent },
      urls: { ...defaults.urls, ...localizedConfigs.urls },
      support: { ...defaults.support, ...localizedConfigs.support },
    };
  }

  return defaults;
};

export const getPlanProductConfig = (plan: Plan) => {
  const configuration = plan.configuration;

  if (!configuration) {
    throw new Error(`Plan configuration for ${plan.plan_id} not found.`);
  }

  return configuration;
};

export const flattenProductConfigLocalesData = (
  plan: Plan,
  userLocales: readonly string[] = [DEFAULT_LOCALE]
) => {
  let output: ProductConfigLocalesConfig;

  const planConfiguration = getPlanProductConfig(plan);

  const availableLocales =
    (planConfiguration.locales && Object.keys(planConfiguration.locales)) || [];
  availableLocales.push(DEFAULT_LOCALE);
  const selectedLocale = parser.pick(availableLocales, userLocales.join(','));

  output = {
    uiContent: planConfiguration.uiContent,
    urls: planConfiguration.urls,
    support: planConfiguration.support,
  };

  if (
    planConfiguration.locales &&
    selectedLocale &&
    planConfiguration.locales[selectedLocale]
  ) {
    const localesConfig = planConfiguration.locales[selectedLocale];
    output = {
      uiContent: {
        ...output.uiContent,
        ...localesConfig.uiContent,
      },
      urls: {
        ...output.urls,
        ...localesConfig.urls,
      },
      support: {
        ...output.support,
        ...localesConfig.support,
      },
    };
  }

  return output;
};

export const urlsFromProductConfig = (
  plan: Plan,
  userLocales: readonly string[] = [DEFAULT_LOCALE],
  useFirestoreProductConfigs: boolean
) => {
  if (useFirestoreProductConfigs) {
    return flattenProductConfigLocalesData(plan, userLocales).urls;
  } else {
    const planMetadataConfig = productDetailsFromPlan(plan, userLocales);

    return {
      termsOfService:
        planMetadataConfig.termsOfServiceURL ||
        DEFAULT_PRODUCT_DETAILS.termsOfServiceURL!,
      termsOfServiceDownload:
        planMetadataConfig.termsOfServiceDownloadURL ||
        DEFAULT_PRODUCT_DETAILS.termsOfServiceDownloadURL!,
      privacyNotice:
        planMetadataConfig.privacyNoticeURL ||
        DEFAULT_PRODUCT_DETAILS.privacyNoticeURL!,
      privacyNoticeDownload:
        planMetadataConfig.privacyNoticeDownloadURL ||
        DEFAULT_PRODUCT_DETAILS.privacyNoticeDownloadURL!,
      cancellationSurvey: planMetadataConfig.cancellationSurveyURL,
      successActionButton:
        plan.product_metadata?.successActionButtonURL ||
        plan.plan_metadata?.successActionButtonURL ||
        plan.product_metadata?.downloadURL ||
        plan.plan_metadata?.downloadURL,
    };
  }
};

export const webIconConfigFromProductConfig = (
  plan: Plan,
  userLocales: readonly string[] = [DEFAULT_LOCALE],
  useFirestoreProductConfigs: boolean
) => {
  if (useFirestoreProductConfigs) {
    const planConfiguration = getPlanProductConfig(plan);
    const urls = flattenProductConfigLocalesData(plan, userLocales).urls;

    return {
      webIcon: urls.webIcon,
      webIconBackground: planConfiguration.styles?.webIconBackground,
    };
  } else {
    const combinedMetadata = metadataFromPlan(plan);

    return {
      webIcon: combinedMetadata.webIconURL,
      webIconBackground: combinedMetadata.webIconBackground,
    };
  }
};

export const uiContentFromProductConfig = (
  plan: Plan,
  userLocales: readonly string[] = [DEFAULT_LOCALE],
  useFirestoreProductConfigs: boolean
) => {
  if (useFirestoreProductConfigs) {
    return flattenProductConfigLocalesData(plan, userLocales).uiContent;
  } else {
    const metadata = metadataFromPlan(plan);
    const detailsFromPlan = productDetailsFromPlan(plan, userLocales);

    return {
      name: detailsFromPlan.name,
      subtitle: detailsFromPlan.subtitle,
      details: detailsFromPlan.details,
      successActionButtonLabel: detailsFromPlan.successActionButtonLabel,
      upgradeCTA: metadata.upgradeCTA,
    };
  }
};

export const productUpgradeFromProductConfig = (
  plan: Plan,
  useFirestoreProductConfigs: boolean
) => {
  if (useFirestoreProductConfigs) {
    const { productOrder, productSet } = getPlanProductConfig(plan);
    return {
      productOrder:
        (productOrder !== undefined && `${productOrder}`) || undefined,
      productSet: productSet,
    };
  } else {
    const metadata = metadataFromPlan(plan);
    return {
      productOrder: metadata.productOrder,
      productSet: metadata.productSet,
    };
  }
};

export const eligibilityFromCapabilityManager = async (
  eligibilityManager: EligibilityManager,
  stripeSubscribedPlans: AbbrevPlan[],
  iapSubscribedPlans: AbbrevPlan[],
  targetPlan: AbbrevPlan
) => {
  const iapPlanIds = iapSubscribedPlans.map((p) => p.plan_id);
  const planIds = [
    ...stripeSubscribedPlans.map((p) => p.plan_id),
    ...iapPlanIds,
  ];
  const overlaps = await eligibilityManager.getOfferingOverlap(
    planIds,
    [],
    targetPlan.plan_id
  );
  if (!overlaps.length)
    return [SubscriptionEligibilityResult.CREATE, undefined];
  if (
    overlaps.some(
      (overlap) =>
        overlap.type === 'plan' && iapPlanIds.includes(overlap.planId)
    )
  )
    return [SubscriptionEligibilityResult.BLOCKED_IAP, undefined];
  if (overlaps.length > 1)
    return [SubscriptionEligibilityResult.INVALID, undefined];
  const overlap = overlaps[0];
  assert(
    overlap.type === 'plan',
    'Unexpected overlap type, only plans are compared.'
  );
  if (overlap.comparison === OfferingComparison.DOWNGRADE)
    return [SubscriptionEligibilityResult.DOWNGRADE, overlap.planId];
  const existingPlan = stripeSubscribedPlans.find(
    (p) => p.plan_id === overlap.planId
  );
  if (!existingPlan || existingPlan.plan_id === targetPlan.plan_id)
    return [SubscriptionEligibilityResult.INVALID, undefined];

  const fromPlan = stripeSubscribedPlans.find(
    (p) => p.plan_id === overlap.planId
  );
  if (!fromPlan) return [SubscriptionEligibilityResult.INVALID, undefined];

  if (
    intervalComparison(
      { unit: fromPlan.interval, count: fromPlan.interval_count },
      { unit: targetPlan.interval, count: targetPlan.interval_count }
    ) === IntervalComparison.SHORTER
  ) {
    return [SubscriptionEligibilityResult.DOWNGRADE, overlap.planId];
  }
  return [SubscriptionEligibilityResult.UPGRADE, overlap.planId];
};
