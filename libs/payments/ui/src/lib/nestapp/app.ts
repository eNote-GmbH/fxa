/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import 'server-only';

import { CartService } from '@fxa/payments/cart';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { LocalizerServer } from '@fxa/shared/l10n/server';

const NEST_APP: symbol = Symbol.for('nestapp');

class AppSingleton {
  private app!: Awaited<
    ReturnType<typeof NestFactory.createApplicationContext>
  >;

  async getApp() {
    if (this.app) return this.app;
    this.app = await NestFactory.createApplicationContext(AppModule);
    return this.app;
  }

  async getLocalizerServer() {
    return (await this.getApp()).get(LocalizerServer);
  }

  async getCartService() {
    return (await this.getApp()).get(CartService);
  }
}

if (!(global as any)[NEST_APP]) {
  (global as any)[NEST_APP] = new AppSingleton();
}

export const app = (global as any)[NEST_APP] as AppSingleton;
