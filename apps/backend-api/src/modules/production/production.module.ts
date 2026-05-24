import { Module } from '@nestjs/common';

import { PrismaModule } from '../../core/prisma/prisma.module';
import { AttachmentsModule } from '../attachments/attachments.module';
import { WorkflowModule } from '../workflow/workflow.module';
import { ProductionController } from './production.controller';
import { ProductionRepository } from './repositories/production.repository';
import { ProductionService } from './services/production.service';

@Module({
  imports: [PrismaModule, WorkflowModule, AttachmentsModule],
  controllers: [ProductionController],
  providers: [ProductionRepository, ProductionService],
  exports: [ProductionService],
})
export class ProductionModule {}
