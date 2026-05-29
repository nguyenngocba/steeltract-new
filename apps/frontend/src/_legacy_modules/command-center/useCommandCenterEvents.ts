import {
  useEffect,
  useState,
} from 'react'

import {
  EventBatcher,
  isPageVisible,
} from '../../lib/performance'
import { socketClient } from '../../lib/realtime/socket-client'

import type {
  RealtimeEventPayload,
} from '../../lib/realtime/socket-client'
import type {
  CommandEvent,
  CommandSeverity,
} from './command-center.types'

export function useCommandCenterEvents() {
  const [events, setEvents] = useState<
    CommandEvent[]
  >([])

  useEffect(() => {
    const batcher =
      new EventBatcher<CommandEvent>(
        300,
        (items) => {
          if (!isPageVisible()) {
            return
          }

          setEvents((current) => [
            ...items,
            ...current,
          ].slice(0, 30))
        },
      )

    const handleEvent = (
      payload: RealtimeEventPayload,
    ) => {
      if (!payload.event) {
        return
      }

      const domain =
        payload.event.split('.')[0] ??
        'system'
      const severity: CommandSeverity =
        payload.event.includes('failed') ||
        payload.event.includes('rework') ||
        payload.event.includes('threshold')
          ? 'warning'
          : 'info'

      batcher.push(
        {
          id: `${payload.event}-${payload.occurredAt ?? Date.now()}`,
          event: payload.event,
          domain,
          message: payload.event.replaceAll(
            '.',
            ' ',
          ),
          severity,
          occurredAt:
            payload.occurredAt ??
            new Date().toISOString(),
        },
      )
    }

    socketClient.on(
      'domain.event',
      handleEvent,
    )

    return () => {
      socketClient.off(
        'domain.event',
        handleEvent,
      )
      batcher.clear()
    }
  }, [])

  return events
}
