import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';

import { EventBusService } from '../../../core/events/event-bus.service';
import { DomainEvent } from '../../../core/events/domain-event.interface';
import { WorkflowRepository } from '../repositories/workflow.repository';

interface NotificationRequestedPayload {
  title: string;
  message: string;
  type?: string;
  severity?: string;
  link?: string;
  userId?: string;
  metadata?: unknown;
}

@Injectable()
export class WorkflowNotificationSubscriber
  implements OnModuleInit, OnModuleDestroy
{
  private unsubscribe?: () => void;

  constructor(
    private readonly eventBus: EventBusService,
    private readonly repository: WorkflowRepository,
  ) {}

  onModuleInit() {
    this.unsubscribe = this.eventBus.subscribe<
      NotificationRequestedPayload,
      'notification.requested'
    >('notification.requested', (event) =>
      this.handleNotificationRequested(event),
    );
  }

  onModuleDestroy() {
    this.unsubscribe?.();
  }

  private async handleNotificationRequested(
    event: DomainEvent<'notification.requested', NotificationRequestedPayload>,
  ) {
    await this.repository.createNotification({
      title: event.payload.title,
      message: event.payload.message,
      type: event.payload.type,
      severity: event.payload.severity,
      link: event.payload.link,
      userId: event.payload.userId,
    });
  }
}
