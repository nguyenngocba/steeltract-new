import { Module } from '@nestjs/common'

import { PrismaModule }
  from '../../core/prisma/prisma.module'
import { SnapshotsModule }
  from '../../core/snapshots/snapshots.module'
import { EventsModule }
  from '../../core/events/events.module'

import { ProjectsController }
  from './projects.controller'

import { ProjectsService }
  from './services/projects.service'

import { ProjectsRepository }
  from './repositories/projects.repository'

import { ComponentsModule }
  from '../components/components.module'

import { RbacModule }
  from '../rbac/rbac.module'

@Module({
  imports: [
    PrismaModule,
    ComponentsModule,
    RbacModule,
    SnapshotsModule,
    EventsModule,
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
