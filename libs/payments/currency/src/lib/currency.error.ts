import { BaseError } from '@fxa/shared/error';

export class CurrencyError extends BaseError {
  constructor(message: string, info: Record<string, any>, cause?: Error) {
    super(message, {
      name: 'CurrencyError',
      cause,
      info,
    });
  }
}

export class CurrencyCountryMismatch extends CurrencyError {
  constructor(currency: string, country: string) {
    super('Funding source country does not match plan currency.', {
      currency,
      country,
    });
  }
}
