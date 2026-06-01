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
    | 'RETURN'
    | 'ADJUSTMENT'

  rawType?:
    | 'IMPORT'
    | 'EXPORT'
    | 'TRANSFER'
    | 'RETURN'
    | 'ADJUSTMENT'

  itemCode: string

  quantity: number

  warehouse: string

  createdAt: string
}
