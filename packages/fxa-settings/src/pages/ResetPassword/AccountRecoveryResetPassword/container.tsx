/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { RouteComponentProps } from '@reach/router';
import { Integration, useAuthClient } from '../../../models';
import { useFinishOAuthFlowHandler } from '../../../lib/oauth/hooks';
import AccountRecoveryResetPassword from '.';

const AccountRecoveryResetPasswordContainer = ({
  integration,
}: {
  integration: Integration;
} & RouteComponentProps) => {
  const authClient = useAuthClient();
  const finishOAuthFlowHandler = useFinishOAuthFlowHandler(
    authClient,
    integration
  );

  return (
    <AccountRecoveryResetPassword
      {...{ integration, finishOAuthFlowHandler }}
    />
  );
};

export default AccountRecoveryResetPasswordContainer;
