import { getLocalizedCurrencyString } from '@fxa/shared/l10n';
import { Stripe } from 'stripe';

export type PlanInterval = Stripe.Plan['interval']; // TODO - Replace once FXA-7507 lands

/**
 * The following functions are for creating fallback text for Subscription Intervals
 */

export function formatPriceAmount(
  amount: number | null,
  currency: string,
  showTax: boolean,
  tax: number | null
) {
  return showTax
    ? `${getLocalizedCurrencyString(
        amount,
        currency
      )} + ${getLocalizedCurrencyString(tax, currency)} tax`
    : getLocalizedCurrencyString(amount, currency);
}

/**
 * This is the base formatting to describe a plan's pricing:
 * Examples:
 *   '$2.00 daily'
 *   '$2.00 every 6 days'
 *   '$2.00 + $0.45 tax daily'
 *   '$2.00 + $0.45 tax every 6 days'
 * @param amount
 * @param currency
 * @param interval
 * @param intervalCount
 * @param showTax
 * @param tax
 */
export function formatPlanPricing(
  amount: number | null,
  currency: string,
  interval: string,
  showTax = false,
  tax = 0
): string {
  const formattedAmount = formatPriceAmount(amount, currency, showTax, tax);
  switch (interval) {
    case 'daily':
      return `${formattedAmount} daily`;
    case 'weekly':
      return `${formattedAmount} weekly`;
    case 'monthly':
      return `${formattedAmount} monthly`;
    case '6monthly':
      return `${formattedAmount} every 6 months`;
    case 'yearly':
      return `${formattedAmount} yearly`;
    default:
      return `${formattedAmount} monthly`;
  }
}

/**
 * Helper function to format a Stripe plan's interval
 * Examples:
 *   'daily' or 'days'
 *   'weekly' or 'weeks'
 *   'monthly' or 'months'
 *   'yearly' or 'years'
 * @param interval
 * @param intervalCount
 */
export function formatPlanInterval({
  interval,
  intervalCount,
}: {
  interval: PlanInterval; // TODO - Replace once FXA-7507 lands
  intervalCount?: number;
}): string {
  switch (interval) {
    case 'day':
      return intervalCount === 1 ? 'daily' : 'days';
    case 'week':
      return intervalCount === 1 ? 'weekly' : 'weeks';
    case 'month':
      return intervalCount === 1 ? 'monthly' : 'months';
    case 'year':
      return intervalCount === 1 ? 'yearly' : 'years';
  }
}
