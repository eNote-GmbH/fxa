import {
  PurchaseDetailsResult,
  PurchaseDetailsTransformed,
  PurchaseWithDetailsOfferingContentByPlanIdsResult,
  PurchaseWithDetailsOfferingContentTransformed,
} from './types';

export class PurchaseWithDetailsOfferingContentUtil {
  private transformedPurchaseByPlanId: Record<
    string,
    PurchaseWithDetailsOfferingContentTransformed
  > = {};

  constructor(
    private rawResult: PurchaseWithDetailsOfferingContentByPlanIdsResult
  ) {
    for (const purchase of rawResult.purchaseCollection.items) {
      const transformedPurchaseDetails = this.purchaseDetailsTransform(
        purchase.purchaseDetails
      );
      for (const planId of purchase.stripePlanChoices) {
        this.transformedPurchaseByPlanId[planId] = {
          ...purchase,
          purchaseDetails: transformedPurchaseDetails,
        };
      }
    }
  }

  private transformPurchaseDetails(details: string): string[] {
    return details.split('\n').filter((detail) => !!detail);
  }

  purchaseDetailsTransform(
    purchaseDetails: PurchaseDetailsResult
  ): PurchaseDetailsTransformed {
    return {
      ...purchaseDetails,
      details: this.transformPurchaseDetails(purchaseDetails.details),
    };
  }

  transformedPurchaseWithCommonContentForPlanId(
    planId: string
  ): PurchaseWithDetailsOfferingContentTransformed | undefined {
    return this.transformedPurchaseByPlanId[planId];
  }

  get purchaseCollection() {
    return this.rawResult.purchaseCollection;
  }
}
