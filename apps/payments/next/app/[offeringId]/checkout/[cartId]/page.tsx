import { PurchaseDetails, TermsAndPrivacy } from '@fxa/payments/ui/server';

import { getCartData, getContentfulContent } from '../../../_lib/apiClient';
import { app } from '../../../_nestapp/app';
import { headers } from 'next/headers';
import { getLocaleFromRequest } from '@fxa/shared/l10n';
import { CheckoutSearchParams } from '../layout';

export const dynamic = 'force-dynamic';

interface CheckoutParams {
  offeringId: string;
  cartId: string;
}

// Temporary code for demo purposes only - Replaced as part of FXA-8822
const demoSupportedLanguages = ['en-US', 'fr-FR', 'es-ES', 'de-DE'];

export default async function Checkout({
  params,
  searchParams,
}: {
  params: CheckoutParams;
  searchParams: CheckoutSearchParams;
}) {
  const headersList = headers();
  const locale = getLocaleFromRequest(
    searchParams,
    headersList.get('accept-language'),
    demoSupportedLanguages
  );

  const contentfulData = getContentfulContent(params.offeringId, locale);
  const cartData = getCartData(params.cartId);
  const [contentful, cart] = await Promise.all([contentfulData, cartData]);
  /* eslint-disable @typescript-eslint/no-unused-vars */
  const cartService = await app.getCartService();

  return (
    <>
      <header className="page-title-container">
        <h1 className="page-header">Under Construction</h1>
      </header>

      <section className="payment-panel" aria-label="Purchase details">
        <PurchaseDetails
          interval={cart.interval}
          locale={locale}
          invoice={cart.nextInvoice}
          purchaseDetails={contentful.purchaseDetails}
        />
      </section>

      <div className="page-body rounded-t-lg tablet:rounded-t-none">
        <section
          className="h-[640px] flex items-center justify-center"
          aria-label="Section under construction"
        >
          Section Under Construction
        </section>

        <TermsAndPrivacy
          locale={locale}
          {...cart}
          {...contentful.commonContent}
          {...contentful.purchaseDetails}
          showFXALinks={true}
        />
      </div>
    </>
  );
}
