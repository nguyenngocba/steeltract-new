import { OnModuleInit } from '@nestjs/common';

import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import { Server, Socket } from 'socket.io';

import { EventBusService } from '../events/event-bus.service';
import { EventThrottleService } from '../performance/event-throttle.service';
import { PerformanceMetricsService } from '../performance/performance-metrics.service';
import { WebsocketRoomService } from '../performance/websocket-room.service';
import { WebsocketEventMapper } from './websocket-event-mapper';
import {
  WebsocketDomainEventPayload,
  bridgedDomainEventNames,
  websocketEventNames,
} from './websocket-events';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway implements OnModuleInit {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly eventBus: EventBusService,
    private readonly mapper: WebsocketEventMapper,
    private readonly throttle: EventThrottleService,
    private readonly metrics: PerformanceMetricsService,
    private readonly rooms: WebsocketRoomService,
  ) {}

  onModuleInit() {
    bridgedDomainEventNames.forEach((eventName) => {
      this.eventBus.subscribe(eventName, (event) => {
        this.emitDomainEvent(this.mapper.toWebsocketPayload(event));
      });
    });
  }

  emitEvent(event: string, data: WebsocketDomainEventPayload) {
    this.emitSelective(event, data);
  }

  private emitDomainEvent(data: WebsocketDomainEventPayload) {
    const key = `${data.event}:${data.entityId ?? ''}:${data.changedFields?.join(',') ?? ''}`;

    if (this.throttle.shouldDrop(key)) {
      this.metrics.recordWebsocketDedupe();

      return;
    }

    this.emitSelective(websocketEventNames.domainEvent, data);
    this.emitSelective(data.event, data);
  }

  private emitSelective(event: string, data: WebsocketDomainEventPayload) {
    const rooms = this.rooms.defaultRooms(data.event, data.entityId);

    if (rooms.length === 0) {
      this.server.emit(event, data);
      this.metrics.recordWebsocketEmit();

      return;
    }

    this.server.to(rooms).emit(event, data);
    this.server.except(rooms).emit(event, data);
    this.metrics.recordWebsocketEmit();
  }

  @SubscribeMessage('subscribe.domain')
  subscribeDomain(client: Socket, @MessageBody() payload: { domain?: string }) {
    if (!payload.domain) {
      this.metrics.recordWebsocketDrop();

      return {
        ok: false,
      };
    }

    void client.join(`domain:${payload.domain}`);

    return {
      ok: true,
      room: `domain:${payload.domain}`,
    };
  }

  @SubscribeMessage('unsubscribe.domain')
  unsubscribeDomain(
    client: Socket,
    @MessageBody() payload: { domain?: string },
  ) {
    if (payload.domain) {
      void client.leave(`domain:${payload.domain}`);
    }

    return {
      ok: true,
    };
  }
}
