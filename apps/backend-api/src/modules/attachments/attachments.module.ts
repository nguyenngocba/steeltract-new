import { Module } from '@nestjs/common';

import { PrismaModule } from '../../core/prisma/prisma.module';
import { StorageModule } from '../../core/storage/storage.module';
import { EventsModule } from '../../core/events/events.module';
import { RbacModule } from '../rbac/rbac.module';

import { AttachmentsController } from './attachments.controller';
import { AttachmentsRepository } from './repositories/attachments.repository';
import { AttachmentsService } from './services/attachments.service';

@Module({
  imports: [
    PrismaModule,
    StorageModule,
    RbacModule,
    EventsModule,
  ],

  controllers: [
    AttachmentsController,
  ],

  providers: [
    AttachmentsRepository,
    AttachmentsService,
  ],

  exports: [
    AttachmentsService,
  ],
})
export class AttachmentsModule {}