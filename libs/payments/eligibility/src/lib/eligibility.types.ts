/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Used to represent plan eligibility in general
export enum EligibilityResult {
  CREATE = 'create',
  UPGRADE = 'upgrade',
  DOWNGRADE = 'downgrade',
  BLOCKED_IAP = 'blocked_iap',
  EXISTING_PLAN = 'existing_plan',
  INVALID = 'invalid',
}
