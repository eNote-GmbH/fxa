/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React, { useEffect, useState } from 'react';
import { Integration } from '../../models';
import { RouteComponentProps } from '@reach/router';
import { MozServices } from '../../lib/types';
import { SignedInAccountStatus } from '../App/interfaces';
import { useQuery } from '@apollo/client';
import { GET_LOCAL_SIGNED_IN_STATUS } from '../App/gql';

// TODO: Likely remove or heavily tweak this component
export const PageWithLoggedInStatusState = (
  props: any &
    RouteComponentProps & {
      Page: React.ElementType;
      integration: Integration;
    }
) => {
  const { Page, integration } = props;
  const { data: isSignedInData } = useQuery<SignedInAccountStatus>(
    GET_LOCAL_SIGNED_IN_STATUS
  );
  const isSignedIn = isSignedInData?.isSignedIn;
  const [serviceName, setServiceName] = useState<string>();

  useEffect(() => {
    (async () => {
      // TODO: remove async requirements from relier, FXA-6836
      setServiceName(await integration.getServiceName());
    })();
  });

  // TODO: Get the broker `continue` action once https://mozilla-hub.atlassian.net/browse/FXA-6989 is merged
  let continueHandler: Function | undefined;
  const isSync = serviceName === MozServices.FirefoxSync;

  return (
    <Page
      {...{ isSignedIn, isSync, serviceName, continueHandler, integration }}
    />
  );
};

export default PageWithLoggedInStatusState;
