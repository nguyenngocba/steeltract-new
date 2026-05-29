import { create } from 'zustand'

type RuntimeEvent = {
  id: string
  type: string
  message: string
  timestamp: string
}

type RuntimeEventStore = {
  events: RuntimeEvent[]

  pushEvent: (
    event: RuntimeEvent,
  ) => void
}

export const useRuntimeEvents =
  create<RuntimeEventStore>(
    (set) => ({
      events: [],

      pushEvent: (event) =>
        set((state) => ({
          events: [
            event,
            ...state.events,
          ].slice(0, 50),
        })),
    }),
  )
