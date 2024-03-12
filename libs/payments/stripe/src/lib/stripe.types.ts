/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { Stripe } from 'stripe';

/** Represents all subscription statuses that are considered active for a customer */
export const ACTIVE_SUBSCRIPTION_STATUSES: Stripe.Subscription['status'][] = [
  'active',
  'past_due',
  'trialing',
];
