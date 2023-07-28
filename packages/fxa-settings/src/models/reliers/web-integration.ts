/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { ModelDataStore } from '../../lib/model-data';
import { BaseIntegration, IntegrationType } from './base-relier';

export class WebIntegration extends BaseIntegration {
  constructor(data: ModelDataStore) {
    super(IntegrationType.Web, data);
    this.setFeatures({
      reuseExistingSession: true,
      fxaStatus: this.isFxaStatusSupported(),
    });
  }

  private isFxaStatusSupported(): boolean {
    // TODO: check if `navigator.userAgent` is firefox desktop.
    // content-server also checks for FF version 55+ but that's nearly 6 years old
    return true;
  }
}
