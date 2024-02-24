import { faker } from '@faker-js/faker';
import { Kysely } from 'kysely';

import { DB, testAccountDatabaseSetup } from '@fxa/shared/db/mysql/account';

import {
  NVPErrorFactory,
  NVPErrorResponseFactory,
  NVPSetExpressCheckoutResponseFactory,
} from './factories';
import { PayPalClient } from './paypal.client';
import { PayPalManager } from './paypal.manager';
import { PayPalClientError, PayPalNVPError } from './paypal.error';

describe('paypalManager', () => {
  let kyselyDb: Kysely<DB>;
  // let mockResult: any;
  let paypalClient: PayPalClient;
  let paypalManager: PayPalManager;

  beforeAll(async () => {
    kyselyDb = await testAccountDatabaseSetup([
      'paypalCustomers',
      'accountCustomers',
    ]);

    paypalClient = new PayPalClient({
      sandbox: false,
      user: faker.string.uuid(),
      pwd: faker.string.uuid(),
      signature: faker.string.uuid(),
    });

    paypalManager = new PayPalManager(kyselyDb, paypalClient);
  });

  afterAll(async () => {
    if (kyselyDb) {
      await kyselyDb.destroy();
    }
  });

  it('instantiates class (TODO: remove me)', () => {
    expect(paypalManager).toBeTruthy();
  });

  describe('getCheckoutToken', () => {
    const successfulSetExpressCheckoutResponse =
      NVPSetExpressCheckoutResponseFactory({
        TOKEN: 'EC-8TY61248BW7426009',
      });

    const validOptions = { currencyCode: faker.finance.currencyCode() };

    it('returns token', async () => {
      paypalClient.setExpressCheckout = jest
        .fn()
        .mockResolvedValueOnce(successfulSetExpressCheckoutResponse);

      const token = await paypalManager.getCheckoutToken(validOptions);
      expect(token).toEqual(successfulSetExpressCheckoutResponse.TOKEN);
    });

    it('throws an error', async () => {
      const raw = faker.word.words();
      const data = NVPErrorResponseFactory({ L: [NVPErrorFactory()] });
      const message = faker.word.words();
      const nvpError = new PayPalNVPError(raw, data, {
        message,
      });
      const error = new PayPalClientError([nvpError], raw, data);

      paypalClient.setExpressCheckout = jest.fn().mockRejectedValueOnce(error);

      expect(paypalManager.getCheckoutToken(validOptions)).rejects.toThrow(
        error
      );
    });

    it('calls setExpressCheckout with passed options', async () => {
      paypalClient.setExpressCheckout = jest
        .fn()
        .mockResolvedValueOnce(successfulSetExpressCheckoutResponse);

      await paypalManager.getCheckoutToken(validOptions);

      expect(paypalClient.setExpressCheckout).toBeCalledTimes(1);
      expect(paypalClient.setExpressCheckout).toBeCalledWith(validOptions);
    });
  });
});
