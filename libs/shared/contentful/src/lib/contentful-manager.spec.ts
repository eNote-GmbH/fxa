/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { faker } from '@faker-js/faker';
import { ApolloQueryResult } from '@apollo/client';
import { ContentfulManager } from './contentful-manager';
import { offeringQuery } from './queries/offering';
import { OfferingQuery } from '../__generated__/graphql';
import {
  ContentfulError,
  ContentfulLinkError,
  ContentfulLocaleError,
} from './errors';

const ApolloError = jest.requireActual('@apollo/client').ApolloError;

jest.mock('@apollo/client', () => ({
  ApolloClient: function () {
    return {
      query: jest.fn(),
    };
  },
  InMemoryCache: function () {},
  ApolloError: jest.requireActual('@apollo/client').ApolloError,
}));

describe('ContentfulManager', () => {
  let contentfulManager: ContentfulManager;

  beforeEach(() => {
    contentfulManager = new ContentfulManager(
      faker.internet.url(),
      faker.string.uuid()
    );
  });

  describe('query', () => {
    const mockResponse = faker.string.sample();
    const id = faker.string.sample();
    const locale = faker.string.sample();

    describe('success', () => {
      let result: ApolloQueryResult<OfferingQuery> | null;

      beforeEach(async () => {
        (contentfulManager.client.query as jest.Mock).mockResolvedValueOnce(
          mockResponse
        );

        result = await contentfulManager.query(offeringQuery, {
          id,
          locale,
        });
      });

      it('returns the response from graphql', () => {
        expect(result).toEqual(mockResponse);
      });

      it('calls contentful with expected params', () => {
        expect(contentfulManager.client.query).toHaveBeenCalledWith({
          query: offeringQuery,
          variables: {
            id,
            locale,
          },
        });
      });
    });

    describe('errors', () => {
      it('throws a generic error when the graphql client throws a generic error', async () => {
        const error = new Error(faker.word.sample());
        (contentfulManager.client.query as jest.Mock).mockRejectedValueOnce(
          error
        );

        await expect(() =>
          contentfulManager.query(offeringQuery, {
            id,
            locale,
          })
        ).rejects.toThrow(new ContentfulError([error]));
      });

      it('throws a locale error when contentful returns UNKNOWN_LOCALE', async () => {
        const error = new ApolloError({
          graphQLErrors: [
            {
              extensions: {
                contentful: {
                  code: 'UNKNOWN_LOCALE',
                },
              },
            },
          ],
        });
        (contentfulManager.client.query as jest.Mock).mockRejectedValueOnce(
          error
        );

        await expect(() =>
          contentfulManager.query(offeringQuery, {
            id,
            locale,
          })
        ).rejects.toThrow(
          new ContentfulError([
            new ContentfulLocaleError('Contentful: Unknown Locale'),
          ])
        );
      });

      it('throws a link error when contentful returns UNRESOLVABLE_LINK', async () => {
        const error = new ApolloError({
          graphQLErrors: [
            {
              extensions: {
                contentful: {
                  code: 'UNRESOLVABLE_LINK',
                },
              },
            },
          ],
        });
        (contentfulManager.client.query as jest.Mock).mockRejectedValueOnce(
          error
        );

        await expect(() =>
          contentfulManager.query(offeringQuery, {
            id,
            locale,
          })
        ).rejects.toThrow(
          new ContentfulError([
            new ContentfulLinkError('Contentful: Unresolvable Link'),
          ])
        );
      });

      it('throws a link error when contentful returns UNEXPECTED_LINKED_CONTENT_TYPE', async () => {
        const error = new ApolloError({
          graphQLErrors: [
            {
              extensions: {
                contentful: {
                  code: 'UNEXPECTED_LINKED_CONTENT_TYPE',
                },
              },
            },
          ],
        });
        (contentfulManager.client.query as jest.Mock).mockRejectedValueOnce(
          error
        );

        await expect(() =>
          contentfulManager.query(offeringQuery, {
            id,
            locale,
          })
        ).rejects.toThrow(
          new ContentfulError([
            new ContentfulLinkError(
              'Contentful: Unexpected Linked Content Type'
            ),
          ])
        );
      });
    });
  });
});
