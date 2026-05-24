import { Injectable, Logger } from '@nestjs/common';

import { randomUUID } from 'crypto';

import { OutboxService } from '../outbox/outbox.service';
import { DomainEvent, DomainEventMetadata } from './domain-event.interface';
import { DomainEventHandler } from './event-handler.interface';

export interface AuditEventPayload {
  action: string;
  entity: string;
  entityId?: string | null;
  module?: string | null;
  metadata?: unknown;
}

@Injectable()
export class EventBusService {
  private readonly logger = new Logger(EventBusService.name);
  private readonly handlers = new Map<string, Set<DomainEventHandler>>();

  constructor(private readonly outboxService: OutboxService) {}

  subscribe<TPayload, TName extends string = string>(
    eventName: TName,
    handler: DomainEventHandler<TPayload, TName>,
  ) {
    const handlers = this.handlers.get(eventName) ?? new Set();

    handlers.add(handler);
    this.handlers.set(eventName, handlers);

    return () => {
      handlers.delete(handler);

      if (handlers.size === 0) {
        this.handlers.delete(eventName);
      }
    };
  }

  async emit<TPayload, TName extends string = string>(
    eventName: TName,
    payload: TPayload,
    metadata?: DomainEventMetadata,
  ) {
    const event: DomainEvent<TName, TPayload> = {
      name: eventName,
      payload,
      occurredAt: new Date(),
      metadata: {
        eventId: randomUUID(),
        ...metadata,
      },
    };

    if (event.metadata?.persistToOutbox) {
      await this.outboxService.create({
        eventName,
        payload,
        metadata,
        idempotencyKey: event.metadata.idempotencyKey,
        delaySeconds: event.metadata.outboxDelaySeconds,
        maxRetries: event.metadata.outboxMaxRetries,
      });
    }

    const handlers = this.handlers.get(eventName);

    if (!handlers || handlers.size === 0) {
      return event;
    }

    await Promise.all(
      [...handlers].map(async (handler) => {
        try {
          await handler(event);
        } catch (error) {
          this.logger.error(
            `Domain event handler failed for ${eventName}`,
            error instanceof Error ? error.stack : undefined,
          );
        }
      }),
    );

    return event;
  }

  emitAudit(payload: AuditEventPayload, metadata?: DomainEventMetadata) {
    return this.emit('audit.activity.created', payload, {
      module: payload.module ?? undefined,
      ...metadata,
    });
  }
}
