import { Module } from '@nestjs/common'

import { PrismaModule }
  from '../../core/prisma/prisma.module'

import { ProjectsController }
  from './projects.controller'

import { ProjectsService }
  from './services/projects.service'

import { ProjectsRepository }
  from './repositories/projects.repository'

import { ComponentsModule }
  from '../components/components.module'

@Module({
  imports: [
    PrismaModule,
    ComponentsModule,
  ],

  controllers: [
    ProjectsController,
  ],

  providers: [
    ProjectsService,
    ProjectsRepository,
  ],

  exports: [
    ProjectsService,
  ],
})
export class ProjectsModule {}