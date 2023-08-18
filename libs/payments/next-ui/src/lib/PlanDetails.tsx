import Image from 'next/image';
import { getLocalizedCurrencyString } from '../../../../shared/l10n/fluent/src';
import FIREFOX_LOGO from '../images/firefox-logo-combined.svg';
import { PlanInterval, formatPlanPricing } from './helpers';
// import INFO_ICON from '../../public/images/info.svg';

export type PriceInfo = {
  listPrice: number;
  taxAmount?: number;
  discountAmount?: number;
  totalPrice: number;
  currency: string;
  interval: PlanInterval; // TODO - Replace once FXA-7507 lands
  intervalCount: number;
};

export type ContentfulConfiguration = {
  details: string[];
  subtitle: string;
  productName: string;
  webIcon?: string;
};

export type InfoBoxMessage = {
  message: string;
  couponDurationDate?: number;
};

export type PlanDetailsProps = {
  priceInfo: PriceInfo;
  contentfulConfiguration: ContentfulConfiguration;
};

export const PlanDetails = (props: PlanDetailsProps) => {
  const { priceInfo, contentfulConfiguration } = props;
  const {
    listPrice,
    taxAmount,
    discountAmount,
    totalPrice,
    interval,
    intervalCount,
    currency,
  } = priceInfo;

  const { details, subtitle, productName, webIcon } = contentfulConfiguration;

  return (
    <div
      className={`component-card px-4 rounded-t-none tablet:rounded-t-lg`}
      data-testid="plan-details-component"
    >
      <div className="plan-details-header row-divider-grey-200">
        <div className="plan-details-logo-wrap" style={{}}>
          <Image
            src={webIcon || FIREFOX_LOGO}
            alt={productName}
            data-testid="product-logo"
            className="plan-details-icon"
            width={64}
            height={64}
          />
        </div>

        <div className="text-start text-sm">
          <h3 id="plan-details-product" className="plan-details-product">
            {productName}
          </h3>

          <p className="plan-details-description">
            {/* <Localized
              id={`plan-price-interval-${interval}`}
              vars={{
                amount: getLocalizedCurrency(listPrice, currency),
                intervalCount: intervalCount,
              }}
            >

            </Localized> */}
            {formatPlanPricing(listPrice, currency, interval, intervalCount)}
            &nbsp;&bull;&nbsp;
            <span>{subtitle}</span>
          </p>
        </div>
      </div>

      <div data-testid="list">
        {/* <Localized id="plan-details-header">
        </Localized> */}
        <h4 className="text-sm text-grey-600 my-4">Product details</h4>

        <ul className="row-divider-grey-200 text-grey-400 m-0 px-3 text-sm">
          {details.map((detail, idx) => (
            <li className="mb-4 leading-5 marker:text-xs" key={idx}>
              {detail}
            </li>
          ))}
        </ul>
      </div>
      <div className="row-divider-grey-200 py-6">
        {!!listPrice && (
          <div className="plan-details-item">
            {/* <Localized id="plan-details-list-price">
            </Localized> */}
            <div>List Price</div>

            {/* <Localized
              id={`list-price`}
              attrs={{ title: true }}
              vars={{
                amount: getLocalizedCurrency(listPrice, currency),
                intervalCount: intervalCount,
              }}
            >
            </Localized> */}
            <div>{getLocalizedCurrencyString(listPrice, currency)}</div>
          </div>
        )}

        {!!taxAmount && (
          <div className="plan-details-item">
            {/* <Localized id="plan-details-tax">
            </Localized> */}
            <div>Taxes and Fees</div>

            {/* <Localized
              id={`tax`}
              attrs={{ title: true }}
              vars={{
                amount: getLocalizedCurrency(taxAmount, currency),
                intervalCount,
              }}
            >
            </Localized> */}
            <div data-testid="tax-amount">
              {getLocalizedCurrencyString(taxAmount, currency)}
            </div>
          </div>
        )}

        {/* {exclusiveTaxRates.length > 1 &&
                  exclusiveTaxRates.map((taxRate, idx) => (
                    <div className="plan-details-item">
                      <div>{taxRate.display_name}</div>

                      <Localized
                        id={`tax`}
                        key={idx}
                        attrs={{ title: true }}
                        vars={{
                          amount: getLocalizedCurrency(
                            taxRate.amount,
                            currency
                          ),
                          intervalCount: intervalCount,
                        }}
                      >
                        <div>
                          {getLocalizedCurrencyString(taxRate.amount, currency)}
                        </div>
                      </Localized>
                    </div>
                  ))} */}

        {!!discountAmount && (
          <div className="plan-details-item">
            {/* <Localized id="coupon-promo-code">
            </Localized> */}
            <div>Promo Code</div>

            {/* <Localized
              id={`coupon-amount`}
              attrs={{ title: true }}
              vars={{
                amount: getLocalizedCurrency(discountAmount, currency),
                intervalCount: intervalCount,
              }}
            >
            </Localized> */}
            <div>
              {`- ${getLocalizedCurrencyString(discountAmount, currency)}`}
            </div>
          </div>
        )}
      </div>

      <div className="pt-4 pb-6">
        {!!totalPrice && (
          <div className="plan-details-item font-semibold">
            {/* <Localized id="plan-details-total-label">
            </Localized> */}
            <div className="total-label">Total</div>

            {/* <Localized
              id={`plan-price-interval-${interval}`}
              data-testid="plan-price-total"
              attrs={{ title: true }}
              vars={{
                amount: getLocalizedCurrency(totalPrice, currency),
                intervalCount: intervalCount,
              }}
            >
            </Localized> */}
            <div
              className="total-price"
              title={`${totalPrice}`}
              data-testid="total-price"
              id="total-price"
            >
              {formatPlanPricing(totalPrice, currency, interval, intervalCount)}
            </div>
          </div>
        )}

        {/* {infoBox &&
          (infoBox.couponDurationDate ? (
            <div
              className="green-icon-text coupon-info"
              data-testid="coupon-success-with-date"
            >
              <Image src={INFO_ICON} alt="" />

              <Localized
                id={infoBox.message}
                vars={{
                  couponDurationDate: getLocalizedDate(
                    infoBox.couponDurationDate,
                    true
                  ),
                }}
              >
                {infoBox.message}
              </Localized>
            </div>
          ) : (
            <div
              className="green-icon-text coupon-info"
              data-testid="coupon-success"
            >
              <Image src={INFO_ICON} alt="" />

              <Localized id={infoBox.message}>{infoBox.message}</Localized>
            </div>
          ))} */}
      </div>
    </div>
  );
};

export default PlanDetails;
