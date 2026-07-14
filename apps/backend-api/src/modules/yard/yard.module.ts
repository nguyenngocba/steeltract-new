import { Module } from '@nestjs/common';

import { PrismaModule } from '../../core/prisma/prisma.module';
import { SnapshotsModule } from '../../core/snapshots/snapshots.module';
import { AttachmentsModule } from '../attachments/attachments.module';
import { YardRepository } from './repositories/yard.repository';
import { YardReadModelRepository } from './repositories/yard-read-model.repository';
import { YardReadModelService } from './services/yard-read-model.service';
import { YardService } from './services/yard.service';
import { YardSnapshotReadService } from './services/yard-snapshot-read.service';
import { YardController } from './yard.controller';

@Module({
  imports: [PrismaModule, SnapshotsModule, AttachmentsModule],
  controllers: [YardController],
  providers: [
    YardService,
    YardReadModelService,
    YardSnapshotReadService,
    YardRepository,
    YardReadModelRepository,
  ],
  exports: [YardService, YardSnapshotReadService],
})
export class YardModule {}
