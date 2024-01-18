import { PurchaseDetails, TermsAndPrivacy } from '@fxa/payments/ui/server';
import { getCartData, getContentfulContent } from '../../_lib/apiClient';
import Image from 'next/image';
import checkLogo from '../../../images/check.svg';
import checkmarkLogo from '../../../images/checkmark.svg';
import emailSentLogo from '../../../images/email-sent.svg';
// import { app } from '../../_nestapp/app';

interface CheckoutParams {
  offeringId: string;
}

export const dynamic = 'force-dynamic';

type ConfirmationDetailProps = {
  title: string;
  detail1: string;
  detail2: string;
};

const ConfirmationDetail = ({
  title,
  detail1,
  detail2,
}: ConfirmationDetailProps) => {
  return (
    <div className="row-divider-grey-200 pb-4 text-sm">
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
  const date = new Date(cart.createdAt).toDateString();

  return (
    <>
      <h1 className="page-title-container">
        <div className="font-semibold leading-8 mb-2 text-grey-600 text-xl">
          Subscription confirmation
        </div>
        <div className="flex items-center justify-center gap-2 text-green-900 mb-4">
          <Image src={checkLogo} alt="" width={16} height={16} />
          <span className="font-semibold text-sm">
            30-day money-back guarantee
          </span>
        </div>
      </h1>
      <section className="payment-panel" aria-label="Purchase details">
        <PurchaseDetails
          interval={cart.interval}
          invoice={cart.nextInvoice}
          purchaseDetails={contentful.purchaseDetails}
        />
      </section>
      <div className="component-card border-t-0 mb-6 pt-4 px-4 pb-14 rounded-t-lg text-grey-600 tablet:rounded-t-none desktop:px-12 desktop:pb-12">
        <section className="h-[640px]" aria-label="Payment confirmation">
          <div className="flex flex-col items-center justify-center row-divider-grey-200 text-center pb-8 mt-5 desktop:mt-2">
            <Image src={checkmarkLogo} alt="" />
            <Image src={emailSentLogo} alt="" />
            <h4 className="text-xl font-normal mx-0 mt-6 mb-3">
              Thanks, now check your email!
            </h4>
            <p className="text-grey-400 text-sm max-w-sm m-auto">
              {`You\’ll receive an email at ${cart.email} with
              instructions for setting up your account, as well as your payment
              details.`}
            </p>
          </div>
          <ConfirmationDetail
            title="Order details"
            detail1={`Invoice ${cart.invoiceNumber}`}
            detail2={date}
          />
          <ConfirmationDetail
            title="Payment information"
            detail1={`${cart.nextInvoice.totalAmount} ${cart.interval}`}
            detail2={`Card ending in ${cart.last4}`}
          />
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
