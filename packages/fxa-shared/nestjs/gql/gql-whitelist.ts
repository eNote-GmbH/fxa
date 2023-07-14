/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
import { readFileSync } from 'fs';
import { Request, Response, NextFunction } from 'express';

/**
 * Configuration options for GqlGuard
 */
export type Config = {
  /** A list of json files holding queries extracted with the persistgraphql util. */
  whitelist: string[];
  /** Toggles gaurd on / off. */
  enabled: boolean;
};

/**
 * Guards against the execution of unsanctioned gql queries. A list of allowed queries can be populated by running.
 * `yarn gql:whitelist`.
 *
 * During development it is probably desirable to disable this!
 */
export class GqlWhitelist {
  public readonly valid: Array<Record<string, number>>;
  public readonly enabled: boolean;

  constructor(config: Config) {
    this.valid = config.whitelist.map((x) => {
      return JSON.parse(readFileSync(x).toString());
    });
    this.enabled = config.enabled;
  }

  allowed(req: Pick<Request, 'body' | 'query'>) {
    const query = req.query?.query || req.body?.query;
    return this.valid.some((x) => x[query] != null);
  }
}

/**
 * Express middleware for sanctioning GqlQueries. See:
 *   https://www.apollographql.com/blog/graphql/security/securing-your-graphql-api-from-malicious-queries/#query-whitelisting
 * @param config
 * @returns
 */
export function whitelistGqlQueries(config: Config) {
  const guard = new GqlWhitelist(config);
  return (req: Request, res: Response, next: NextFunction) => {
    if (guard.allowed(req)) {
      next();
    } else {
      res
        .status(403)
        .send({ statusCode: 403, message: 'Unsanctioned Graphql Query' });
    }
  };
}
