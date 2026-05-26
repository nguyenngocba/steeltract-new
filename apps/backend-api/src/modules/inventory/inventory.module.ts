import { Module } from '@nestjs/common';

import { PrismaModule } from '../../core/prisma/prisma.module';

import { InventoryController } from './inventory.controller';
import { InventoryRepository } from './inventory.repository';
import { InventoryService } from './inventory.service';
import { ReturnWorkflowController } from './return-workflow.controller';
import { ReturnWorkflowService } from './return-workflow.service';

@Module({
  imports: [PrismaModule],
  controllers: [InventoryController, ReturnWorkflowController],
  providers: [InventoryRepository, InventoryService, ReturnWorkflowService],
  exports: [InventoryService],
})
export class InventoryModule {}
