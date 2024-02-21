import { headers } from 'next/headers';
import Image from 'next/image';
import Link from 'next/link';

import { PurchaseDetails, TermsAndPrivacy } from '@fxa/payments/ui/server';
import { getBundle, getLocaleFromRequest } from '@fxa/shared/l10n';

import { getCartData, getContentfulContent } from '../../../../_lib/apiClient';
import checkLogo from '../../../../../images/check.svg';
import errorIcon from '../../../../../images/error.svg';
import { CheckoutSearchParams } from '../../layout';
// import { app } from '../../_nestapp/app';

// forces dynamic rendering
// https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config
export const dynamic = 'force-dynamic';

// Temporary code for demo purposes only - Replaced as part of FXA-8822
const demoSupportedLanguages = ['en-US', 'fr-FR', 'es-ES', 'de-DE'];

interface CheckoutParams {
  offeringId: string;
  cartId: string;
}

export default async function CheckoutError({
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
  // const cartService = await app.getCartService();

  const l10n = await getBundle([locale]);

  const getErrorReason = (reason: string) => {
    switch (reason) {
      case 'iap_upgrade_contact_support':
        return {
          buttonFtl: 'payment-error-manage-subscription-button',
          buttonLabel: 'Manage my subscription',
          message:
            'You can still get this product — please contact support so we can help you.',
          messageFtl: 'iap-upgrade-contact-support',
        };
      default:
        return {
          buttonFtl: 'payment-error-retry-button',
          buttonLabel: 'Try again',
          message: 'Something went wrong. Please try again later.',
          messageFtl: 'basic-error-message',
        };
    }
  };

  return (
    <>
      <header className="page-title-container">
        <h1 className="page-header">
          {l10n.getMessage('subscription-error-title')?.value?.toString() ||
            'Error confirming subscription…'}
        </h1>
        <div className="page-subheader">
          <Image src={checkLogo} alt="" />
          <span className="page-subheader-text">
            {l10n.getMessage('sub-guarantee')?.value?.toString() ||
              '30-day money-back guarantee'}
          </span>
        </div>
      </header>

      <section
        className="payment-panel hidden tablet:block"
        aria-label="Purchase details"
      >
        <PurchaseDetails
          locale={locale}
          interval={cart.interval}
          invoice={cart.nextInvoice}
          purchaseDetails={contentful.purchaseDetails}
        />
      </section>

      <div className="page-body rounded-t-none tablet:rounded-t-long">
        <section
          className="page-message-container h-[640px]"
          aria-label="Payment error"
        >
          <Image src={errorIcon} alt="" className="mt-16 mb-10" />
          <p className="page-message px-7 py-0 mb-4 ">
            {l10n
              .getMessage(getErrorReason(cart.errorReasonId).messageFtl)
              ?.value?.toString() || getErrorReason(cart.errorReasonId).message}
          </p>

          <Link
            className="page-button"
            href={`/${params.offeringId}/checkout?interval=monthly`}
          >
            {l10n
              .getMessage(getErrorReason(cart.errorReasonId).buttonFtl)
              ?.value?.toString() ||
              getErrorReason(cart.errorReasonId).buttonLabel}
          </Link>
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
