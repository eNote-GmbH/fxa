/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { faker } from '@faker-js/faker';
import { ApolloQueryResult } from '@apollo/client';
import { ContentfulClient } from './contentful.client';
import { offeringQuery } from './queries/offering';
import { OfferingQuery } from '../__generated__/graphql';
import {
  ContentfulError,
  ContentfulLinkError,
  ContentfulLocaleError,
} from './contentful.error';

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

describe('ContentfulClient', () => {
  let contentfulClient: ContentfulClient;

  beforeEach(() => {
    contentfulClient = new ContentfulClient({
      cdnApiUri: faker.string.uuid(),
      graphqlApiKey: faker.string.uuid(),
      graphqlApiUri: faker.string.uuid(),
      graphqlSpaceId: faker.string.uuid(),
      graphqlEnvironment: faker.string.uuid(),
    });
  });

  describe('query', () => {
    const mockResponse = faker.string.sample();
    const id = faker.string.sample();
    const locale = faker.string.sample();

    describe('success', () => {
      let result: ApolloQueryResult<OfferingQuery> | null;

      beforeEach(async () => {
        (contentfulClient.client.query as jest.Mock).mockResolvedValueOnce(
          mockResponse
        );

        result = await contentfulClient.query(offeringQuery, {
          id,
          locale,
        });
      });

      it('returns the response from graphql', () => {
        expect(result).toEqual(mockResponse);
      });

      it('calls contentful with expected params', () => {
        expect(contentfulClient.client.query).toHaveBeenCalledWith({
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
        (contentfulClient.client.query as jest.Mock).mockRejectedValueOnce(
          error
        );

        await expect(() =>
          contentfulClient.query(offeringQuery, {
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
        (contentfulClient.client.query as jest.Mock).mockRejectedValueOnce(
          error
        );

        await expect(() =>
          contentfulClient.query(offeringQuery, {
            id,
            locale,
          })
        ).rejects.toThrow(
          new ContentfulError([
            new ContentfulLocaleError({}, 'Contentful: Unknown Locale'),
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
        (contentfulClient.client.query as jest.Mock).mockRejectedValueOnce(
          error
        );

        await expect(() =>
          contentfulClient.query(offeringQuery, {
            id,
            locale,
          })
        ).rejects.toThrow(
          new ContentfulError([
            new ContentfulLinkError({}, 'Contentful: Unresolvable Link'),
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
        (contentfulClient.client.query as jest.Mock).mockRejectedValueOnce(
          error
        );

        await expect(() =>
          contentfulClient.query(offeringQuery, {
            id,
            locale,
          })
        ).rejects.toThrow(
          new ContentfulError([
            new ContentfulLinkError(
              {},
              'Contentful: Unexpected Linked Content Type'
            ),
          ])
        );
      });
    });
  });

  describe('getLocale', () => {
    const DEFAULT_LOCALE = 'en';
    const ACCEPT_LANGUAGE = 'en-US,fr-FR;q=0.7,de-DE;q=0.3';
    const MOCK_DATA = {
      items: [{ code: 'en' }, { code: 'fr-FR' }],
    };

    beforeEach(() => {
      (global.fetch as jest.Mock) = jest.fn(() =>
        Promise.resolve({
          json: () => Promise.resolve(MOCK_DATA),
        })
      );
    });

    afterEach(() => {
      (global.fetch as jest.Mock).mockClear();
    });
    describe('success', () => {
      it('Returns prefered locale', async () => {
        const result = await contentfulClient.getLocale(ACCEPT_LANGUAGE);
        expect(result).toBe(DEFAULT_LOCALE);
      });

      it('Returns 2nd prefered locale, if prefered locale is not in configured', async () => {
        const acceptLanguage = 'de-DE,fr-FR;q=0.7,en-US;q=0.3';
        const result = await contentfulClient.getLocale(acceptLanguage);
        expect(result).toBe('fr-FR');
      });

      it('Returns the default locale, if no matching locale in Contentful', async () => {
        const acceptLanguage = 'de-DE';
        const result = await contentfulClient.getLocale(acceptLanguage);
        expect(result).toBe(DEFAULT_LOCALE);
      });

      it('Returns prefered locale from cache instead of fetching from Contentful', async () => {
        await contentfulClient.getLocale(ACCEPT_LANGUAGE);
        await contentfulClient.getLocale(ACCEPT_LANGUAGE);
        expect(global.fetch).toBeCalledTimes(1);
      });
    });

    describe('errors', () => {
      it('Returns the default locale, on Contentful locale error', async () => {
        (global.fetch as jest.Mock) = jest.fn(() =>
          Promise.resolve({
            json: () => Promise.reject(new Error('stuff went badly')),
          })
        );

        const result = await contentfulClient.getLocale(ACCEPT_LANGUAGE);
        expect(result).toBe(DEFAULT_LOCALE);
      });
    });
  });
});
