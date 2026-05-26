import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  getBufferedOperationalEvents,
  subscribeOperationalEvents,
} from './operational-event-bus'
import {
  matchesWorkspaceEvent,
} from './event-matchers'

import type {
  OperationalDomainEvent,
  WorkspaceEventFilter,
} from './domain-event.types'

interface UseWorkspaceEventsOptions
  extends WorkspaceEventFilter {
  workspaceId: string
  limit?: number
}

export function useWorkspaceEvents({
  workspaceId,
  domains,
  eventNames,
  entityIds,
  limit = 12,
}: UseWorkspaceEventsOptions) {
  const domainKey = domains?.join('|') ?? ''
  const eventNameKey = eventNames?.join('|') ?? ''
  const entityIdKey = entityIds?.join('|') ?? ''
  const filter = useMemo(
    () => ({
      domains: domainKey
        ? domainKey.split('|')
        : undefined,
      eventNames: eventNameKey
        ? eventNameKey.split('|')
        : undefined,
      entityIds: entityIdKey
        ? entityIdKey.split('|')
        : undefined,
    }),
    [domainKey, entityIdKey, eventNameKey],
  )
  const [events, setEvents] = useState<
    OperationalDomainEvent[]
  >(() =>
    getBufferedOperationalEvents().slice(0, limit),
  )
  const workspaceEvents = useMemo(
    () =>
      events
        .filter((event) =>
          matchesWorkspaceEvent(event, filter),
        )
        .slice(0, limit),
    [events, filter, limit],
  )

  useEffect(
    () =>
      subscribeOperationalEvents((event) => {
        setEvents((current) => [
          event,
          ...current.filter(
            (item) =>
              `${item.event}:${item.entityId}:${item.occurredAt}` !==
              `${event.event}:${event.entityId}:${event.occurredAt}`,
            ),
        ].slice(0, limit))
      }),
    [limit],
  )

  return {
    workspaceId,
    events: workspaceEvents,
    lastEvent: workspaceEvents[0] ?? null,
    hasEvents: workspaceEvents.length > 0,
  }
}
