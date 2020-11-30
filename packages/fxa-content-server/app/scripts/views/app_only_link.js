/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import BaseView from './base';
import Template from 'templates/app_only_link.mustache';

var View = BaseView.extend({
  className: 'app-only-link',
  template: Template,
});

export default View;
