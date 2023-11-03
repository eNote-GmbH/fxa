export interface PurchaseDetailsResult {
  details: string;
  productName: string;
  subtitle: string | null;
  webIcon: string;
}

export interface PurchaseDetailsTransformed
  extends Omit<PurchaseDetailsResult, 'details'> {
  details: string[];
}

export interface OfferingCommonContentResult {
  privacyNoticeUrl: string;
  privacyNoticeDownloadUrl: string;
  termsOfServiceUrl: string;
  termsOfServiceDownloadUrl: string;
  cancellationUrl: string | null;
  emailIcon: string | null;
  successActionButtonUrl: string;
  successActionButtonLabel: string;
  newsletterLabelTextCode: string;
  newsletterSlug: string[];
}

export interface PurchaseOfferingResult {
  stripeProductId: string;
  commonContent: OfferingCommonContentResult;
}

export interface PurchaseWithDetailsOfferingContentResult {
  stripePlanChoices: string[];
  purchaseDetails: PurchaseDetailsResult;
  offering: PurchaseOfferingResult;
}

export interface PurchaseWithDetailsOfferingContentTransformed
  extends Omit<PurchaseWithDetailsOfferingContentResult, 'purchaseDetails'> {
  purchaseDetails: PurchaseDetailsTransformed;
}

export interface PurchaseWithDetailsOfferingContentByPlanIdsResult {
  purchaseCollection: {
    items: PurchaseWithDetailsOfferingContentResult[];
  };
}
