import {
  QueryClient,
} from '@tanstack/react-query'

import {
  Socket,
} from 'socket.io-client'

import {
  bridgeRealtimeEventToQuery,
} from './query-event-bridge'
import type {
  RealtimeEventPayload,
} from './socket-client'

const realtimeEventNames = [
  'domain.event',
] as const

export function registerRealtimeHandlers(
  socket: Socket,
  queryClient: QueryClient,
) {
  const handleEvent = (
    payload: RealtimeEventPayload,
  ) => {
    if (!payload?.event) return

    void bridgeRealtimeEventToQuery(
      queryClient,
      payload,
    )
  }

  realtimeEventNames.forEach((eventName) => {
    socket.on(eventName, handleEvent)
  })

  return () => {
    realtimeEventNames.forEach(
      (eventName) => {
        socket.off(eventName, handleEvent)
      },
    )
  }
}
