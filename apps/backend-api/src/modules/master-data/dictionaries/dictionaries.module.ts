import { Module } from '@nestjs/common';

import { EventsModule } from '../../../core/events/events.module';
import { PrismaModule } from '../../../core/prisma/prisma.module';
import { DictionariesController } from './dictionaries.controller';
import { DictionariesService } from './dictionaries.service';

@Module({
  imports: [PrismaModule, EventsModule],
  controllers: [DictionariesController],
  providers: [DictionariesService],
})
export class DictionariesModule {}
