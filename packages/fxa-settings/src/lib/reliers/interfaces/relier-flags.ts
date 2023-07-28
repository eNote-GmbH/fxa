/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Creation flags interface, controls the type of relier that is ultimately produced.
 */

// TODO: Extending integration flags for reliers is temporary, we will
// combine integrations + reliers in FXA-7308
export interface IntegrationFlags {
  isDevicePairingAsAuthority(): boolean;
  isDevicePairingAsSupplicant(): boolean;
  isOAuth(): boolean;
  isSyncService(): boolean;
  isV3DesktopContext(): boolean;
  isOAuthSuccessFlow(): { status: boolean; clientId: string };
  isOAuthVerificationFlow(): boolean;

  isServiceOAuth(): boolean;
  isServiceSync(): boolean;
  isVerification(): boolean;
  // TODO: fix return type
  searchParam(key: string): unknown;
}
