export interface PurchaseDetailsResult {
  details: string;
  productName: string;
  subtitle: string;
  webIcon: string;
}

export interface OfferingCommonContentResult {
  privacyNoticeUrl: string;
  privacyNoticeDownloadUrl: string;
  termsOfServiceUrl: string;
  termsOfServiceDownloadUrl: string;
  cancellationUrl: string;
  emailIcon: string;
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

export interface PurchaseWithDetailsOfferingContentByPlanIdsResult {
  purchaseCollection: {
    items: PurchaseWithDetailsOfferingContentResult[];
  };
}
