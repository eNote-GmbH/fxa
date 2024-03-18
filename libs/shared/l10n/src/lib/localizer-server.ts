import { LocalizerBase } from './localizer-base';

export class LocalizerServer extends LocalizerBase {
  constructor(ftlBasePath: string) {
    super(ftlBasePath);
  }
}
