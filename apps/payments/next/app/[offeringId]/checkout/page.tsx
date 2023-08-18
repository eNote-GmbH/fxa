import { PlanDetails, TermsAndPrivacy } from '@fxa/payments/next-ui';
import Stripe from 'stripe';

type PlanInterval = Stripe.Plan['interval']; // TODO - Replace once FXA-7507 lands

const PRICE_INFO = {
  listPrice: 500,
  taxAmount: 25,
  totalPrice: 525,
  currency: 'usd',
  interval: 'month' as PlanInterval, // TODO - Replace once FXA-7507 lands
  intervalCount: 1,
};

const CONTENTFUL_CONFIGURATION = {
  details: ['Detail 1', 'Detail 2'],
  subtitle: 'The best product',
  productName: 'Product Name',
};

const CONTENTFUL_LINKS = {
  productName: 'Product Name',
  termsOfService: 'https://accounts.stage.mozaws.net/legal/privacy',
  termsOfServiceDownload:
    'https://payments-stage.fxa.nonprod.cloudops.mozgcp.net/legal-docs?url=https://accounts-static.cdn.mozilla.net/legal/subscription_services_tos',
  privacyNotice: 'https://www.mozilla.org/privacy/subscription-services',
};

export default async function Index() {
  return (
    <>
      <div className="page-title-container">Under Construction</div>
      <div className="payment-panel">
        <PlanDetails
          priceInfo={PRICE_INFO}
          contentfulConfiguration={CONTENTFUL_CONFIGURATION}
        />
      </div>
      <div className="component-card border-t-0 min-h-full mb-6 pt-4 px-4 pb-14 rounded-t-lg text-grey-600 tablet:rounded-t-none desktop:px-12 desktop:pb-12">
        <div className="h-[640px] flex items-center justify-center">
          Section Under Construction
        </div>
        <TermsAndPrivacy
          paymentProvider={'stripe'}
          contentfulContentLinks={CONTENTFUL_LINKS}
          showFXALinks={true}
        />
      </div>
    </>
  );
}
