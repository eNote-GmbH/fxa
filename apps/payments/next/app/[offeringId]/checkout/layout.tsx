import { PurchaseDetails, TermsAndPrivacy } from '@fxa/payments/ui/server';
import { getBundle, getLocaleFromRequest } from '@fxa/shared/l10n';

import Image from 'next/image';
import { headers } from 'next/headers';

import { getCartData, getContentfulContent } from '../../_lib/apiClient';
import checkLogo from '../../../images/check.svg';

// TODO - Replace these placeholders as part of FXA-8227
export const metadata = {
  title: 'Mozilla accounts',
  description: 'Mozilla accounts',
};

export interface CheckoutParams {
  offeringId: string;
  cartId: string;
}

export interface CheckoutSearchParams {
  interval?: string;
  promotion_code?: string;
  experiment?: string;
  locale?: string;
}

export default async function RootLayout({
  children,
  params,
  searchParams = { locale: 'en' },
}: {
  children: React.ReactNode;
  params: CheckoutParams;
  searchParams: CheckoutSearchParams;
}) {
  const headersList = headers();
  const locale = getLocaleFromRequest(
    searchParams,
    headersList.get('accept-language')
  );

  const contentfulData = getContentfulContent(params.offeringId, locale);
  const cartData = getCartData(params.cartId);
  const [contentful, cart] = await Promise.all([contentfulData, cartData]);
  const l10n = await getBundle([locale]);
  return (
    <>
      <header className="page-title-container">
        <h1 className="page-header">
          {/* {l10n.getMessage('subscription-success-title')?.value?.toString() ||
            'Subscription confirmation'} */}
          {/* Subscription confirmation */}
          Under Construction
        </h1>
        <div className="page-subheader">
          <Image src={checkLogo} alt="" />
          <span className="page-subheader-text">
            {l10n.getMessage('sub-guarantee')?.value?.toString() ||
              '30-day money-back guarantee'}
          </span>
        </div>
      </header>

      <section className="payment-panel" aria-label="Purchase details">
        <PurchaseDetails
          locale={locale}
          interval={cart.interval}
          invoice={cart.nextInvoice}
          purchaseDetails={contentful.purchaseDetails}
        />
      </section>

      <div className="page-body rounded-t-lg tablet:rounded-t-none">
        {children}

        <TermsAndPrivacy
          locale={'en'}
          {...cart}
          {...contentful.commonContent}
          {...contentful.purchaseDetails}
          showFXALinks={true}
        />
      </div>
    </>
  );
}
