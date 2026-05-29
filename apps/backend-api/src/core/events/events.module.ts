import { Module }
  from '@nestjs/common'

import { OutboxModule }
  from '../outbox/outbox.module'

import { EventStoreService }
  from './event-store.service'

import { EventBusService }
  from './event-bus.service'

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
  ],

  exports: [
    EventStoreService,
    EventBusService,
  ],
})
export class EventsModule {}