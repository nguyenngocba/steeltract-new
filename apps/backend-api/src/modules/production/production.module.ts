import { Module } from '@nestjs/common';

import { PrismaModule } from '../../core/prisma/prisma.module';
import { AttachmentsModule } from '../attachments/attachments.module';
import { WorkflowModule } from '../workflow/workflow.module';
import { ProductionController } from './production.controller';
import { ProductionRepository } from './repositories/production.repository';
import { ProductionService } from './services/production.service';
import { EventsModule } from '../../core/events/events.module'
import { BOMService } from './services/bom.service';
import { MaterialIssueService } from './services/material-issue.service';
import { InventoryModule } from '../inventory/inventory.module';
import { YardModule } from '../yard/yard.module';
@Module({
  imports: [
    PrismaModule,
    WorkflowModule,
    AttachmentsModule,
    EventsModule,
    InventoryModule,
    YardModule,
  ],
  controllers: [ProductionController],
  providers: [
    ProductionRepository,
    ProductionService,
    BOMService,
    MaterialIssueService,
  ],
  exports: [ProductionService],
})
export class ProductionModule {}
