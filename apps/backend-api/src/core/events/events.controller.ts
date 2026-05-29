import {
  Controller,
  Get,
} from '@nestjs/common'

import { EventStoreService }
  from './event-store.service'

@Controller('runtime-events')
export class EventsController {
  constructor(
    private readonly eventStore:
      EventStoreService,
  ) {}

  @Get()
  list() {
    return this.eventStore
      .list()
  }
}
