import { Module } from '@nestjs/common';

import { EventsModule } from '../../core/events/events.module';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { SnapshotsModule } from '../../core/snapshots/snapshots.module';
import { AttachmentsModule } from '../attachments/attachments.module';
import { WorkflowModule } from '../workflow/workflow.module';
import { QcRepository } from './repositories/qc.repository';
import { QcCockpitRepository } from './repositories/qc-cockpit.repository';
import { QcReadModelRepository } from './repositories/qc-read-model.repository';
import { QcReadModelService } from './services/qc-read-model.service';
import { QcService } from './services/qc.service';
import { QcCommandService } from './services/qc-command.service';
import { QcSnapshotReadService } from './services/qc-snapshot-read.service';
import { QcController } from './qc.controller';

@Module({
  imports: [
    PrismaModule,
    EventsModule,
    SnapshotsModule,
    AttachmentsModule,
    WorkflowModule,
  ],
  controllers: [QcController],
  providers: [
    QcService,
    QcCommandService,
    QcReadModelService,
    QcSnapshotReadService,
    QcRepository,
    QcCockpitRepository,
    QcReadModelRepository,
  ],
  exports: [QcService, QcCommandService, QcSnapshotReadService],
})
export class QcModule {}
