import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ValidationPipe } from '@nestjs/common'
import { NestExpressApplication } from '@nestjs/platform-express'
import { join } from 'path'
import { CommandBus } from './core/cqrs/command.bus'
import { registerInventoryRuntime } from './modules/inventory/inventory.runtime'
import { CreateTransactionHandler } from './modules/inventory/commands/create-transaction.handler'
import { QueryBus } from './core/cqrs/query.bus'
import { ListTransactionsHandler } from './modules/inventory/queries/list-transactions.handler'
async function bootstrap() {
  const app =
    await NestFactory.create<NestExpressApplication>(
      AppModule,
    )

  app.enableCors()

  app.useGlobalPipes(
    new ValidationPipe(),
  )

  app.useStaticAssets(
    join(
      __dirname,
      '..',
      'uploads',
    ),
    {
      prefix: '/uploads/',
    },
  )

  const commandBus =
    app.get(CommandBus)

  const queryBus =
    app.get(QueryBus)

  const createTransactionHandler =
    app.get(
      CreateTransactionHandler,
    )

  const listTransactionsHandler =
    app.get(
      ListTransactionsHandler,
    )

  registerInventoryRuntime(
    commandBus,

    queryBus,

    createTransactionHandler,

    listTransactionsHandler,
  )

  await app.listen(
  3000,
  '0.0.0.0',
)
}

bootstrap()