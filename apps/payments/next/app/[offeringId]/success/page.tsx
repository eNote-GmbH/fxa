import { PurchaseDetails, TermsAndPrivacy } from '@fxa/payments/ui/server';
import { getCartData, getContentfulContent } from '../../_lib/apiClient';
import { headers } from 'next/headers';
import Image from 'next/image';
import checkLogo from '../../../images/check.svg';
import circledConfirm from '../../../images/circled-confirm.svg';
import { formatPlanPricing } from '../../../../../../libs/payments/ui/src/lib/utils/helpers';
import {
  getBundle,
  getFormattedMsg,
  getLocalizedCurrency,
  getLocalizedDate,
  getLocalizedDateString,
} from '@fxa/shared/l10n';
// import { app } from '../../_nestapp/app';

interface CheckoutParams {
  offeringId: string;
}

export const dynamic = 'force-dynamic';

type ConfirmationDetailProps = {
  title: string;
  detail1: string | Promise<string>;
  detail2: string;
};

const ConfirmationDetail = ({
  title,
  detail1,
  detail2,
}: ConfirmationDetailProps) => {
  return (
    <div className="row-divider-grey-200 pb-6 text-sm">
      <div className="font-semibold py-4">{title}</div>
      <div className="flex items-center justify-between text-grey-400">
        <span>{detail1}</span>
        <span>{detail2}</span>
      </div>
    </div>
  );
};

export default async function Page({ params }: { params: CheckoutParams }) {
  // TODO - Fetch Cart ID from cookie
  // https://nextjs.org/docs/app/api-reference/functions/cookies
  const cartId = 'cart-uuid';
  // TODO - Fetch locale from params
  // Possible solution could be as link below
  // https://nextjs.org/docs/app/building-your-application/routing/internationalization
  const locale = 'en-US';

  const contentfulData = getContentfulContent(params.offeringId, locale);
  const cartData = getCartData(cartId);
  const [contentful, cart] = await Promise.all([contentfulData, cartData]);
  /* eslint-disable @typescript-eslint/no-unused-vars */
  // const cartService = await app.getCartService();
  const date = cart.createdAt / 1000 - 86400 * 31;
  const planPrice = formatPlanPricing(
    cart.nextInvoice.totalAmount,
    cart.nextInvoice.currency,
    cart.interval
  );

  const languages = headers()
    .get('Accept-Language')
    ?.split(',')
    .map((language) => language.split(';')[0]);
  const l10n = await getBundle(languages);

  return (
    <>
      <header className="page-title-container">
        <h1 className="page-header">
          {l10n.getMessage('subscription-success-title')?.value?.toString() ||
            'Subscription confirmation'}
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
          interval={cart.interval}
          invoice={cart.nextInvoice}
          purchaseDetails={contentful.purchaseDetails}
        />
      </section>

      <div className="page-body rounded-t-lg tablet:rounded-t-none">
        <section className="h-[640px]" aria-label="Payment confirmation">
          <div className="page-message-container row-divider-grey-200">
            <Image src={circledConfirm} alt="" className="w-16 h-16" />

            <h4 className="text-xl font-normal mx-0 mt-6 mb-3">
              {l10n
                .getMessage('payment-confirmation-thanks-heading')
                ?.value?.toString() || 'Thank you!'}
            </h4>

            <p className="page-message">
              {getFormattedMsg(
                l10n,
                'payment-confirmation-thanks-subheading',
                `A confirmation email has been sent to ${cart.email} with details on how to get started with ${contentful.purchaseDetails.productName}.`,
                {
                  email: cart.email,
                  product_name: contentful.purchaseDetails.productName,
                }
              )}
            </p>
          </div>

          <ConfirmationDetail
            title={
              l10n
                .getMessage('payment-confirmation-order-heading')
                ?.value?.toString() || 'Order details'
            }
            detail1={getFormattedMsg(
              l10n,
              'payment-confirmation-invoice-number',
              `Invoice #${cart.invoiceNumber}`,
              {
                invoiceNumber: cart.invoiceNumber,
              }
            )}
            detail2={getFormattedMsg(
              l10n,
              'payment-confirmation-invoice-date',
              getLocalizedDateString(date),
              {
                invoiceDate: getLocalizedDate(date),
              }
            )}
          />

          <ConfirmationDetail
            title={
              l10n
                .getMessage('payment-confirmation-details-heading-2')
                ?.value?.toString() || 'Payment information'
            }
            detail1={getFormattedMsg(
              l10n,
              'payment-confirmation-amount',
              planPrice,
              {
                amount: getLocalizedCurrency(
                  cart.nextInvoice.totalAmount,
                  cart.nextInvoice.currency
                ),
                interval: cart.interval,
              }
            )}
            detail2={getFormattedMsg(
              l10n,
              'payment-confirmation-cc-card-ending-in',
              `Card ending in ${cart.last4}`,
              {
                last4: cart.last4,
              }
            )}
          />

          <a
            className="page-button"
            href={contentful.commonContent.successActionButtonUrl}
          >
            {contentful.commonContent.successActionButtonLabel ||
              l10n
                .getMessage('payment-confirmation-download-button ')
                ?.value?.toString() ||
              'Continue to download'}
          </a>
        </section>

        <TermsAndPrivacy
          {...cart}
          {...contentful.commonContent}
          {...contentful.purchaseDetails}
          showFXALinks={true}
        />
      </div>
    </>
  );
}
