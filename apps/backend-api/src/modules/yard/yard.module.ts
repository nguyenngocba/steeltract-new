import { Module } from '@nestjs/common';

import { EventsModule } from '../../core/events/events.module';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { AttachmentsModule } from '../attachments/attachments.module';
import { YardRepository } from './repositories/yard.repository';
import { YardService } from './services/yard.service';
import { YardController } from './yard.controller';

@Module({
  imports: [PrismaModule, EventsModule, AttachmentsModule],
  controllers: [YardController],
  providers: [YardService, YardRepository],
  exports: [YardService],
})
export class YardModule {}
