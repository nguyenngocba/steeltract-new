import { create } from 'zustand'

import {
  InventoryItem,
  InventoryTransaction,
} from '../types/inventory.types'

type InventoryState = {
  items: InventoryItem[]

  transactions:
    InventoryTransaction[]

  setItems: (
    items: InventoryItem[],
  ) => void

  addTransaction: (
    transaction:
      InventoryTransaction,
  ) => void
}

export const useInventoryStore =
  create<InventoryState>(
    (set) => ({
      items: [],

      transactions: [],

      setItems: (items) =>
        set({
          items,
        }),

      addTransaction:
        (transaction) =>
          set((state) => ({
            transactions: [
              transaction,
              ...state.transactions,
            ],
          })),
    }),
  )
