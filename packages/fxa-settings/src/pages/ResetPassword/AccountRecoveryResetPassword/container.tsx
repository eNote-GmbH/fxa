/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { RouteComponentProps } from '@reach/router';
import { Integration, Relier, useAuthClient } from '../../../models';
import { useFinishOAuthFlowHandler } from '../../../lib/oauth/hooks';
import AccountRecoveryResetPassword from '.';

const AccountRecoveryResetPasswordContainer = ({
  integrationAndRelier,
}: {
  integrationAndRelier: { relier: Relier; integration: Integration };
} & RouteComponentProps) => {
  const authClient = useAuthClient();
  const finishOAuthFlowHandler = useFinishOAuthFlowHandler(
    authClient,
    integrationAndRelier
  );

  return (
    <AccountRecoveryResetPassword
      {...{ integrationAndRelier, finishOAuthFlowHandler }}
    />
  );
};

export default AccountRecoveryResetPasswordContainer;
