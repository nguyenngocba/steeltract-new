import { Module } from '@nestjs/common';

import { EventsModule } from '../../core/events/events.module';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { AttachmentsModule } from '../attachments/attachments.module';
import { WorkflowModule } from '../workflow/workflow.module';
import { QcRepository } from './repositories/qc.repository';
import { QcService } from './services/qc.service';
import { QcController } from './qc.controller';

@Module({
  imports: [PrismaModule, EventsModule, AttachmentsModule, WorkflowModule],
  controllers: [QcController],
  providers: [QcService, QcRepository],
  exports: [QcService],
})
export class QcModule {}
