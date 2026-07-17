import { Module } from '@nestjs/common';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { ComponentsController } from './components.controller';
import { ComponentsRepository } from './repositories/components.repository';
import { ComponentCostingRepository } from './repositories/component-costing.repository';
import { ComponentsReadModelRepository } from './repositories/components-read-model.repository';
import { ComponentCostingService } from './services/component-costing.service';
import { ComponentsService } from './services/components.service';
import { ComponentsReadModelService } from './services/components-read-model.service';
import { EventsModule } from '../../core/events/events.module';
import { SnapshotsModule } from '../../core/snapshots/snapshots.module';
import { ComponentsSnapshotReadService } from './services/components-snapshot-read.service';
import { ComponentCommandService } from './services/component-command.service';
import { ComponentCommandController } from './component-command.controller';

@Module({
  imports: [PrismaModule, EventsModule, SnapshotsModule],
  controllers: [ComponentsController, ComponentCommandController],
  providers: [
    ComponentsRepository,
    ComponentCostingRepository,
    ComponentsReadModelRepository,
    ComponentsService,
    ComponentCostingService,
    ComponentsReadModelService,
    ComponentsSnapshotReadService,
    ComponentCommandService,
  ],
  exports: [
    ComponentsService,
    ComponentCostingService,
    ComponentsSnapshotReadService,
    ComponentCommandService,
  ],
})
export class ComponentsModule {}
