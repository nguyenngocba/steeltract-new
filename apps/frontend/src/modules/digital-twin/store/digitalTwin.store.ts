import { create } from 'zustand'

type DigitalTwinState = {
  selectedMachine: any

  setSelectedMachine: (
    machine: any
  ) => void
}

export const useDigitalTwinStore =
  create<DigitalTwinState>((set) => ({
    selectedMachine: null,

    setSelectedMachine: (
      machine
    ) =>
      set({
        selectedMachine: machine,
      }),
  }))
