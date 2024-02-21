import { PayPalManager } from './paypal.manager';
import { Kysely } from 'kysely';
import { DB, testAccountDatabaseSetup } from '@fxa/shared/db/mysql/account';
import { PayPalClient } from './paypal.client';
import { faker } from '@faker-js/faker';

describe('paypalManager', () => {
  let paypalManager: PayPalManager;
  let kysleyDb: Kysely<DB>;

  beforeAll(async () => {
    kysleyDb = await testAccountDatabaseSetup([
      'paypalCustomers',
      'accountCustomers',
    ]);
    paypalManager = new PayPalManager(
      kysleyDb,
      new PayPalClient({
        sandbox: false,
        user: faker.string.uuid(),
        pwd: faker.string.uuid(),
        signature: faker.string.uuid(),
      })
    );
  });

  afterAll(async () => {
    if (kysleyDb) {
      await kysleyDb.destroy();
    }
  });

  it('instantiates class (TODO: remove me)', () => {
    expect(paypalManager).toBeTruthy();
  });
});
