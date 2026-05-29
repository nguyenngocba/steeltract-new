import '../services/kernel.services'

import { runtimeScheduler } from './runtime.scheduler'

runtimeScheduler.register({
  id: 'heartbeat',

  name: 'Kernel Heartbeat',

  interval: 5000,

  execute: () => {
    console.log(
      '[SteelTrack Kernel] heartbeat',
    )
  },
})
