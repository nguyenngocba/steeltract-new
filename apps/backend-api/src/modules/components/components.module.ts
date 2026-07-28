import { Module } from '@nestjs/common';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { ComponentsController } from './components.controller';
import { ComponentInstancesController } from './component-instances.controller';
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
import { ComponentDomainFoundationController } from './component-domain-foundation.controller';
import { ComponentDomainFoundationRepository } from './repositories/component-domain-foundation.repository';
import { ComponentDomainFoundationService } from './services/component-domain-foundation.service';
import { FinishedGoodsEligibilityRepository } from './repositories/finished-goods-eligibility.repository';
import { FinishedGoodsEligibilityService } from './services/finished-goods-eligibility.service';

@Module({
  imports: [PrismaModule, EventsModule, SnapshotsModule],
  controllers: [
    ComponentsController,
    ComponentInstancesController,
    ComponentCommandController,
    ComponentDomainFoundationController,
  ],
  providers: [
    ComponentsRepository,
    ComponentCostingRepository,
    ComponentsReadModelRepository,
    ComponentDomainFoundationRepository,
    FinishedGoodsEligibilityRepository,
    ComponentsService,
    ComponentCostingService,
    ComponentsReadModelService,
    ComponentsSnapshotReadService,
    ComponentCommandService,
    ComponentDomainFoundationService,
    FinishedGoodsEligibilityService,
  ],
  exports: [
    ComponentsService,
    ComponentCostingService,
    ComponentsSnapshotReadService,
    ComponentCommandService,
    ComponentDomainFoundationService,
    FinishedGoodsEligibilityService,
  ],
})
export class ComponentsModule {}
