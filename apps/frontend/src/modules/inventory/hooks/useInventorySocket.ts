import { useEffect } from 'react'

import { socket } from '@/infrastructure/realtime/socket'

import { useRuntimeEvents } from '../store/useRuntimeEvents'

export function useInventorySocket() {
  const pushEvent =
    useRuntimeEvents(
      (state) => state.pushEvent,
    )

  useEffect(() => {
    socket.on(
      'inventory.transaction.created',
      (payload) => {
        pushEvent({
          id: payload.id,

          type: payload.type,

          message:
            payload.remarks,

          timestamp:
            new Date(
              payload.createdAt,
            ).toLocaleTimeString(),
        })
      },
    )

    return () => {
      socket.off(
        'inventory.transaction.created',
      )
    }
  }, [])
}
