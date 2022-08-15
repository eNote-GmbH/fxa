/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import BaseView from './base';
import Template from 'templates/app_link_all.mustache';

var View = BaseView.extend({
  className: 'app-link-all',
  template: Template,
  initialize(options) {
    options = options || {};

    this.appleItunesApp = options.appleItunesApp;
  },

  afterRender() {
    //TO DO - Change time to configurable
    return setTimeout(() => {
      this.navigateAway(
        `https://itunes.apple.com/enote/${this.appleItunesApp}`
      );
    }, 3000);
  },
});

export default View;
