/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React, { useState } from 'react';
import { usePageViewEvent } from '../../../lib/metrics';
import { FtlMsg } from 'fxa-react/lib/utils';
import { RouteComponentProps } from '@reach/router';
import { REACT_ENTRYPOINT } from '../../../constants';
import CardHeader from '../../../components/CardHeader';
import AppLayout from '../../../components/AppLayout';
import { MOCK_EMAIL } from '../../mocks';
import FormVerifyCode, {
  FormAttributes,
} from '../../../components/FormVerifyCode';
import { useFtlMsgResolver } from '../../../models';
import LinkExternal from 'fxa-react/components/LinkExternal';
import { SigninUnblockProps } from './interfaces';
import Banner, { BannerType } from '../../../components/Banner';
import { MailImage } from '../../../components/images';

export const viewName = 'signin-unblock';

const SigninUnblock = ({
  bannerErrorMessage,
  signinWithUnblockCode,
  resendUnblockCodeHandler,
}: SigninUnblockProps & RouteComponentProps) => {
  usePageViewEvent(viewName, REACT_ENTRYPOINT);

  // update with real email
  const email = MOCK_EMAIL;
  const [codeErrorMessage, setCodeErrorMessage] = useState<string>('');

  const ftlMsgResolver = useFtlMsgResolver();

  const formAttributes: FormAttributes = {
    inputFtlId: 'signin-unblock-code-input',
    inputLabelText: 'Enter authorization code',
    inputMode: 'text',
    pattern: '[a-zA-Z0-9]{8}',
    maxLength: 8,
    submitButtonFtlId: 'signin-unblock-submit-button',
    submitButtonText: 'Continue',
  };

  const localizedCustomCodeRequiredMessage = ftlMsgResolver.getMsg(
    'signin-unblock-code-required-error',
    'Authorization code required'
  );

  const isValidCodeFormat = (code: string) => {
    const isValid =
      /^[a-zA-Z0-9]+$/.test(code) || // mix of letters and numbers
      /^[a-zA-Z]+$/.test(code) || // letters only
      /^[0-9]+$/.test(code); // numbers only
    return isValid;
  };

  const isValidLength = (code: string) => {
    return code.length === 8;
  };

  const handleSubmit = (code: string) => {
    if (!isValidLength(code)) {
      setCodeErrorMessage('The authorization code must contain 8 characters.');
    } else if (!isValidCodeFormat(code)) {
      setCodeErrorMessage(
        'The authorization can only contain letters and/or numbers.'
      );
    } else {
      signinWithUnblockCode(code);
    }
  };

  return (
    <AppLayout>
      <CardHeader
        headingText="Authorize this sign-in"
        headingTextFtlId="signin-unblock-header"
      />
      {bannerErrorMessage && (
        <Banner type={BannerType.error}>{bannerErrorMessage}</Banner>
      )}
      <MailImage />
      <FtlMsg id="signin-unblock-body" vars={{ email }}>
        <p className="text-sm">
          Check your email for the authorization code sent to {email}.
        </p>
      </FtlMsg>
      <FormVerifyCode
        {...{
          formAttributes,
          viewName,
          verifyCode: handleSubmit,
          localizedCustomCodeRequiredMessage,
          codeErrorMessage,
          setCodeErrorMessage,
        }}
      />
      <div className="flex flex-col gap-3">
        <FtlMsg id="signin-unblock-resend-code-button">
          <button
            className="link-blue text-sm"
            onClick={resendUnblockCodeHandler}
          >
            Not in inbox or spam folder? Resend
          </button>
        </FtlMsg>
        <FtlMsg id="signin-unblock-support-link">
          <LinkExternal
            href="https://support.mozilla.org/kb/accounts-blocked"
            className="link-blue text-sm"
          >
            Why is this happening?
          </LinkExternal>
        </FtlMsg>
      </div>
    </AppLayout>
  );
};

export default SigninUnblock;
