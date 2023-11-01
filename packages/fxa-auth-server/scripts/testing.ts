//  async allAbbrevPlans(acceptLanguage = 'en'): Promise<AbbrevPlan[]> {
//     const plans = await this.allConfiguredPlans();
//     const validPlans: (Stripe.Plan | ConfiguredPlan)[] = [];
//     const validPlanIds: Stripe.Plan['id'][] = [];

//     for (const p of plans) {
//       // @ts-ignore: depending the SUBSCRIPTIONS_FIRESTORE_CONFIGS_ENABLED feature flag, p can be a Stripe.Plan, which does not have a `configuration`
//       if (p.configuration || (await this.validatePlan(p))) {
//         validPlans.push(p);
//         validPlanIds.push(p.id);
//       }
//     }

//     // Fetch data from Contentful for validPlanIds
//     // To be completed by FXA-8537
//     // Use mock data till then
//     interface PurchaseDetailsWithOfferingContent {
//       stripePlanId: string;
//       stripeProductId: string;
//       purchaseDetails: {
//         details: string;
//         productName: string;
//         subtitle: string;
//         webIcon: string;
//       };
//       commonContent: {
//         privacyNoticeUrl: string;
//         privacyNoticeDownloadUrl: string;
//         termsOfServiceUrl: string;
//         termsOfServiceDownloadUrl: string;
//         cancellationUrl: string;
//         emailIcon: string;
//         successActionButtonUrl: string;
//         successActionButtonLabel: string;
//         newsletterLabelTextCode: string;
//         newsletterSlug: string;
//       };
//     }

//     const contentfulData: PurchaseDetailsWithOfferingContent[] = [];
//     const plan = validPlans[0];
//     const contentful = contentfulData[0];

//     // Merge plan.metadata and product.metadata into product.metadata
//     // Delete plan.metadata
//     const product_metadata = {
//       ...(plan.product as Stripe.Product).metadata,
//       ...plan.metadata,
//     };

//     const contentfulMetadata = product_metadata;

//     contentfulMetadata['product:details:1'] =
//       contentful.purchaseDetails.details;
//     contentfulMetadata['product:details:2'] =
//       contentful.purchaseDetails.details;
//     contentfulMetadata['product:details:3'] =
//       contentful.purchaseDetails.details;
//     contentfulMetadata['product:details:4'] =
//       contentful.purchaseDetails.details;
//     contentfulMetadata['product:subtitle'] =
//       contentful.purchaseDetails.subtitle;
//     contentfulMetadata['webIconURL'] = contentful.purchaseDetails.webIcon;
//     contentfulMetadata['product:privacyNoticeURL'] =
//       contentful.commonContent.privacyNoticeUrl;
//     contentfulMetadata['product:privacyNoticeDownloadURL'] =
//       contentful.commonContent.privacyNoticeDownloadUrl;
//     contentfulMetadata['product:termsOfServiceURL'] =
//       contentful.commonContent.termsOfServiceUrl;
//     contentfulMetadata['product:termsOfServiceDownloadURL'] =
//       contentful.commonContent.termsOfServiceDownloadUrl;
//     contentfulMetadata['cancellationUrl'] =
//       contentful.commonContent.cancellationUrl;
//     contentfulMetadata['product:emailIconURL'] =
//       contentful.commonContent.emailIcon;
//     contentfulMetadata['successActionButtonURL'] =
//       contentful.commonContent.successActionButtonUrl;
//     contentfulMetadata['product:successActionButtonLabel'] =
//       contentful.commonContent.successActionButtonLabel;
//     contentfulMetadata['newsletterLabelTextCode'] =
//       contentful.commonContent.newsletterLabelTextCode;
//     contentfulMetadata['newsletterSlug'] =
//       contentful.commonContent.newsletterSlug;

//     // Map Contenful data onto product.metadata
//     // If Contentful data doesn't match
//     // Then return Stripe metadata, and log fields that don't match

//     // Return product.metadata

//     return validPlans.map((p) => ({
//       amount: p.amount,
//       currency: p.currency,
//       interval_count: p.interval_count,
//       interval: p.interval,
//       plan_id: p.id,
//       plan_metadata: p.metadata,
//       plan_name: p.nickname || '',
//       product_id: (p.product as Stripe.Product).id,
//       product_metadata: (p.product as Stripe.Product).metadata,
//       product_name: (p.product as Stripe.Product).name,
//       active: p.active,
//       // TODO simply copy p.configuration below when remove the SUBSCRIPTIONS_FIRESTORE_CONFIGS_ENABLED feature flag
//       // @ts-ignore: depending the SUBSCRIPTIONS_FIRESTORE_CONFIGS_ENABLED feature flag, p can be a Stripe.Plan, which does not have a `configuration`
//       configuration: p.configuration ?? null,
//     }));
//   }
