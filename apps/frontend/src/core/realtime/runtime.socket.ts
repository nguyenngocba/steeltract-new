import { io } from 'socket.io-client'

import { SOCKET_BASE_URL } from '../../lib/api'
import { useRuntimeStore } from './runtime.store'

export const runtimeSocket =
  io(
    SOCKET_BASE_URL,
    {
      transports: ['websocket'],
    },
  )

runtimeSocket.on(
  'connect',
  () => {
    useRuntimeStore
      .getState()
      .setConnected(true)
  },
)

runtimeSocket.on(
  'disconnect',
  () => {
    useRuntimeStore
      .getState()
      .setConnected(false)
  },
)

runtimeSocket.on(
  'inventory.transaction.created',
  (payload) => {
    useRuntimeStore
      .getState()
      .addEvent({
        type: 'INVENTORY',

        message:
          payload.remarks ??
          'Inventory transaction',

        createdAt:
          new Date().toISOString(),
      })
  },
)
