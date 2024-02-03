/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { BeginSigninResponse } from '../interfaces';

export interface SigninUnblockLocationState {
  email: string;
  password: string;
}

export interface SigninUnblockProps {
  bannerErrorMessage?: string;
  signinWithUnblockCode: SigninWithUnblockCode;
  resendUnblockCodeHandler: ResendUnblockCodeHandler;
}

export type BeginSigninWithUnblockCodeHandler = (
  code: string
) => Promise<BeginSigninWithUnblockCodeResult>;

export interface BeginSigninWithUnblockCodeResult {
  data?: BeginSigninResponse;
  errorMessage?: string;
}

export type SigninWithUnblockCode = (code: string) => void;

export type ResendUnblockCodeHandler = () => Promise<ResendUnblockCodeResult>;

export interface ResendUnblockCodeResult {
  resendSuccess?: boolean;
  errorMessage?: string;
}
