import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { CommandBus } from './core/cqrs/command.bus';
import { registerInventoryRuntime } from './modules/inventory/inventory.runtime';
import { CreateTransactionHandler } from './modules/inventory/commands/create-transaction.handler';
import { QueryBus } from './core/cqrs/query.bus';
import { ListTransactionsHandler } from './modules/inventory/queries/list-transactions.handler';
import { Logger } from '@nestjs/common';
import { loadDeploymentConfig } from './config/deployment-config';
async function bootstrap() {
  const config = loadDeploymentConfig();
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: config.logLevels,
  });

  app.enableShutdownHooks();

  app.enableCors({
    origin: config.corsOrigins,
    credentials: true,
  });

  if (config.trustProxy !== false) {
    app.set('trust proxy', config.trustProxy);
  }

  app.useGlobalPipes(new ValidationPipe());

  app.useStaticAssets(config.storageRoot, {
    prefix: '/uploads/',
  });

  const commandBus = app.get(CommandBus);

  const queryBus = app.get(QueryBus);

  const createTransactionHandler = app.get(CreateTransactionHandler);

  const listTransactionsHandler = app.get(ListTransactionsHandler);

  registerInventoryRuntime(
    commandBus,

    queryBus,

    createTransactionHandler,

    listTransactionsHandler,
  );

  await app.listen(config.port, config.host);

  Logger.log(
    `SteelTrack API listening on ${config.host}:${config.port} (${config.nodeEnv})`,
    'Bootstrap',
  );
}

void bootstrap().catch((error: unknown) => {
  Logger.error(
    error instanceof Error ? error.message : 'Unknown startup failure',
    error instanceof Error ? error.stack : undefined,
    'Bootstrap',
  );
  process.exitCode = 1;
});
