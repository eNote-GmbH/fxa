/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import { useFtlMsgResolver } from '../../../models';
import { RouteComponentProps } from '@reach/router';
import { ReactComponent as BackArrow } from './back-arrow.svg';
import Head from 'fxa-react/components/Head';

type FlowContainerProps = {
  title?: string;
  subtitle?: string;
  onBackButtonClick?: (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => void;
  localizedBackButtonTitle?: string;
  children?: React.ReactNode;
};

export const FlowContainer = ({
  title,
  subtitle,
  onBackButtonClick = () => window.history.back(),
  localizedBackButtonTitle,
  children,
}: FlowContainerProps & RouteComponentProps) => {
  const ftlMsgResolver = useFtlMsgResolver();
  const backButtonTitle = localizedBackButtonTitle
    ? localizedBackButtonTitle
    : ftlMsgResolver.getMsg('flow-container-back', 'Back');
  return (
    <div
      className="max-w-lg mx-auto mt-6 p-10 mobileLandscape:my-10 flex flex-col items-start bg-white shadow mobileLandscape:rounded-xl"
      data-testid="flow-container"
    >
      <Head title={title} />

      <div className="relative flex items-center">
        <button
          onClick={onBackButtonClick}
          data-testid="flow-container-back-btn"
          title={backButtonTitle}
          className="me-4 mobileLandscape:absolute mobileLandscape:p-4 mobileLandscape:-start-24"
        >
          <BackArrow className="w-6 h-auto fill-grey-400 rtl:transform rtl:-scale-x-100" />
        </button>
        <h1 className="font-header text-lg">{title}</h1>
      </div>
      {subtitle && (
        <h2 className="text-xs text-grey-400 font-semibold uppercase">
          {subtitle}
        </h2>
      )}
      <div className="w-full flex flex-col mt-2">{children}</div>
    </div>
  );
};

export default FlowContainer;
