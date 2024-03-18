import { FluentBundle, FluentResource } from '@fluent/bundle';
import { promises as fsPromises } from 'fs';

export class LocalizerBase {
  constructor(private ftlBasePath: string) {}

  protected async fetchMessages(currentLocales: string[]) {
    const fetchedPending: Record<string, Promise<string>> = {};
    const fetched: Record<string, string> = {};
    for (const locale of currentLocales) {
      fetchedPending[locale] = this.fetchTranslatedMessages(locale);
    }

    // All we're doing here is taking `{ localeName: pendingLocaleMessagesPromise }` objects and
    // parallelizing the promise resolutions instead of waiting for them to finish syncronously. We
    // then return the result in the same `{ localeName: messages }` format for fulfilled promises.
    const fetchedLocales = await Promise.allSettled(
      Object.keys(fetchedPending).map(async (locale) => ({
        locale,
        fetchedLocale: await fetchedPending[locale],
      }))
    );

    fetchedLocales.forEach((fetchedLocale) => {
      if (fetchedLocale.status === 'fulfilled') {
        fetched[fetchedLocale.value.locale] = fetchedLocale.value.fetchedLocale;
      }
    });
    return fetched;
  }

  protected createBundleGenerator(fetched: Record<string, string>) {
    async function* generateBundles(currentLocales: string[]) {
      for (const locale of currentLocales) {
        const source = fetched[locale];
        if (source) {
          const bundle = new FluentBundle(locale, {
            useIsolating: false,
          });
          const resource = new FluentResource(source);
          bundle.addResource(resource);
          yield bundle;
        }
      }
    }

    return generateBundles;
  }

  /**
   * Returns the set of translated strings for the specified locale.
   * @param locale Locale to use, defaults to en.
   */
  protected async fetchTranslatedMessages(locale: string = 'en') {
    const mainFtlPath = `${this.ftlBasePath}/${locale}/main.ftl`;
    return this.fetchResource(mainFtlPath);
  }

  private async fetchResource(path: string): Promise<string> {
    return fsPromises.readFile(path, {
      encoding: 'utf8',
    });
  }
}
