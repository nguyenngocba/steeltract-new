import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { ProjectionController } from './projection.controller';
import { ProjectionEngineService } from './projection-engine.service';
import { ProjectionQueryService } from './projection-query.service';
import { ProjectionRegistryService } from './projection-registry.service';
import { ProjectionReplayService } from './projection-replay.service';
import { ProjectionRepository } from './projection.repository';
import { EnterpriseQueryController } from './enterprise-query.controller';
import { EnterpriseQueryService } from './enterprise-query.service';

@Module({
  imports: [PrismaModule],
  controllers: [ProjectionController, EnterpriseQueryController],
  providers: [
    ProjectionRepository,
    ProjectionRegistryService,
    ProjectionEngineService,
    ProjectionReplayService,
    ProjectionQueryService,
    EnterpriseQueryService,
  ],
  exports: [
    ProjectionEngineService,
    ProjectionReplayService,
    ProjectionQueryService,
    EnterpriseQueryService,
  ],
})
export class ProjectionModule {}
