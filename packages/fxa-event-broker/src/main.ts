/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Important! Must be imported first! This makes sure that sentry and tracing can
// hook into node BEFORE any frameworks are initialized/imported.
import './monitoring';

import { NestApplicationOptions } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import mozLog from 'mozlog';

import { SentryInterceptor } from 'fxa-shared/nestjs/sentry/sentry.interceptor';
import { initTracing } from 'fxa-shared/tracing/node-tracing';

import { AppModule } from './app.module';
import Config, { AppConfig } from './config';

async function bootstrap() {
  // Initialize tracing first
  initTracing(
    Config.getProperties().tracing,
    mozLog(Config.getProperties().log)(Config.getProperties().log.app)
  );

  const nestConfig: NestApplicationOptions = {};
  if (Config.getProperties().env !== 'development') {
    nestConfig.logger = false;
  }
  const app = await NestFactory.create(AppModule, nestConfig);
  const config: ConfigService<AppConfig> = app.get(ConfigService);
  const proxyConfig = config.get('proxy') as AppConfig['proxy'];

  // Add sentry as error reporter
  app.useGlobalInterceptors(new SentryInterceptor());

  // Starts listening for shutdown hooks
  app.enableShutdownHooks();

  await app.listen(proxyConfig.port);
}
bootstrap();
