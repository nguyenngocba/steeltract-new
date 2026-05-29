import { CommandBus }
  from '../../core/cqrs/command.bus'

import { QueryBus }
  from '../../core/cqrs/query.bus'

import { CreateTransactionHandler }
  from './commands/create-transaction.handler'

import { ListTransactionsHandler }
  from './queries/list-transactions.handler'

export function registerInventoryRuntime(
  commandBus: CommandBus,

  queryBus: QueryBus,

  createTransactionHandler:
    CreateTransactionHandler,

  listTransactionsHandler:
    ListTransactionsHandler,
) {
  commandBus.register(
    'inventory.create.transaction',

    (payload) =>
      createTransactionHandler.execute(
        payload,
      ),
  )

  queryBus.register(
    'inventory.list.transactions',

    () =>
      listTransactionsHandler.execute(),
  )
}