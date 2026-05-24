import { Module } from '@nestjs/common';

import { PrismaModule } from '../../core/prisma/prisma.module';

import { ComponentsController } from './components.controller';
import { ComponentsRepository } from './repositories/components.repository';
import { ComponentsService } from './services/components.service';

@Module({
  imports: [PrismaModule],
  controllers: [ComponentsController],
  providers: [ComponentsRepository, ComponentsService],
  exports: [ComponentsService],
})
export class ComponentsModule {}
