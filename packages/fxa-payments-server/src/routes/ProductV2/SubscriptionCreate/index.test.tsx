/**
 * @jest-environment jsdom
 */
import React from 'react';
import { screen, render, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { Stripe, PaymentMethod, PaymentIntent } from '@stripe/stripe-js';
import { defaultAppContextValue, MockApp } from '../../../lib/test-utils';
import { SignInLayout } from '../../../components/AppLayout';
import { CUSTOMER, PROFILE, PLAN } from '../../../lib/mock-data';
import { PickPartial } from '../../../lib/types';

import SubscriptionCreate, { SubscriptionCreateProps } from './index';

// TODO: Move to some shared lib?
const deepCopy = (object: Object) => JSON.parse(JSON.stringify(object));

describe('routes/ProductV2/SubscriptionCreate', () => {
  afterEach(() => {
    return cleanup();
  });

  it('renders', async () => {
    render(<Subject />);
    expect(screen.queryByTestId('subscription-create')).toBeInTheDocument();
  });
});

const Subject = ({
  isMobile = false,
  customer = CUSTOMER,
  profile = PROFILE,
  selectedPlan = PLAN,
  apiClientOverrides = defaultApiClientOverrides,
  stripeOverride = defaultStripeOverride,
  refreshSubscriptions = jest.fn(),
  ...props
}: PickPartial<
  SubscriptionCreateProps,
  'isMobile' | 'profile' | 'customer' | 'selectedPlan' | 'refreshSubscriptions'
>) => {
  return (
    <MockApp
      appContextValue={{
        ...defaultAppContextValue(),
      }}
    >
      <SignInLayout>
        <SubscriptionCreate
          {...{
            isMobile,
            profile,
            customer,
            selectedPlan,
            refreshSubscriptions,
            apiClientOverrides,
            stripeOverride,
            ...props,
          }}
        />
      </SignInLayout>
    </MockApp>
  );
};

const SUBSCRIPTION_RESULT = {
  id: 'sub_1234',
  latest_invoice: {
    id: 'invoice_5678',
    payment_intent: {
      id: 'pi_7890',
      client_secret: 'cs_abcd',
      status: 'succeeded',
    },
  },
};

const RETRY_INVOICE_RESULT = {
  id: 'invoice_5678',
  payment_intent: {
    id: 'pi_9876',
    client_secret: 'cs_erty',
    status: 'succeeded',
  },
};

const defaultApiClientOverrides = {
  apiCreateCustomer: async () => CUSTOMER,
  apiCreateSubscriptionWithPaymentMethod: async () => SUBSCRIPTION_RESULT,
  apiRetryInvoice: async () => RETRY_INVOICE_RESULT,
};

const defaultStripeOverride: Pick<
  Stripe,
  'createPaymentMethod' | 'confirmCardPayment'
> = {
  createPaymentMethod: async () => {
    return {
      paymentMethod: { id: 'pm_4567' } as PaymentMethod,
      error: undefined,
    };
  },
  confirmCardPayment: async () => {
    return {
      paymentIntent: { status: 'succeeded' } as PaymentIntent,
      error: undefined,
    };
  },
};
