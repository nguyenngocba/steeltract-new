import {
  Inject,
  Injectable,
} from '@nestjs/common';

import { DomainEventMetadata } from './domain-event.interface';
import { EventBusService } from './event-bus.service';

@Injectable()
export class EventPublisherService {
  constructor(
    @Inject(EventBusService)
    private readonly eventBus: EventBusService,
  ) {}

  publish<TPayload>(
    eventName: string,
    payload: TPayload,
    metadata?: DomainEventMetadata,
  ) {
    return this.eventBus.emit(eventName, payload, metadata);
  }

  publishPersistent<TPayload>(
    eventName: string,
    payload: TPayload,
    metadata?: DomainEventMetadata,
  ) {
    return this.eventBus.emit(eventName, payload, {
      ...metadata,
      persistToOutbox: true,
    });
  }
}
