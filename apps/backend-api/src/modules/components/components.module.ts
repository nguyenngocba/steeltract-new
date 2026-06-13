import { Module } from '@nestjs/common';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { ComponentsController } from './components.controller';
import { ComponentsRepository } from './repositories/components.repository';
import { ComponentCostingService } from './services/component-costing.service';
import { ComponentsService } from './services/components.service';
import { EventsModule } from '../../core/events/events.module'

@Module({
 imports: [
  PrismaModule,
  EventsModule,
],
  controllers: [ComponentsController],
  providers: [ComponentsRepository, ComponentsService, ComponentCostingService],
  exports: [ComponentsService, ComponentCostingService],
})
export class ComponentsModule {}
