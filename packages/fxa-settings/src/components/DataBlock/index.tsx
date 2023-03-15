/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { Localized } from '@fluent/react';
import React, { useState } from 'react';
import GetDataTrio, {
  DownloadContentType,
  GetDataCopySingleton,
} from '../GetDataTrio';
import { Tooltip } from '../Tooltip';
const actionTypeToNotification = {
  download: 'Downloaded',
  copy: 'Copied',
  print: 'Printed',
} as const;

type actions = keyof typeof actionTypeToNotification;
type actionFn = (action: actions) => void;

export type DataBlockProps = {
  value: string | string[];
  contentType?: DownloadContentType;
  prefixDataTestId?: string;
  separator?: string;
  onCopy?: (event: React.ClipboardEvent<HTMLDivElement>) => void;
  onAction?: actionFn;
  isIOS?: boolean;
};

export const DataBlock = ({
  value,
  contentType,
  prefixDataTestId,
  separator,
  onCopy,
  onAction = () => {},
  isIOS = false,
}: DataBlockProps) => {
  const valueIsArray = Array.isArray(value);
  const [performedAction, setPerformedAction] = useState<actions>();
  const dataTestId = prefixDataTestId
    ? `${prefixDataTestId}-datablock`
    : 'datablock';
  const actionCb: actionFn = (action) => {
    onAction(action);

    if (actionTypeToNotification[action]) {
      setPerformedAction(action);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div
        className={`flex rounded-xl px-7 font-mono text-center text-sm text-green-900 bg-green-800/10 flex-wrap relative mb-6 ${
          valueIsArray ? 'max-w-sm py-4' : 'max-w-lg py-5'
        }`}
        data-testid={dataTestId}
        {...{ onCopy }}
      >
        {valueIsArray ? (
          (value as string[]).map((item) => (
            <span key={item} className="flex-50% py-1">
              {item}
              {separator || ''}
            </span>
          ))
        ) : (
          <span>{value}</span>
        )}
        {performedAction && (
          <Localized
            id={`datablock-${performedAction}`}
            attrs={{ message: true }}
          >
            <Tooltip
              prefixDataTestId={`datablock-${performedAction}`}
              message={actionTypeToNotification[performedAction]}
              position="bottom"
              className="mt-1"
            ></Tooltip>
          </Localized>
        )}
      </div>
      {isIOS ? (
        <GetDataCopySingleton {...{ value, onAction: actionCb }} />
      ) : (
        <GetDataTrio {...{ value, contentType, onAction: actionCb }} />
      )}
    </div>
  );
};

export default DataBlock;
