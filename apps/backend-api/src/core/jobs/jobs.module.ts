import { Global, Module } from '@nestjs/common';

import { RbacModule } from '../../modules/rbac/rbac.module';

import { PrismaModule } from '../prisma/prisma.module';
import { OutboxModule } from '../outbox/outbox.module';
import { EventsModule } from '../events/events.module';

import { JobsController } from './jobs.controller';
import { JobSchedulerService } from './job-scheduler.service';
import { JobWorkerService } from './job-worker.service';

@Global()
@Module({
  imports: [
    PrismaModule,
    EventsModule,
    OutboxModule,
    RbacModule,
  ],
  controllers: [JobsController],
  providers: [
    JobSchedulerService,
    JobWorkerService,
  ],
  exports: [
    JobSchedulerService,
    JobWorkerService,
  ],
})
export class JobsModule {}