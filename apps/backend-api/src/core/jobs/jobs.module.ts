import { Global, Module } from '@nestjs/common';

import { RbacModule } from '../../modules/rbac/rbac.module';

import { PrismaModule } from '../prisma/prisma.module';
import { OutboxModule } from '../outbox/outbox.module';
import { EventsModule } from '../events/events.module';
import { SnapshotsModule } from '../snapshots/snapshots.module';
import { ProjectionModule } from '../projections/projection.module';

import { JobsController } from './jobs.controller';
import { BackgroundJobManager } from './background-job-manager.service';
import { EventConsumerService } from '../events/event-consumer.service';
import { JobSchedulerService } from './job-scheduler.service';
import { JobRetryPolicyService } from './job-retry-policy.service';
import { JobWorkerService } from './job-worker.service';
import { SnapshotRebuilder } from './snapshot-rebuilder.service';
import { SnapshotUpdateDispatcher } from './snapshot-update-dispatcher.service';

@Global()
@Module({
  imports: [
    PrismaModule,
    EventsModule,
    OutboxModule,
    SnapshotsModule,
    ProjectionModule,
    RbacModule,
  ],
  controllers: [JobsController],
  providers: [
    BackgroundJobManager,
    EventConsumerService,
    JobSchedulerService,
    JobRetryPolicyService,
    JobWorkerService,
    SnapshotRebuilder,
    SnapshotUpdateDispatcher,
  ],
  exports: [
    BackgroundJobManager,
    JobSchedulerService,
    JobWorkerService,
    SnapshotRebuilder,
    SnapshotUpdateDispatcher,
  ],
})
export class JobsModule {}
