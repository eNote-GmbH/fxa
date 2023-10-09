/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { gql } from '@apollo/client';

// Glean init needs 'metricsEnabled' and 'uid'.
// "Amplitude" init needs 'metricsEnabled', 'uid', 'recoveryKey',
// if secondary email is verified, and `totp.verified`.
export const INITIAL_METRICS_QUERY = gql`
  query GetInitialMetricsState {
    account {
      uid
      recoveryKey
      metricsEnabled
      emails {
        email
        isPrimary
        verified
      }
      totp {
        exists
        verified
      }
    }
  }
`;

// This query reads from the apollo-client cache. It updates if a response
// comes back with an 'invalid token' + 'unauthenticated' status, or if a
// network request that requires auth succeeds. Because we have an initial
// metrics query that runs on app load that requires a valid session token, t
// this should update and be accurate on first render.
export const GET_LOCAL_SIGNED_IN_STATUS = gql`
  query GetLocalSignedInStatus {
    isSignedIn @client
  }
`;
