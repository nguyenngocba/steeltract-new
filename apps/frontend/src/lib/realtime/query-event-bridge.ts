import {
  QueryClient,
} from '@tanstack/react-query'

import {
  invalidateByDomainEvent,
} from '../query/invalidation'
import {
  EventBatcher,
  isPageVisible,
} from '../performance'
import type {
  RealtimeEventPayload,
} from './socket-client'
import {
  publishOperationalEvent,
} from '../../modules/operations/events/operational-event-bus'

const dedupeWindow = new Map<string, number>()

function dedupeKey(payload: RealtimeEventPayload) {
  return [
    payload.event,
    payload.entityId ?? '',
    payload.changedFields?.join(',') ?? '',
  ].join(':')
}

function isDuplicate(
  payload: RealtimeEventPayload,
  windowMs = 750,
) {
  const key = dedupeKey(payload)
  const now = Date.now()
  const lastSeen = dedupeWindow.get(key)

  dedupeWindow.set(key, now)

  if (dedupeWindow.size > 500) {
    for (const [entryKey, seenAt] of dedupeWindow) {
      if (now - seenAt > windowMs * 4) {
        dedupeWindow.delete(entryKey)
      }
    }
  }

  return Boolean(
    lastSeen && now - lastSeen < windowMs,
  )
}

const queryInvalidationBatcher =
  new EventBatcher<RealtimeEventPayload>(
    250,
    (items) => {
      const client = activeQueryClient

      if (!client || !isPageVisible()) {
        return
      }

      const eventNames = [
        ...new Set(
          items
            .filter((item) => item.event)
            .map((item) => item.event),
        ),
      ]

      void Promise.all(
        eventNames.map((eventName) =>
          invalidateByDomainEvent(
            client,
            eventName,
          ),
        ),
      )
    },
  )

let activeQueryClient: QueryClient | undefined

export function bridgeRealtimeEventToQuery(
  client: QueryClient,
  payload: RealtimeEventPayload,
) {
  activeQueryClient = client

  if (isDuplicate(payload)) {
    return Promise.resolve()
  }

  publishOperationalEvent(payload)
  queryInvalidationBatcher.push(payload)

  return Promise.resolve()
}
