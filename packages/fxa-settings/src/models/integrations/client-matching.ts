/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

export const MONITOR_CLIENTIDS = [
  '802d56ef2a9af9fa', // Firefox Monitor
  '946bfd23df91404c', // Firefox Monitor stage
  'edd29a80019d61a1', // Firefox Monitor local dev
];

export const POCKET_CLIENTIDS = [
  '7377719276ad44ee', // pocket-mobile
  '749818d3f2e7857f', // pocket-web
];

// const TEST_123DONE_CLIENTID = ['dcdb5ae7add825d2'];

export const isClientPocket = (clientId: string) => {
  return POCKET_CLIENTIDS.includes(clientId);
};

export const isClientMonitor = (clientId: string) => {
  return MONITOR_CLIENTIDS.includes(clientId);
};
