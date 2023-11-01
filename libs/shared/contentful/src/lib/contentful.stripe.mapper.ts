import { Stripe } from 'stripe';
import {
  PurchaseWithDetailsOfferingContentTransformed,
  PurchaseWithDetailsOfferingContentUtil,
} from '@fxa/shared/contentful';

export class ContentfulStripeMapper {
  private currentPlan = '';
  private nonMatchingPlans: Map<string, string> = new Map();
  constructor() {}

  private incrementNonMatchingPlans(
    stripePlan: string,
    stripeFieldName: string
  ) {
    const nonMatchingFields = this.nonMatchingPlans.get(stripePlan);
    if (nonMatchingFields) {
      this.nonMatchingPlans.set(
        stripePlan,
        nonMatchingFields.concat(`, ${stripeFieldName}`)
      );
    } else {
      this.nonMatchingPlans.set(stripePlan, stripeFieldName);
    }
  }

  mapOrError(
    stripeFieldName: string,
    stripeValue?: string,
    contentfulValue?: string | null
  ) {
    if (contentfulValue === stripeValue) {
      return contentfulValue;
    } else {
      if (!(stripeValue === undefined && contentfulValue === null)) {
        this.incrementNonMatchingPlans(this.currentPlan, stripeFieldName);
      }
      return stripeValue;
    }
  }

  mapContentfulToStripeMetadata(
    stripePlan: Stripe.Plan,
    contentfulConfig: PurchaseWithDetailsOfferingContentTransformed | undefined
  ) {
    if (!contentfulConfig) {
      this.incrementNonMatchingPlans(stripePlan.id, 'ContentfulNotFound');
      return stripePlan;
    }

    if (!stripePlan.metadata) {
      return stripePlan;
    }

    const metadata = {
      ...(stripePlan.product as Stripe.Product).metadata,
      ...stripePlan.metadata,
    };
    const commonContent = contentfulConfig.offering.commonContent;
    const purchaseDetails = contentfulConfig.purchaseDetails;

    return {
      'product:details:1': this.mapOrError(
        'product:details:1',
        metadata['product:details:1'],
        purchaseDetails.details[0]
      ),
      'product:details:2': this.mapOrError(
        'product:details:2',
        metadata['product:details:2'],
        purchaseDetails.details[1]
      ),
      'product:details:3': this.mapOrError(
        'product:details:3',
        metadata['product:details:3'],
        purchaseDetails.details[2]
      ),
      'product:details:4': this.mapOrError(
        'product:details:4',
        metadata['product:details:4'],
        purchaseDetails.details[3]
      ),
      'product:subtitle': this.mapOrError(
        'product:subtitle',
        metadata['product:subtitle'],
        purchaseDetails.subtitle
      ),
      webIconURL: this.mapOrError(
        'webIconURL',
        metadata['webIconURL'],
        purchaseDetails.webIcon
      ),
      'product:privacyNoticeURL': this.mapOrError(
        'product:privacyNoticeURL',
        metadata['product:privacyNoticeURL'],
        commonContent.privacyNoticeUrl
      ),
      'product:privacyNoticeDownloadURL': this.mapOrError(
        'product:privacyNoticeDownloadURL',
        metadata['product:privacyNoticeDownloadURL'],
        commonContent.privacyNoticeDownloadUrl
      ),
      'product:termsOfServiceURL': this.mapOrError(
        'product:termsOfServiceURL',
        metadata['product:termsOfServiceURL'],
        commonContent.termsOfServiceUrl
      ),
      'product:termsOfServiceDownloadURL': this.mapOrError(
        'product:termsOfServiceDownloadURL',
        metadata['product:termsOfServiceDownloadURL'],
        commonContent.termsOfServiceDownloadUrl
      ),
      'product:cancellationSurveyURL': this.mapOrError(
        'product:cancellationSurveyURL',
        metadata['product:cancellationSurveyURL'],
        commonContent.cancellationUrl
      ),
      emailIconURL: this.mapOrError(
        'emailIconURL',
        metadata['emailIconURL'],
        commonContent.emailIcon
      ),
      successActionButtonURL: this.mapOrError(
        'successActionButtonURL',
        metadata['successActionButtonURL'],
        commonContent.successActionButtonUrl
      ),
      'product:successActionButtonLabel': this.mapOrError(
        'product:successActionButtonLabel',
        metadata['product:successActionButtonLabel'],
        commonContent.successActionButtonLabel
      ),
      newsletterLabelTextCode: this.mapOrError(
        'newsletterLabelTextCode',
        metadata['newsletterLabelTextCode'],
        commonContent.newsletterLabelTextCode
      ),
      newsletterSlug: this.mapOrError(
        'newsletterSlug',
        metadata['newsletterSlug']?.split(',').sort().join(','),
        [...(commonContent.newsletterSlug || [])]?.sort().join(',')
      ),
    };
  }

  mapContentfulToStripePlans(
    plans: Stripe.Plan[],
    util: PurchaseWithDetailsOfferingContentUtil
  ) {
    const mappedPlans: Stripe.Plan[] = [];
    for (const plan of plans) {
      this.currentPlan = plan.id;
      const contentfulConfig =
        util.transformedPurchaseWithCommonContentForPlanId(this.currentPlan);
      const metadata = this.mapContentfulToStripeMetadata(
        plan,
        contentfulConfig
      );
      mappedPlans.push({
        ...plan,
        metadata: metadata as Stripe.Plan['metadata'],
      });
    }

    const nonMatchingPlansArray: string[] = [];
    if (this.nonMatchingPlans.size) {
      for (const [key, value] of anotherResult.nonMatchingPlans.entries()) {
        nonMatchingPlansArray.push(`${key} - ${value}`);
      }
    }

    return {
      mappedPlans,
      nonMatchingPlans: nonMatchingPlansArray,
    };
  }
}
