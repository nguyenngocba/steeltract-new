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
    transactions: [
      {
        id: '1',
        type: 'INBOUND',
        material: 'Steel Beam H400',
        timestamp: 'Realtime',
      },
    ],

    addTransaction: (transaction) =>
      set((state) => ({
        transactions: [
          transaction,
          ...state.transactions,
        ],
      })),
  }))
