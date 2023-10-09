/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {
  ApolloClient,
  ApolloLink,
  NormalizedCacheObject,
  from,
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { ErrorHandler, onError } from '@apollo/client/link/error';
import { BatchHttpLink } from '@apollo/client/link/batch-http';
import { cache, sessionToken, typeDefs } from './cache';
import { GraphQLError } from 'graphql';
import { GET_LOCAL_SIGNED_IN_STATUS } from '../components/App/gql';

const operationNamesRequiringAuth = [
  'GetInitialMetricsState',
  'GetInitialSettingsState',
];

export const isUnauthorizedError = (error: GraphQLError) =>
  error.message === 'Invalid token' &&
  error.extensions?.response.error === 'Unauthorized';

const afterwareLink = new ApolloLink((operation, forward) => {
  return forward(operation).map((response) => {
    // The error link handles GQL errors and network errors. This handles
    // successful queries and checks to see if we should update the `isSignedIn` state.
    const successWithAuth =
      !response.errors &&
      operation.query.definitions.some((definition) => {
        return (
          definition.kind === 'OperationDefinition' &&
          definition.name?.value &&
          operationNamesRequiringAuth.includes(definition.name.value)
        );
      });

    if (successWithAuth) {
      cache.writeQuery({
        query: GET_LOCAL_SIGNED_IN_STATUS,
        data: { isSignedIn: true },
      });
    }
    return response;
  });
});

export const errorHandler: ErrorHandler = ({ graphQLErrors, networkError }) => {
  let reauth = false;

  if (graphQLErrors) {
    for (const error of graphQLErrors) {
      if (isUnauthorizedError(error)) {
        reauth = true;

        cache.writeQuery({
          query: GET_LOCAL_SIGNED_IN_STATUS,
          data: { isSignedIn: false },
        });
        // TODO: Improve in FXA-7626
      } else if (error.message === 'Must verify') {
        return window.location.replace(
          `/signin_token_code?action=email&service=sync`
        );
      }
    }
  }
  if (networkError && 'statusCode' in networkError) {
    // TODO: I think we can take 'reauth' bits out, and manually send this
    // to Sentry. If we hit a network error it's because the GQL server
    // couldn't be reached, otherwise it's a GQL Error.
    if (networkError.statusCode === 401) {
      reauth = true;
    }
  }
  if (!reauth) {
    console.error('graphql errors', graphQLErrors, networkError);
  }
};

let apolloClientInstance: ApolloClient<NormalizedCacheObject>;
export function createApolloClient(gqlServerUri: string) {
  if (apolloClientInstance) {
    return apolloClientInstance;
  }

  // httpLink makes the actual requests to the server
  const httpLink = new BatchHttpLink({
    uri: `${gqlServerUri}/graphql`,
  });

  const authLink = setContext((_, { headers, operation }) => {
    return {
      headers: {
        ...headers,
        Authorization: 'Bearer ' + sessionToken(),
      },
    };
  });

  // errorLink handles error responses from the server
  const errorLink = onError(errorHandler);

  apolloClientInstance = new ApolloClient({
    cache,
    link: from([errorLink, authLink, afterwareLink, httpLink]),
    typeDefs,
  });

  return apolloClientInstance;
}
