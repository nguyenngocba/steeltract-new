import { Controller, Get, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../../modules/auth/jwt-auth.guard';
import { EventStoreService } from './event-store.service';

@UseGuards(JwtAuthGuard)
@Controller('runtime-events')
export class EventsController {
  constructor(private readonly eventStore: EventStoreService) {}

  @Get()
  list() {
    return this.eventStore.list();
  }
}
