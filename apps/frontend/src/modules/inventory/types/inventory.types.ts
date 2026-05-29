export type InventoryItem = {
  id: string

  code: string

  name: string

  warehouse: string

  quantity: number

  unit: string

  status:
    | 'IN_STOCK'
    | 'LOW_STOCK'
    | 'CRITICAL'
}

export type InventoryTransaction = {
  id: string

  type:
    | 'INBOUND'
    | 'OUTBOUND'
    | 'TRANSFER'

  itemCode: string

  quantity: number

  warehouse: string

  createdAt: string
}
