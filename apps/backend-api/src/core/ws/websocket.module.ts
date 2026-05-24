import { Global, Module } from '@nestjs/common';

import { EventsModule } from '../events/events.module';
import { EventsGateway } from './events.gateway';
import { WebsocketEventMapper } from './websocket-event-mapper';

@Global()
@Module({
  imports: [EventsModule],
  providers: [EventsGateway, WebsocketEventMapper],
  exports: [EventsGateway],
})
export class WebsocketModule {}
