import { create } from 'zustand'

type RuntimeEvent = {
  type: string
  message: string
  createdAt: string
}

type RuntimeState = {
  connected: boolean

  events: RuntimeEvent[]

  addEvent: (
    event: RuntimeEvent,
  ) => void

  setConnected: (
    value: boolean,
  ) => void
}

export const useRuntimeStore =
  create<RuntimeState>((set) => ({
    connected: false,

    events: [],

    addEvent: (event) =>
      set((state) => ({
        events: [
          event,
          ...state.events,
        ].slice(0, 100),
      })),

    setConnected: (value) =>
      set({
        connected: value,
      }),
  }))
