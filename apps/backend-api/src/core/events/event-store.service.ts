import { Injectable }
  from '@nestjs/common'

import { DomainEvent }
  from './domain-event'

@Injectable()
export class EventStoreService {
  private events:
    DomainEvent[] = []

  append(
    event: DomainEvent,
  ) {
    this.events.unshift(
      event,
    )

    console.log(
      '[Event Store]',
      event.type,
    )
  }

  list() {
    return this.events
  }
}
