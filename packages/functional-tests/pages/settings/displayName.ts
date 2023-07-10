import { SettingsLayout } from './layout';

export class DisplayNamePage extends SettingsLayout {
  readonly path = 'settings/display_name';

  displayName() {
    return this.page.$eval('input[type=text]', (el: any) => el.value);
  }

  setDisplayName(name: string) {
    return this.page.fill('input[type=text]', name);
  }

  clickCancelDisplayName() {
    return this.page.click('[data-testid="cancel-display-name"]');
  }

  submit() {
    return Promise.all([
      this.page.locator('button[type=submit]').click(),
      this.page.waitForEvent('framenavigated'),
    ]);
  }
}
