import {
  PurchaseWithDetailsOfferingContentByPlanIdsResult,
  PurchaseWithDetailsOfferingContentResult,
} from './types';

export class PurchaseWithDetailsOfferingContentUtil {
  private purchaseByPlanId: Record<
    string,
    PurchaseWithDetailsOfferingContentResult
  > = {};

  constructor(
    private rawResult: PurchaseWithDetailsOfferingContentByPlanIdsResult
  ) {
    for (const purchase of rawResult.purchaseCollection.items) {
      for (const planId of purchase.stripePlanChoices) {
        this.purchaseByPlanId[planId] = purchase;
      }
    }
  }

  purchaseWithCommonContentForPlanId(
    planId: string
  ): PurchaseWithDetailsOfferingContentResult | undefined {
    return this.purchaseByPlanId[planId];
  }

  get purchaseCollection() {
    return this.rawResult.purchaseCollection;
  }
}
