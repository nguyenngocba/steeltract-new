import { create } from 'zustand'

type TelemetryState = {
  inventoryEvents: any[]
  yardEvents: any[]
  fabricationEvents: any[]

  addInventoryEvent: (event: any) => void
  addYardEvent: (event: any) => void
  addFabricationEvent: (event: any) => void
}

export const useTelemetryStore = create<TelemetryState>((set) => ({
  inventoryEvents: [],
  yardEvents: [],
  fabricationEvents: [],

  addInventoryEvent: (event) =>
    set((state) => ({
      inventoryEvents: [event, ...state.inventoryEvents].slice(0, 50),
    })),

  addYardEvent: (event) =>
    set((state) => ({
      yardEvents: [event, ...state.yardEvents].slice(0, 50),
    })),

  addFabricationEvent: (event) =>
    set((state) => ({
      fabricationEvents: [event, ...state.fabricationEvents].slice(0, 50),
    })),
}))
