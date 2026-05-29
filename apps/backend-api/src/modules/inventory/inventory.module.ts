import { Module } from '@nestjs/common'
import { PrismaModule } from '../../core/prisma/prisma.module'
import { InventoryGateway } from './inventory.gateway'
import { InventoryController } from './inventory.controller'
import { InventoryService } from './inventory.service'
import { ReturnWorkflowService } from './return-workflow.service'
import { CreateTransactionHandler } from './commands/create-transaction.handler'
import { RuntimeWsModule } from '../../core/ws/runtime-ws.module'
import { EventsModule } from '../../core/events/events.module'
import { TelemetryModule } from '../../core/telemetry/telemetry.module'
import { ListTransactionsHandler } from './queries/list-transactions.handler'
@Module({
imports: [
  PrismaModule,
  RuntimeWsModule,
  EventsModule,
  TelemetryModule,
],
  controllers: [
    InventoryController,
  ],

  providers: [
    InventoryService,
    ReturnWorkflowService,
    InventoryGateway,
    CreateTransactionHandler,
    ListTransactionsHandler,
  ],

  exports: [
    InventoryService,
  ],
})
export class InventoryModule {}
