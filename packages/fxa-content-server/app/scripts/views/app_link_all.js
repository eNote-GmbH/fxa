/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import BaseView from './base';
// import Template from 'templates/app_link_all.mustache';

var View = BaseView.extend({
  className: 'app-link-all',
  // template: Template,
  initialize(options) {
    options = options || {};

    this._appleItunesApp = options.appleItunesApp;
  },

  beforeRender() {
    // TO REFACTOR, basic logic implementation
    if (navigator.userAgent.toLowerCase().indexOf('iphone') > -1 || navigator.userAgent.toLowerCase().indexOf('ipad') > -1) {
      window.location.href =
        'https://itunes.apple.com/my/app/flipbizz/idexampleapp';
    }
  },
});

export default View;
