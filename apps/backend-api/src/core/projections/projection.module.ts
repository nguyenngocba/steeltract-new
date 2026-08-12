import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { ProjectionController } from './projection.controller';
import { ProjectionEngineService } from './projection-engine.service';
import { ProjectionQueryService } from './projection-query.service';
import { ProjectionRegistryService } from './projection-registry.service';
import { ProjectionReplayService } from './projection-replay.service';
import { ProjectionRepository } from './projection.repository';
import { ProjectionWatermarkService } from './projection-watermark.service';
import { EnterpriseQueryController } from './enterprise-query.controller';
import { EnterpriseQueryService } from './enterprise-query.service';

@Module({
  imports: [PrismaModule],
  controllers: [ProjectionController, EnterpriseQueryController],
  providers: [
    ProjectionRepository,
    ProjectionWatermarkService,
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
    ProjectionWatermarkService,
    EnterpriseQueryService,
  ],
})
export class ProjectionModule {}
