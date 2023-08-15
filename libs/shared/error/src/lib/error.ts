/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { MultiError, VError } from 'verror';

export class BaseError extends VError {
  constructor(...args: ConstructorParameters<typeof VError>) {
    super(...args);
  }
}

export class BaseMultiError extends MultiError {
  constructor(errors: Error[]) {
    super(errors);
  }
}

export class TypeError extends BaseError {
  constructor(...args: ConstructorParameters<typeof BaseError>) {
    super(...args);
  }
}
