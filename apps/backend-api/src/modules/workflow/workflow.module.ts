import { Module } from '@nestjs/common';

import { PrismaModule } from '../../core/prisma/prisma.module';
import { RbacModule } from '../rbac/rbac.module';
import { WorkflowRepository } from './repositories/workflow.repository';
import { WorkflowNotificationSubscriber } from './services/workflow-notification-subscriber.service';
import { WorkflowService } from './services/workflow.service';
import { WorkflowController } from './workflow.controller';
import { EventsModule } from '../../core/events/events.module';
@Module({
imports: [
  PrismaModule,
  RbacModule,
  EventsModule,
],
  controllers: [WorkflowController],
  providers: [
    WorkflowRepository,
    WorkflowService,
    WorkflowNotificationSubscriber,
  ],
  exports: [WorkflowService],
})
export class WorkflowModule {}
