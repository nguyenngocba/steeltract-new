import { create } from 'zustand'

type IotState = {
  telemetry: any[]

  addTelemetry: (
    payload: any
  ) => void
}

export const useIotStore =
  create<IotState>((set) => ({
    telemetry: [],

    addTelemetry: (payload) =>
      set((state) => ({
        telemetry: [
          payload,
          ...state.telemetry,
        ].slice(0, 100),
      })),
  }))
