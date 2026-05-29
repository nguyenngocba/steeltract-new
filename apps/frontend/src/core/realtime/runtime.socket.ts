import { io } from 'socket.io-client'

import { useRuntimeStore } from './runtime.store'

export const runtimeSocket =
  io(
    'http://172.168.53.116:3000',
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
