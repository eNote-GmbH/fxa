/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { RouteComponentProps } from '@reach/router';
import { Integration, useAuthClient } from '../../models';
import { useFinishOAuthFlowHandler } from '../../lib/oauth/hooks';
import Signin from '.';
import { MozServices } from '../../lib/types';

const SigninContainer = ({
  integration,
}: {
  integration: Integration;
} & RouteComponentProps) => {
  const authClient = useAuthClient();
  // TODO verify if this is needed
  const { finishOAuthFlowHandler, oAuthDataError } = useFinishOAuthFlowHandler(
    authClient,
    integration
  );
  // Temporary values
  const email = 'temp@email.com';
  const isPasswordNeeded = true;
  const serviceName = MozServices.Default;

  // TODO: Handle oAuthDataError in FXA-8106

  return (
    <Signin
      {...{
        email,
        isPasswordNeeded,
        serviceName,
        integration,
        finishOAuthFlowHandler,
      }}
    />
  );
};

export default SigninContainer;
