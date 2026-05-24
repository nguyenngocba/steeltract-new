import { Global, Module } from '@nestjs/common';

import { OutboxModule } from '../outbox/outbox.module';
import { EventBusService } from './event-bus.service';

@Global()
@Module({
  imports: [OutboxModule],
  providers: [EventBusService],
  exports: [EventBusService],
})
export class EventsModule {}
