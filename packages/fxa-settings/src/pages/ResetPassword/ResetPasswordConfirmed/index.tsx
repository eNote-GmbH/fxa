/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React, { useEffect, useState } from 'react';
import { RouteComponentProps } from '@reach/router';
import Ready from '../../../components/Ready';
import AppLayout from '../../../components/AppLayout';
import { Integration, Relier } from '../../../models';

export type ResetPasswordConfirmedProps = {
  continueHandler?: Function;
  isSignedIn: boolean;
  integrationAndRelier: { relier: Relier; integration: Integration };
};

export const viewName = 'reset-password-confirmed';

const ResetPasswordConfirmed = ({
  continueHandler,
  isSignedIn,
  integrationAndRelier,
}: ResetPasswordConfirmedProps & RouteComponentProps) => {
  const relier = integrationAndRelier.relier;

  const [serviceName, setServiceName] = useState<string>();
  const [isSync, setIsSync] = useState<boolean>();

  useEffect(() => {
    (async () => {
      setServiceName(await relier.getServiceName());
      setIsSync(await relier.isSync());
    })();
  });

  return (
    <AppLayout>
      <Ready
        {...{ continueHandler, isSignedIn, isSync, viewName, serviceName }}
      />
    </AppLayout>
  );
};

export default ResetPasswordConfirmed;
