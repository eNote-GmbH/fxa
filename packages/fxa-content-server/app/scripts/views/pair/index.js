/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import FormView from '../form';
import Cocktail from 'cocktail';
import FlowEventsMixin from '../mixins/flow-events-mixin';
import Template from '../../templates/pair/index.mustache';
import UserAgentMixin from '../../lib/user-agent-mixin';
import PairingGraphicsMixin from '../mixins/pairing-graphics-mixin';
import PairingTotpMixin from './pairing-totp-mixin';
import { MARKETING_ID_AUTUMN_2016, SYNC_SERVICE } from '../../lib/constants';
import SyncAuthMixin from '../mixins/sync-auth-mixin';
import MarketingMixin from '../mixins/marketing-mixin';

class PairIndexView extends FormView {
  template = Template;

  events = {
    ...FormView.prototype.events,
    'click #get-fx-mobile': 'downloadLinkEngagement',
    'click #pair-not-now': 'pairNotNowHandler',
    'click #have-firefox-toggle-button': 'showHaveFirefoxActions',
    'click #download-firefox-toggle-button': 'showDownloadFirefoxActions',
  };

  submit() {
    this.metrics.flush();
    return this.broker.openPairPreferences();
  }

  beforeRender() {
    const uap = this.getUserAgent();
    const isFirefoxDesktop = uap.isFirefoxDesktop();

    if (!isFirefoxDesktop || !this.broker.hasCapability('supportsPairing')) {
      // other browsers show an unsupported screen or if no capability to pair
      return this.replaceCurrentPage('pair/unsupported');
    }

    // If we reach this point that means we are in Firefox Desktop
    const account = this.getSignedInAccount();
    if (account.isDefault()) {
      // if we are not logged into Sync then we offer to connect
      return this.replaceCurrentPage('connect_another_device', {
        forceView: true,
      });
    }

    if (!account.get('verified') || !account.get('sessionToken')) {
      // if account is not verified or missing sessionToken then offer to sign in or confirm
      return this.navigateAway(this.getEscapedSyncUrl('signin', 'fxa:pair'));
    }
  }

  setInitialContext(context) {
    // Check the entrypoint. If we aren't in a entrypoint=fxa_app_menu context, then don't show QR code.
    const graphicId = this.getGraphicsId();
    const showQrCode = this.showDownloadFirefoxQrCode();

    context.set({
      graphicId,
      showQrCode,
      haveFirefox: true,
      downloadFirefox: false,
    });
  }

  downloadLinkEngagement() {
    this.metrics.logEvent('screen.pair.downloadlink.engage');
  }

  pairNotNowHandler() {
    this.metrics.logEvent('screen.pair.notnow.engage');
    return true;
  }

  // TODO: handle button style change on click
  // TODO: add aria-pressed attribute
  showHaveFirefoxActions() {
    this.$('#have-firefox-toggle-button').attr({ 'aria-pressed': true });
    this.$('#download-firefox-toggle-button').attr({
      'aria-pressed': false,
    });
    this.$('#have-firefox-toggle-button').addClass('bg-white text-blue-500');
    this.$('#download-firefox-toggle-button').removeClass(
      'bg-white text-blue-500'
    );
    this.$('#pair-have-firefox').show();
    this.$('#pair-download-firefox').hide();
  }

  showDownloadFirefoxActions() {
    this.$('#have-firefox-toggle-button').attr({
      'aria-pressed': false,
    });
    this.$('#download-firefox-toggle-button').attr({
      'aria-pressed': true,
    });
    this.$('#have-firefox-toggle-button').removeClass('bg-white text-blue-500');
    this.$('#download-firefox-toggle-button').addClass(
      'bg-white text-blue-500'
    );
    this.$('#pair-download-firefox').show();
    this.$('#pair-have-firefox').hide();
  }

  _haveFirefox() {}
}

Cocktail.mixin(
  PairIndexView,
  FlowEventsMixin,
  PairingGraphicsMixin,
  PairingTotpMixin(),
  UserAgentMixin,
  SyncAuthMixin,
  MarketingMixin({
    marketingId: MARKETING_ID_AUTUMN_2016,
    service: SYNC_SERVICE,
    useAndroidPairingApp: true,
  })
);

export default PairIndexView;
