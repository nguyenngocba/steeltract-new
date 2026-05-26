import { Module } from '@nestjs/common';

import { EventsModule } from '../../../core/events/events.module';
import { PrismaModule } from '../../../core/prisma/prisma.module';
import { UomController } from './uom.controller';
import { UomRepository } from './uom.repository';
import { UomService } from './uom.service';

@Module({
  imports: [PrismaModule, EventsModule],
  controllers: [UomController],
  providers: [UomRepository, UomService],
  exports: [UomService],
})
export class UomModule {}
