import { TermsAndPrivacy } from '@fxa/payments-ui/server';
import { Suspense } from 'react';
import { fetchGraphQl } from '@fxa/payments-ui';

const CART_QUERY = `
  query singleCart($input: SingleCartInput!) {
    singleCart(input: $input) {
      id
      promotionCode
      paymentProvider
    }
  }
`;

/* eslint-disable-next-line */
interface TermsProps {}

export default async function Terms(props: TermsProps) {
  const {
    singleCart: { paymentProvider },
  } = await fetchGraphQl(CART_QUERY, {
    input: { id: 1 },
  });

  return (
    <div>
      <h1>Welcome to Terms!</h1>
      <Suspense fallback={<div>Loading...</div>}>
        {/* @ts-expect-error Server Component */}
        <TermsAndPrivacy
          paymentProvider={paymentProvider || 'not_chosen'}
          showFXALinks={true}
        />
      </Suspense>
    </div>
  );
}
