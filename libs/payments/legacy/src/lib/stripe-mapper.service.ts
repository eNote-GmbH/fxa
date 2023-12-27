import { Stripe } from 'stripe';
import { ContentfulManager } from '@fxa/shared/contentful';
import { PlanMapperUtil } from './plan-mapper.util';

/**
 * Class to fetch Contentful config and map Contentful config to
 * Stripe metadata for an array of Stripe Plans.
 */
export class StripeMapperService {
  private errorIds = new Map<string, Set<string>>();
  private successfulIds = new Set();
  constructor(private contentfulManager: ContentfulManager) {}

  /**
   *  TypeGuard to ensure product on plan is a Product Object
   */
  private isProductObject(
    product: Stripe.Plan['product']
  ): product is Stripe.Product {
    if (typeof product !== 'string' && product && !product.deleted) {
      return true;
    } else {
      return false;
    }
  }

  private addErrorFields(id: string, messages: string[]) {
    // First check if ID is already in success Map. If it is, do not log.
    if (this.successfulIds.has(id)) {
      return;
    }
    // Limit to 1 message per productId
    const errorIdValue = this.errorIds.get(id) || new Set<string>();
    messages.forEach((message) => errorIdValue.add(message));
    this.errorIds.set(id, errorIdValue);
  }

  private addSuccessfulIds(id: string) {
    //Add success
    this.successfulIds.add(id);
    //Remove error
    this.errorIds.delete(id);
  }

  private getErrorMessages() {
    const errorMessages: string[] = [];

    this.errorIds.forEach((messages, id) => {
      errorMessages.push(`${id} - ${[...messages].join(', ')}`);
    });

    return errorMessages;
  }

  /**
   * Merge Contentful config and Stripe metadata and assign to
   * plan and product metadata fields
   */
  async mapContentfulToStripePlans(
    plans: Stripe.Plan[],
    acceptLanguage: string
  ) {
    const mappedPlans: Stripe.Plan[] = [];
    const validPlanIds = plans.map((plan) => plan.id);

    const contentfulConfigUtil =
      await this.contentfulManager.getPurchaseWithDetailsOfferingContentByPlanIds(
        validPlanIds,
        acceptLanguage
      );

    for (const plan of plans) {
      if (!this.isProductObject(plan.product)) {
        mappedPlans.push(plan);
        this.addErrorFields(plan.id, ['Plan product not expanded']);
        continue;
      }

      const mergedStripeMetadata = {
        ...plan.product.metadata,
        ...plan.metadata,
      };

      const contentfulConfigData =
        contentfulConfigUtil.transformedPurchaseWithCommonContentForPlanId(
          plan.id
        );

      if (!contentfulConfigData) {
        mappedPlans.push(plan);
        this.addErrorFields(plan.id, ['No Contentful config']);
        continue;
      }

      const {
        offering: { commonContent },
        purchaseDetails,
      } = contentfulConfigData;

      const planMapper = new PlanMapperUtil(
        commonContent,
        purchaseDetails,
        mergedStripeMetadata
      );

      const { metadata, errorFields } = planMapper.mergeStripeAndContentful();

      mappedPlans.push({
        ...plan,
        metadata: {
          ...plan.metadata,
          ...metadata,
        },
        product: {
          ...plan.product,
          metadata: {
            ...plan.product.metadata,
            ...metadata,
          },
        },
      });

      if (errorFields.length) {
        this.addErrorFields(plan.product.id, errorFields);
      } else {
        this.addSuccessfulIds(plan.product.id);
      }
    }

    return {
      mappedPlans,
      nonMatchingPlans: this.getErrorMessages(),
    };
  }
}
