import { IntelligenceEvent } from './event.types'

class IndustrialDataLake {
  private events:
    IntelligenceEvent[] = []

  ingest(
    event: IntelligenceEvent,
  ) {
    this.events.unshift(event)
  }

  query() {
    return this.events
  }
}

export const industrialDataLake =
  new IndustrialDataLake()
