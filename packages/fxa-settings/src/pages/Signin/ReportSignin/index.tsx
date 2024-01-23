/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import { usePageViewEvent } from '../../../lib/metrics';
import { FtlMsg } from 'fxa-react/lib/utils';
import { RouteComponentProps, navigate } from '@reach/router';
import { REACT_ENTRYPOINT } from '../../../constants';
import CardHeader from '../../../components/CardHeader';
import AppLayout from '../../../components/AppLayout';
import LinkExternal from 'fxa-react/components/LinkExternal';

export const viewName = 'signin-reported';

export interface ReportSigninProps {
  linkDamaged?: boolean;
}

const ReportSignin = ({
  linkDamaged = false,
}: ReportSigninProps & RouteComponentProps) => {
  usePageViewEvent(viewName, REACT_ENTRYPOINT);

  const onSubmit = () => {
    // TODO: Report the sign in, cancel unblock code
    // Metrics
    navigate('/signin_reported');
  };

  return (
    // TODO: Account for damaged link - Use Link Validator?
    <AppLayout>
      {linkDamaged && (
        <>
          <CardHeader
            headingText="Link damaged"
            headingTextFtlId="report-signin-link-damaged-header"
          />
          <FtlMsg id="report-signin-link-damaged-body">
            <p className="text-sm">
              The link you clicked was missing characters, and may have been
              broken by your email client. Copy the address carefully, and try
              again.
            </p>
          </FtlMsg>
        </>
      )}
      {!linkDamaged && (
        <>
          <CardHeader
            headingText="Report unauthorized sign-in?"
            headingTextFtlId="report-signin-header"
          />
          {/* TODO: Add succcess/error banner */}
          <FtlMsg id="report-signin-body">
            <p>
              You received an email about attempted access to your account.
              Would you like to report this activity as suspicious?
            </p>
          </FtlMsg>
          <form noValidate className="my-4" {...{ onSubmit }}>
            <FtlMsg id="report-signin-submit-button">
              {/* TODO submit handling */}
              <button
                id="submit-btn"
                type="submit"
                className="cta-primary w-full cta-xl"
              >
                Report activity
              </button>
            </FtlMsg>
          </form>
          <FtlMsg id="report-signin-support-link">
            <LinkExternal
              className="link-blue text-sm"
              href="https://support.mozilla.org/en-US/kb/accounts-blocked"
            >
              Why is this happening?
            </LinkExternal>
          </FtlMsg>
        </>
      )}
    </AppLayout>
  );
};

export default ReportSignin;
