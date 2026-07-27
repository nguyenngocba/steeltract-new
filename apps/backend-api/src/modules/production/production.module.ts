import { Module } from '@nestjs/common';

import { PrismaModule } from '../../core/prisma/prisma.module';
import { SnapshotsModule } from '../../core/snapshots/snapshots.module';
import { AttachmentsModule } from '../attachments/attachments.module';
import { WorkflowModule } from '../workflow/workflow.module';
import { ProductionController } from './production.controller';
import { ProductionCommandController } from './production-command.controller';
import { BomRepository } from './repositories/bom.repository';
import { MaterialIssueRepository } from './repositories/material-issue.repository';
import { ProductionConsumptionRepository } from './repositories/production-consumption.repository';
import { ProductionMaterialLedgerRepository } from './repositories/production-material-ledger.repository';
import { ProductionOrderRepository } from './repositories/production-order.repository';
import { ProductionRepository } from './repositories/production.repository';
import { ProductionReservationRepository } from './repositories/production-reservation.repository';
import { RoutingRepository } from './repositories/routing.repository';
import { WorkCenterRepository } from './repositories/work-center.repository';
import { WorkOrderRepository } from './repositories/work-order.repository';
import { ProductionService } from './services/production.service';
import { EventsModule } from '../../core/events/events.module';
import { BOMService } from './services/bom.service';
import { MaterialIssueService } from './services/material-issue.service';
import { ProductionConsumptionService } from './services/production-consumption.service';
import { ProductionBomMaterializationService } from './services/production-bom-materialization.service';
import { ProductionMaterialLedgerService } from './services/production-material-ledger.service';
import { ProductionReservationService } from './services/production-reservation.service';
import { ProductionCommandService } from './services/production-command.service';
import { ComponentsModule } from '../components/components.module';
import { InventoryModule } from '../inventory/inventory.module';
import { YardModule } from '../yard/yard.module';
@Module({
  imports: [
    PrismaModule,
    SnapshotsModule,
    WorkflowModule,
    AttachmentsModule,
    EventsModule,
    ComponentsModule,
    InventoryModule,
    YardModule,
  ],
  controllers: [ProductionController, ProductionCommandController],
  providers: [
    BomRepository,
    MaterialIssueRepository,
    ProductionConsumptionRepository,
    ProductionMaterialLedgerRepository,
    ProductionOrderRepository,
    ProductionRepository,
    ProductionReservationRepository,
    RoutingRepository,
    WorkCenterRepository,
    WorkOrderRepository,
    ProductionService,
    BOMService,
    MaterialIssueService,
    ProductionBomMaterializationService,
    ProductionConsumptionService,
    ProductionMaterialLedgerService,
    ProductionReservationService,
    ProductionCommandService,
  ],
  exports: [ProductionService, ProductionCommandService],
})
export class ProductionModule {}
