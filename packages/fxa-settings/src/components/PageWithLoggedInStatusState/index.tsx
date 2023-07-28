/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React, { useState, useEffect } from 'react';
import { Integration } from '../../models';
import { RouteComponentProps } from '@reach/router';
import { sessionToken } from '../../lib/cache';

// TODO: revisit this component, do we need it?
export const PageWithLoggedInStatusState = (
  props: any &
    RouteComponentProps & {
      Page: React.ElementType;
      integration: Integration;
    }
) => {
  const { Page, integration } = props;

  const [isSync, setIsSync] = useState<boolean>();
  const [serviceName, setServiceName] = useState<string>();

  // TODO: Get the broker `continue` action once https://mozilla-hub.atlassian.net/browse/FXA-6989 is merged
  let continueHandler: Function | undefined;

  useEffect(() => {
    try {
      if (integration.isSync()) {
        setIsSync(true);
      } else {
        setIsSync(false);
      }
      setServiceName(integration.data.service);
    } catch {
      setIsSync(false);
    }
  }, [integration, setIsSync, isSync]);

  return (
    <Page
      {...{
        isSignedIn: !!sessionToken(),
        isSync,
        serviceName,
        continueHandler,
      }}
    />
  );
};

export default PageWithLoggedInStatusState;
