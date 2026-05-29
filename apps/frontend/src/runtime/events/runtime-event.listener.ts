import { runtimeEventBus }
  from './runtime-event.bus'

import { useRuntimeEventStore }
  from './runtime-event.store'

runtimeEventBus.subscribe(
  (event) => {
    useRuntimeEventStore
      .getState()
      .pushEvent(event)
  },
)
