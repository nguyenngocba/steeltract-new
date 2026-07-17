import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { ProjectionController } from './projection.controller';
import { ProjectionEngineService } from './projection-engine.service';
import { ProjectionQueryService } from './projection-query.service';
import { ProjectionRegistryService } from './projection-registry.service';
import { ProjectionReplayService } from './projection-replay.service';
import { ProjectionRepository } from './projection.repository';

@Module({
  imports: [PrismaModule],
  controllers: [ProjectionController],
  providers: [
    ProjectionRepository,
    ProjectionRegistryService,
    ProjectionEngineService,
    ProjectionReplayService,
    ProjectionQueryService,
  ],
  exports: [
    ProjectionEngineService,
    ProjectionReplayService,
    ProjectionQueryService,
  ],
})
export class ProjectionModule {}
