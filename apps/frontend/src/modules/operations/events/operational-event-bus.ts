import type {
  RealtimeEventPayload,
} from '../../../lib/realtime/socket-client'
import {
  getDomainFromEventName,
  matchesWorkspaceEvent,
} from './event-matchers'

import type {
  OperationalDomainEvent,
  WorkspaceEventFilter,
} from './domain-event.types'

type OperationalEventHandler = (
  event: OperationalDomainEvent,
) => void

const maxBufferedEvents = 120
const eventBuffer: OperationalDomainEvent[] = []
const eventTarget = new EventTarget()
const eventType = 'steeltrack.operational-event'

function normalizeRealtimeEvent(
  payload: RealtimeEventPayload,
): OperationalDomainEvent {
  return {
    event: payload.event,
    domain: getDomainFromEventName(payload.event),
    entityId: payload.entityId,
    relatedIds: payload.relatedIds ?? [],
    changedFields: payload.changedFields ?? [],
    occurredAt:
      payload.occurredAt ?? new Date().toISOString(),
  }
}

export function publishOperationalEvent(
  payload: RealtimeEventPayload,
) {
  if (!payload.event) {
    return
  }

  const event = normalizeRealtimeEvent(payload)

  eventBuffer.unshift(event)

  if (eventBuffer.length > maxBufferedEvents) {
    eventBuffer.length = maxBufferedEvents
  }

  eventTarget.dispatchEvent(
    new CustomEvent<OperationalDomainEvent>(eventType, {
      detail: event,
    }),
  )
}

export function getBufferedOperationalEvents(
  filter?: WorkspaceEventFilter,
) {
  return filter
    ? eventBuffer.filter((event) =>
        matchesWorkspaceEvent(event, filter),
      )
    : [...eventBuffer]
}

export function subscribeOperationalEvents(
  handler: OperationalEventHandler,
  filter?: WorkspaceEventFilter,
) {
  const listener = (event: Event) => {
    const customEvent =
      event as CustomEvent<OperationalDomainEvent>

    if (
      matchesWorkspaceEvent(
        customEvent.detail,
        filter,
      )
    ) {
      handler(customEvent.detail)
    }
  }

  eventTarget.addEventListener(eventType, listener)

  return () => {
    eventTarget.removeEventListener(eventType, listener)
  }
}
