import {
  GenericTermItem,
  GenericTermsListItem,
  PaymentProvider,
  buildFirefoxAccountsTerms,
  buildPaymentTerms,
  buildProductTerms,
} from './utils';

const CONTENT_SERVER_URL = 'https://accounts.stage.mozaws.net'; // TODO - Replace once FXA-7503 lands

/**
 * GENERAL COMMENTS
 *  - Example of a Container/Presentation pattern
 *    - Container: TermsAndPrivacy
 *    - Presentation: GenericTerms
 *  - The idea behind this pattern is to keep the component logic, performed in the container, and
 *    presentation separate. This creates a neat separation of code that determines what is shown,
 *    and then separately how it's shown.
 */

/**
 * COMMENTS - GenericTerms component - Presentation component
 *  - An example of a presentation component
 *    - Return only data passed in via props
 *    - Presentation components should not be exported
 *  - Note that this component could be split out into a seperate GenericTerm, when iterrating
 *    over the individual Terms in `items.map`. Conversly, this GenericTerms component could
 *    be merged entirely into the TermsAndPrivacy component. When to split or merge components
 *    is left up to engineer, however tend towards the following.
 *      - Fewer components overall
 *      - Split up components into container/presentation components when it improves readability
 *        and understanding
 *  - TODO: Translation for React Server Components (RSC) and Server Side Rendering (SSR)
 */

type GenericTermsProps = {
  title: string;
  titleLocalizationId: string;
  items: GenericTermsListItem[];
};

function GenericTerms({
  title,
  titleLocalizationId,
  items,
}: GenericTermsProps) {
  return (
    <div className="legal-blurb">
      <p className="legal-heading">{title}</p>

      <p>
        {items.map((item) => (
          <span key={`span-${item.key}`} className="mr-3 last:mr-0">
            <a
              key={`link-${item.key}`}
              href={item.href}
              target="_blank"
              rel="noreferrer"
            >
              {item.text}
              <span className="sr-only">Opens in new window</span>
            </a>
          </span>
        ))}
      </p>
    </div>
  );
}

/**
 * COMMENTS - TermsAndPrivacy component - Container component
 *  - An example container component
 *    - Handle all controller logic, data fetching etc, and pass the necessary
 *      information to the presentation components.
 *  - Data Fetching (WIP - These points are based on current understanding)
 *    - Cacheable requests should be fetched by the Component (TODO - Find docs for this)
 *      - Example => CMS data fetch, since it's the same for all customers
 *    - Non-cacheable data should be passed in as props (TODO - Find docs for this)
 *      - Example => Cart data, different for each CartId, in this case paymentProvider
 *
 * Regarding data fetching, this is from the Next.js docs
 *  - https://nextjs.org/docs/app/building-your-application/data-fetching/fetching
 *  - Whenever possible, it's best to fetch data in the segment that uses it. This also allows
 *    you to show a loading state for only the part of the page that is loading, and not the entire page.
 */

export interface TermsAndPrivacyProps {
  paymentProvider?: PaymentProvider;
  contentfulContentLinks: {
    productName: string;
    termsOfService: string;
    termsOfServiceDownload: string;
    privacyNotice: string;
  };
  showFXALinks?: boolean;
}

export function TermsAndPrivacy({
  paymentProvider,
  contentfulContentLinks,
  showFXALinks = false,
}: TermsAndPrivacyProps) {
  const contentServerURL = CONTENT_SERVER_URL;

  const { productName, termsOfService, termsOfServiceDownload, privacyNotice } =
    contentfulContentLinks;

  const terms: GenericTermItem[] = [
    ...buildPaymentTerms(paymentProvider),
    ...buildFirefoxAccountsTerms(showFXALinks, contentServerURL),
    ...buildProductTerms(
      productName,
      termsOfService,
      privacyNotice,
      termsOfServiceDownload
    ),
  ];

  return (
    <div className="pt-14">
      {terms.map((term) => (
        <GenericTerms {...term} key={term.key} />
      ))}
    </div>
  );
}

export default TermsAndPrivacy;
