import { create } from 'zustand'

import { RuntimeEvent }
  from './event.types'

type RuntimeEventState = {
  events: RuntimeEvent[]

  pushEvent: (
    event: RuntimeEvent,
  ) => void
}

export const useRuntimeEventStore =
  create<RuntimeEventState>(
    (set) => ({
      events: [],

      pushEvent: (
        event,
      ) =>
        set((state) => ({
          events: [
            event,
            ...state.events,
          ].slice(0, 100),
        })),
    }),
  )
