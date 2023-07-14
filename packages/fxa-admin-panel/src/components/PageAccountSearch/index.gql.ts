/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { gql } from '@apollo/client';

export const GET_ACCOUNT_BY_EMAIL = gql`
  query getAccountByEmail($email: String!, $autoCompleted: Boolean!) {
    accountByEmail(email: $email, autoCompleted: $autoCompleted) {
      uid
      createdAt
      disabledAt
      lockedAt
      locale
      email
      emails {
        email
        isVerified
        isPrimary
        createdAt
      }
      emailBounces {
        email
        templateName
        createdAt
        bounceType
        bounceSubType
        diagnosticCode
      }
      securityEvents {
        uid
        nameId
        verified
        createdAt
        name
      }
      totp {
        verified
        createdAt
        enabled
      }
      recoveryKeys {
        createdAt
        verifiedAt
        enabled
      }
      linkedAccounts {
        providerId
        authAt
        enabled
      }
      accountEvents {
        name
        service
        eventType
        createdAt
        template
      }
      attachedClients {
        createdTime
        createdTimeFormatted
        lastAccessTime
        lastAccessTimeFormatted
        deviceType
        name
        clientId
        userAgent
        os
        sessionTokenId
        location {
          city
          state
          stateCode
          country
          countryCode
        }
      }
      subscriptions {
        created
        currentPeriodEnd
        currentPeriodStart
        cancelAtPeriodEnd
        endedAt
        latestInvoice
        planId
        productName
        productId
        status
        subscriptionId
        manageSubscriptionLink
      }
    }
  }
`;

// new query for getting account by UID
export const GET_ACCOUNT_BY_UID = gql`
  query getAccountByUid($uid: String!) {
    accountByUid(uid: $uid) {
      uid
      createdAt
      disabledAt
      lockedAt
      locale
      email
      emails {
        email
        isVerified
        isPrimary
        createdAt
      }
      emailBounces {
        email
        templateName
        createdAt
        bounceType
        bounceSubType
        diagnosticCode
      }
      securityEvents {
        uid
        nameId
        verified
        createdAt
        name
      }
      totp {
        verified
        createdAt
        enabled
      }
      recoveryKeys {
        createdAt
        verifiedAt
        enabled
      }
      linkedAccounts {
        providerId
        authAt
        enabled
      }
      accountEvents {
        name
        service
        eventType
        createdAt
        template
      }
      attachedClients {
        createdTime
        createdTimeFormatted
        lastAccessTime
        lastAccessTimeFormatted
        deviceType
        name
        clientId
        userAgent
        os
        sessionTokenId
        location {
          city
          state
          stateCode
          country
          countryCode
        }
      }
      subscriptions {
        created
        currentPeriodEnd
        currentPeriodStart
        cancelAtPeriodEnd
        endedAt
        latestInvoice
        planId
        productName
        productId
        status
        subscriptionId
        manageSubscriptionLink
      }
    }
  }
`;

export const GET_EMAILS_LIKE = gql`
  query getEmails($search: String!) {
    getEmailsLike(search: $search) {
      email
    }
  }
`;
