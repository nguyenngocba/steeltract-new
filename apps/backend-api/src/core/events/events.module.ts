import { Module }
  from '@nestjs/common'

import { OutboxModule }
  from '../outbox/outbox.module'

import { EventStoreService }
  from './event-store.service'

import { EventBusService }
  from './event-bus.service'

import { EventPublisherService }
  from './event-publisher.service'

import { EventsController }
  from './events.controller'

@Module({
  imports: [
    OutboxModule,
  ],

  controllers: [
    EventsController,
  ],

  providers: [
    EventStoreService,
    EventBusService,
    EventPublisherService,
  ],

  exports: [
    EventStoreService,
    EventBusService,
    EventPublisherService,
  ],
})
export class EventsModule {}
