import { runtimeSocket }
  from './runtime.socket'

import { runtimeEventBus }
  from '@/runtime/events/runtime-event.bus'

runtimeSocket.on(
  'connect',
  () => {
    console.log(
      '[Runtime Socket] connected',
    )
  },
)

runtimeSocket.on(
  'inventory.transaction.created',
  (payload) => {
    runtimeEventBus.emit({
      id:
        crypto.randomUUID(),

      type:
        'inventory.transaction.created',

      payload,

      createdAt:
        new Date().toISOString(),
    })
  },
)
