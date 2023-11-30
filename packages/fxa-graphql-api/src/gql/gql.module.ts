/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { NextFunction, Request, Response } from 'express';
import { CustomsModule } from 'fxa-shared/nestjs/customs/customs.module';
import { CustomsService } from 'fxa-shared/nestjs/customs/customs.service';
import { MozLoggerService } from 'fxa-shared/nestjs/logger/logger.service';
import {
  createContext,
  SentryPlugin,
} from 'fxa-shared/nestjs/sentry/sentry.plugin';
import path, { join } from 'path';

import {
  HttpException,
  MiddlewareConsumer,
  Module,
  NestModule,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { BackendModule } from '../backend/backend.module';
import Config, { AppConfig } from '../config';
import { AccountResolver } from './account.resolver';
import { LegalResolver } from './legal.resolver';
import { SubscriptionResolver } from './subscription.resolver';
import { ClientInfoResolver } from './clientInfo.resolver';
import { SessionResolver } from './session.resolver';
const config = Config.getProperties();

/**
 * GraphQL Config Factory for setting up the NestJS GqlModule
 *
 * @param configService
 * @param log
 */
export const GraphQLConfigFactory = async (
  configService: ConfigService<AppConfig>,
  log: MozLoggerService
) => ({
  allowBatchedHttpRequests: true,
  path: '/graphql',
  useGlobalPrefix: true,
  playground: configService.get<string>('env') !== 'production',
  autoSchemaFile: join(path.dirname(__dirname), './schema.gql'),
  context: ({ req, connection }: any) => createContext({ req, connection }),
  // Disabling cors here allows the cors middleware from NestJS to be applied
  cors: false,
  uploads: false,
});

@Module({
  imports: [BackendModule, CustomsModule],
  providers: [
    AccountResolver,
    CustomsService,
    SessionResolver,
    LegalResolver,
    ClientInfoResolver,
    SubscriptionResolver,
    SentryPlugin,
  ],
})
export class GqlModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply((req: Request, res: Response, next: NextFunction) => {
        if (
          config.env !== 'development' &&
          !req.is('application/json') &&
          !req.is('multipart/form-data')
        ) {
          return next(
            new HttpException('Request content type is not supported.', 415)
          );
        }
        next();
      })
      .forRoutes('graphql');
  }
}
