/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

module.exports = function (config) {
  const apps = config.get('apple_app_site_association.apps');
  const paths = config.get('apple_app_site_association.paths');
  const components = paths.map((path) => {return {'/': path}});

  // From Apple developer docs,
  // https://developer.apple.com/documentation/xcode/allowing_apps_and_websites_to_link_to_your_content
  // to enable universal link support for a specific domain you need to return
  // a json doc from `/.well-known/apple-app-site-association` path, describing
  // what apps can open which links.
  const association = {
    applinks: {
      details: [
        {
          appIDs: apps,
          components: components,
        },
      ],
    },
    webcredentials: {
      apps: [],
    },
  };

  if (config.get('apple_app_site_association.enable_shared_credentials')) {
    association.webcredentials.apps = apps;
  }

  const route = {};
  route.method = 'get';
  route.path = '/.well-known/apple-app-site-association';

  route.process = function (req, res) {
    // charset must be set on json responses.
    res.charset = 'utf-8';
    res.json(association);
  };

  return route;
};
