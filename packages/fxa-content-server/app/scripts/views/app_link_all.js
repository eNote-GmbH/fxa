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
    const country = this.lang || 'us'

    const url = new URL(this.appleItunesApp);
    const params = new URLSearchParams(url.search);
    const appId = params.get('app-id');

    return setTimeout(() => {
      this.navigateAway(
        `https://apps.apple.com/${country}/app/enote-intelligent-sheet-music/id${appId}`
      );
    }, 3000);
  },
});

export default View;
