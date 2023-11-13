/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { isAllowed } from 'fxa-shared/configuration/convict-format-allow-list';
import { useConfig, useFtlMsgResolver } from '../../../models';
import { useLocation } from '@reach/router';
import {
  AuthUiErrors,
  composeAuthUiErrorTranslationId,
} from '../../auth-errors/auth-errors';

export function useRedirect(redirectTo: string | undefined) {
  const config = useConfig();
  const location = useLocation();
  const ftlMsgResolver = useFtlMsgResolver();

  const isValid = redirectTo
    ? isAllowed(redirectTo, location.href, config.redirectAllowList)
    : false;

  return {
    isValid,
    localizedErrorMessage: ftlMsgResolver.getMsg(
      composeAuthUiErrorTranslationId(AuthUiErrors.INVALID_REDIRECT_TO),
      AuthUiErrors.INVALID_REDIRECT_TO.message
    ),
  };
}
