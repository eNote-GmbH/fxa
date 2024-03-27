import { headers } from 'next/headers';
import Image from 'next/image';
import Link from 'next/link';

import { getBundle, getLocaleFromRequest } from '@fxa/shared/l10n';

import { getCartData } from '../../../../_lib/apiClient';
import errorIcon from '../../../../../images/error.svg';
import { CheckoutSearchParams } from '../../layout';

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

  const cartData = getCartData(params.cartId);
  const [cart] = await Promise.all([cartData]);
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
    </>
  );
}
