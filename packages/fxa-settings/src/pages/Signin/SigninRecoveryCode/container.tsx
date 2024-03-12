/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { RouteComponentProps, useLocation } from '@reach/router';
import { hardNavigateToContentServer } from 'fxa-react/lib/utils';
import { MozServices } from '../../../lib/types';
import { currentAccount } from '../../../lib/cache';
import { StoredAccountData } from '../../../lib/storage-utils';
import SigninRecoveryCode from '.';
import { Integration, useAuthClient } from '../../../models';
import GleanMetrics from '../../../lib/glean';
import LoadingSpinner from 'fxa-react/components/LoadingSpinner';

export const viewName = 'signin-recovery-code';

export type SigninRecoveryCodeContainerProps = {
  integration: Integration;
  serviceName: MozServices;
};

export const SigninRecoveryCodeContainer = ({
  integration,
  serviceName,
}: SigninRecoveryCodeContainerProps & RouteComponentProps) => {
  // TODO: FXA-9177, likely use Apollo cache here instead of location state
  const location = useLocation() as ReturnType<typeof useLocation> & {
    state: StoredAccountData; // replace with SigninLocationState from FXA-6518
  };
  const authClient = useAuthClient();

  // replace currentAccount with getStoredAccountInfo util from FXA-6518,
  // only use stored account if account info not passed via location state
  const storedLocalAccount = location.state
    ? location.state
    : (currentAccount() as StoredAccountData);

  const submitRecoveryCode = async (code: string) => {
    if (!storedLocalAccount.sessionToken) {
      // TODO handle this case somehow
      return;
    }
    try {
      GleanMetrics.loginBackupCode.submit();

      // Check recovery code
      // Get number of remaining recovery codes
      // email notifications sent by client
      // include flow metrics???
      const { remaining } = await authClient.consumeRecoveryCode(
        storedLocalAccount.sessionToken,
        code.toLowerCase()
      );

      // Log success event
      GleanMetrics.loginBackupCode.success();

      // Do stuff based on number of remaining codes? doesn't seem to be used client side in content-server
      // TODO notify RPs of login with webchannel event (sync ticket?)
      // TODO mark verified in location state, stored local account, cache??
      // TODO use the handleNavigation(signinLocation) util to move onward

      // The await of isDone is not entirely necessary when we are not
      // redirecting the user to an RP.  However at the time of implementation
      // for the Glean ping the redirect logic has not been implemented.
      await GleanMetrics.isDone();

      // Check if isForcePasswordChange
    } catch (e) {
      // TODO: error handling, error message confirmation
      // This will likely use auth-errors, and errors should be displayed in a tooltip or banner
      // return error message to component
      // if 'INVALID_PARAMETER' display 'INVALID_RECOVERY_CODE'
      // error could be throttled error, show in banner
      // verify throttled error format when received from authClient??
    }
  };

  // TODO if previous page was force_auth, redirect there - else to signin
  if (!storedLocalAccount || !storedLocalAccount.sessionToken) {
    hardNavigateToContentServer(`/`);
    return <LoadingSpinner fullScreen />;
  }

  return <SigninRecoveryCode {...{ submitRecoveryCode, serviceName }} />;
};

export default SigninRecoveryCodeContainer;
