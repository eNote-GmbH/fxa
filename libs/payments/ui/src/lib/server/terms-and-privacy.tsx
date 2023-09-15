import { FluentBundle } from '@fluent/bundle';
import { getBundle } from '@fxa/shared/l10n/fluent';
import { headers } from 'next/headers';
import {
  GenericTermItem,
  GenericTermsListItem,
  PaymentProvider,
  buildFirefoxAccountsTerms,
  buildPaymentTerms,
  buildProductTerms,
} from '../utils/terms-and-privacy';

const CONTENT_SERVER_URL = 'https://accounts.stage.mozaws.net'; // TODO - Get from config once FXA-7503 lands

type GenericTermsProps = {
  title: string;
  titleId: string;
  titleLocalizationId: string;
  items: GenericTermsListItem[];
  l10n: FluentBundle;
};

function GenericTerms({
  titleId,
  title,
  titleLocalizationId,
  items,
  l10n,
}: GenericTermsProps) {
  return (
    <section
      className="clear-both mt-5 text-xs leading-5 text-center"
      role="group"
      aria-labelledby={titleId}
    >
      <h4 className="m-0 font-semibold text-grey-500" id={titleId}>
        {l10n.getMessage(titleLocalizationId)?.value?.toString() || title}
      </h4>

      <ul className="m-0 text-grey-500">
        {items.map((item) => (
          <li key={`span-${item.key}`} className="inline mr-3 last:mr-0">
            <a
              key={`link-${item.key}`}
              href={item.href}
              target="_blank"
              rel="noreferrer"
              className="text-blue-500 underline"
            >
              {l10n.getMessage(item.localizationId)?.value?.toString() ||
                item.text}
              <span className="sr-only">Opens in new window</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

export interface TermsAndPrivacyProps {
  paymentProvider?: PaymentProvider;
  productName: string;
  termsOfServiceUrl: string;
  termsOfServiceDownloadUrl: string;
  privacyNoticeUrl: string;
  showFXALinks?: boolean;
}

export async function TermsAndPrivacy({
  paymentProvider,
  productName,
  termsOfServiceUrl,
  termsOfServiceDownloadUrl,
  privacyNoticeUrl,
  showFXALinks = false,
}: TermsAndPrivacyProps) {
  const contentServerURL = CONTENT_SERVER_URL;

  const terms: GenericTermItem[] = [
    ...buildPaymentTerms(paymentProvider),
    ...buildFirefoxAccountsTerms(showFXALinks, contentServerURL),
    ...buildProductTerms(
      productName,
      termsOfServiceUrl,
      privacyNoticeUrl,
      termsOfServiceDownloadUrl
    ),
  ];

  // TODO - Temporary
  // Identify an approach to ensure we don't have to perform this logic
  // in every component/page that requires localization.
  const languages = headers()
    .get('Accept-Language')
    ?.split(',')
    .map((language) => language.split(';')[0]);

  // TODO
  // Move to instantiation on start up. Ideally getBundle's, generateBundle, is only called once at startup,
  // and then that instance is used for all requests.
  // Approach 1 (Experimental): https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
  // Approach 2 (Node global): https://github.com/vercel/next.js/blob/canary/examples/with-knex/knex/index.js#L13
  const l10n = await getBundle(languages);

  return (
    <aside className="pt-14" aria-label="Terms and Privacy Notices">
      {terms.map((term) => (
        <GenericTerms {...term} titleId={term.key} key={term.key} l10n={l10n} />
      ))}
    </aside>
  );
}

export default TermsAndPrivacy;
