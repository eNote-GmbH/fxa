/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { dotenvLoader, fileLoader, TypedConfigModule } from 'nest-typed-config';

import { CartManager, CartService } from '@fxa/payments/cart';
import {
  AccountDatabase,
  AccountDbProvider,
  setupAccountDatabase,
} from '@fxa/shared/db/mysql/account';
import { MySQLConfig } from '@fxa/shared/db/mysql/core';
import { Module, Provider } from '@nestjs/common';

import { RootConfig } from './config';

const AccountDatabaseFactory: Provider<AccountDatabase> = {
  provide: AccountDbProvider,
  useFactory: (mysqlConfig: MySQLConfig) => {
    return setupAccountDatabase(mysqlConfig);
  },
  inject: [MySQLConfig],
};

@Module({
  imports: [
    TypedConfigModule.forRoot({
      schema: RootConfig,
      load: [
        dotenvLoader({ separator: '__', ignoreEnvFile: true }),
        fileLoader(),
      ],
    }),
  ],
  controllers: [],
  providers: [CartService, CartManager, AccountDatabaseFactory],
})
export class AppModule {}
