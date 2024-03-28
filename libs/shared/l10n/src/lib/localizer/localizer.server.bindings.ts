import { promises as fsPromises, existsSync } from 'fs';
import { join } from 'path';
import type { LocalizerOpts } from './localizer.models';
import { ILocalizerBindings } from './localizer.interfaces';

export class LocalizerBindingsServer implements ILocalizerBindings {
  readonly opts: LocalizerOpts;
  constructor(opts?: LocalizerOpts) {
    this.opts = Object.assign(
      {
        translations: {
          basePath: join(__dirname, '../../public/locales'),
        },
      },
      opts
    );

    // Make sure config is legit
    this.validateConfig();
  }

  protected async validateConfig() {
    if (!existsSync(this.opts.translations.basePath)) {
      throw new Error('Invalid ftl translations basePath');
    }
  }

  async fetchResource(path: string): Promise<string> {
    return fsPromises.readFile(path, {
      encoding: 'utf8',
    });
  }
}
