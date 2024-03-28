import { LocalizerClient } from './localizer.client';
import { ILocalizerBindings } from './localizer.interfaces';

describe('LocalizerClient', () => {
  let localizer: LocalizerClient;
  const bindings: ILocalizerBindings = {
    opts: {
      translations: {
        basePath: '',
      },
    },
    fetchResource: async (filePath) => {
      const locale = filePath.split('/')[1];
      switch (locale) {
        case 'fr':
          return 'test-id = Test Fr';
        case 'en':
          return 'test-id = Test';
        default:
          throw new Error('Could not find locale');
      }
    },
  };

  beforeEach(async () => {
    localizer = new LocalizerClient(bindings);
  });

  it('should be defined', () => {
    expect(localizer).toBeDefined();
    expect(localizer).toBeInstanceOf(LocalizerClient);
  });

  describe.skip('setupReactLocalization', () => {
    it('should successfully create instance of ReactLocalization', async () => {
      const acceptLanguage = 'en';
      const { l10n, selectedLocale } = await localizer.setupReactLocalization(
        acceptLanguage
      );
      const bundle = l10n.getBundle(acceptLanguage);
      expect(bundle?.locales).toEqual([acceptLanguage]);
      expect(bundle?.getMessage('test-id')?.value).toBe('Test');
      expect(selectedLocale).toBe(acceptLanguage);
    });

    it('reports error for unavailable locale', async () => {
      const reportError = jest.fn();
      await localizer.setupReactLocalization('en', reportError);
      expect(reportError).toHaveBeenCalled();
    });
  });
});
