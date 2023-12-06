/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import Config from './config';
import mozLog from 'mozlog';
import { initMonitoring } from 'fxa-shared/monitoring';

const config = Config.getProperties();
const log = mozLog(config.log)(config.log.app);
initMonitoring({
  log,
  config: {
    ...config,
    release: require('../package.json').version,
  },
});
