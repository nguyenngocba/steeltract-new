import { create } from 'zustand'

type Transaction = {
  id: string
  type: string
  material: string
  timestamp: string
}

type InventoryState = {
  transactions: Transaction[]

  addTransaction: (
    transaction: Transaction,
  ) => void
}

export const useInventoryStore =
  create<InventoryState>((set) => ({
    transactions: [],

    addTransaction: (transaction) =>
      set((state) => ({
        transactions: [
          transaction,
          ...state.transactions,
        ],
      })),
  }))
