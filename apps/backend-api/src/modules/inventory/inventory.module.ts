import { Module } from '@nestjs/common'
import { PrismaModule } from '../../core/prisma/prisma.module'

import { InventoryGateway } from './inventory.gateway'
import { InventoryController } from './inventory.controller'
import { InventoryService } from './inventory.service'
import { ReturnWorkflowController } from './return-workflow.controller'
import { ReturnWorkflowService } from './return-workflow.service'
import { CreateTransactionHandler } from './commands/create-transaction.handler'
import { RuntimeWsModule } from '../../core/ws/runtime-ws.module'
import { EventsModule } from '../../core/events/events.module'
import { SnapshotsModule } from '../../core/snapshots/snapshots.module'
import { TelemetryModule } from '../../core/telemetry/telemetry.module'
import { ListTransactionsHandler } from './queries/list-transactions.handler'
import { InventoryRepository } from './inventory.repository'
import { InventoryEventService } from './inventory-event.service'
import { InventoryReadModelService } from './inventory-read-model.service'
import { InventoryPostingService } from './inventory-posting.service'

import { ZonesController } from './zones.controller'
import { InventoryCategoriesController } from './inventory-categories.controller'
import { InventoryUnitsController } from './inventory-units.controller'
import { MaterialTypesController } from './material-types.controller'
@Module({
imports: [
  PrismaModule,
  RuntimeWsModule,
  EventsModule,
  SnapshotsModule,
  TelemetryModule,
],
controllers: [
  InventoryController,
  ReturnWorkflowController,

  ZonesController,

  InventoryCategoriesController,

  InventoryUnitsController,

  MaterialTypesController,
],

  providers: [
    InventoryService,
    InventoryRepository,
    InventoryEventService,
    InventoryReadModelService,
    InventoryPostingService,
    ReturnWorkflowService,
    InventoryGateway,
    CreateTransactionHandler,
    ListTransactionsHandler,
  ],

  exports: [
    InventoryService,
    InventoryRepository,
    InventoryEventService,
    InventoryReadModelService,
    InventoryPostingService,
  ],
})
export class InventoryModule {}
