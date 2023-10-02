/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
import { createHash } from 'crypto';
import { commaSeparatedListToArray } from 'fxa-shared/lib/utils';
import { ALL_RPS_CAPABILITIES_KEY } from 'fxa-shared/subscriptions/configuration/base';
import { ClientIdCapabilityMap } from 'fxa-shared/subscriptions/types';

export function clientIdFromMetadataKey(key: string): string {
  return key === 'capabilities'
    ? ALL_RPS_CAPABILITIES_KEY
    : key.split(':')[1].trim();
}

export function capabilitiesFromMetadataValue(value: string): string[] {
  return commaSeparatedListToArray(value);
}

export function clientIdCapabilityMapFromMetadata(
  metadata?: Record<string, string>,
  filterBy?: string
): ClientIdCapabilityMap {
  return Object.entries(metadata || {})
    .filter(([key]) => key.startsWith(filterBy || 'capabilities'))
    .reduce((acc, [key, value]) => {
      acc[clientIdFromMetadataKey(key)] = capabilitiesFromMetadataValue(value);
      return acc;
    }, {} as ClientIdCapabilityMap);
}

export function generateIdempotencyKey(params: string[]) {
  const sha = createHash('sha256');
  sha.update(params.join(''));
  return sha.digest('base64url');
}

export function roundTime(date = new Date()) {
  return Math.round(date.getTime() / (1000 * 60)).toString();
}
