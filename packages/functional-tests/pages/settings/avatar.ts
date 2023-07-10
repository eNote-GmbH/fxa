import { SettingsLayout } from './layout';

export class AvatarPage extends SettingsLayout {
  readonly path = 'settings/avatar';

  async clickAddPhoto() {
    const [filechooser] = await Promise.all([
      this.page.waitForEvent('filechooser'),
      this.page.locator('[data-testid=add-photo-btn]').click(),
    ]);
    return filechooser;
  }

  clickTakePhoto() {
    return this.page.click('[data-testid=take-photo-btn]');
  }

  async clickRemove() {
    await Promise.all([
      this.page.click('[data-testid=remove-photo-btn]'),
      this.page.waitForEvent('framenavigated'),
    ]);
    // HACK we don't really have a good way to distinguish
    // between monogram avatars and user set images
    // and if we return directly after navigation
    // react may not have updated the image yet
    await this.page.waitForSelector('img[src*="avatar"]');
  }

  clickSave() {
    return Promise.all([
      this.page.locator('[data-testid=save-button]').click(),
      this.page.waitForEvent('framenavigated'),
    ]);
  }

  clickCancel() {
    return this.page.click('[data-testid=close-button]');
  }
}
