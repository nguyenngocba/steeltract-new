import { Module } from '@nestjs/common';

import { PrismaModule } from '../../core/prisma/prisma.module';
import { SnapshotsModule } from '../../core/snapshots/snapshots.module';
import { AttachmentsModule } from '../attachments/attachments.module';
import { ComponentsModule } from '../components/components.module';
import { YardRepository } from './repositories/yard.repository';
import { YardReadModelRepository } from './repositories/yard-read-model.repository';
import { YardReadModelService } from './services/yard-read-model.service';
import { YardCommandService } from './services/yard-command.service';
import { YardService } from './services/yard.service';
import { YardSnapshotReadService } from './services/yard-snapshot-read.service';
import { YardController } from './yard.controller';

@Module({
  imports: [PrismaModule, SnapshotsModule, AttachmentsModule, ComponentsModule],
  controllers: [YardController],
  providers: [
    YardService,
    YardCommandService,
    YardReadModelService,
    YardSnapshotReadService,
    YardRepository,
    YardReadModelRepository,
  ],
  exports: [YardService, YardCommandService, YardSnapshotReadService],
})
export class YardModule {}
