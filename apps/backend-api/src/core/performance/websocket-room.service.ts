import { Injectable } from '@nestjs/common';

@Injectable()
export class WebsocketRoomService {
  domainRoom(eventName: string) {
    const [domain] = eventName.split('.');

    return domain ? `domain:${domain}` : 'domain:system';
  }

  entityRoom(eventName: string, entityId?: string) {
    if (!entityId) {
      return undefined;
    }

    return `${this.domainRoom(eventName)}:${entityId}`;
  }

  defaultRooms(eventName: string, entityId?: string) {
    return [
      this.domainRoom(eventName),
      this.entityRoom(eventName, entityId),
    ].filter(Boolean) as string[];
  }
}
