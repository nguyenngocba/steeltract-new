import { Module } from '@nestjs/common';

import { PrismaModule } from '../../core/prisma/prisma.module';

import { ComponentsModule } from '../components/components.module';
import { ProjectsRepository } from './repositories/projects.repository';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './services/projects.service';

@Module({
  imports: [PrismaModule, ComponentsModule],
  controllers: [ProjectsController],
  providers: [ProjectsRepository, ProjectsService],
})
export class ProjectsModule {}
