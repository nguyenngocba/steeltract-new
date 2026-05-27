export interface MaterialItem {
  id: string

  materialCode: string

  materialName: string

  category: string

  unit: string

  quantity: number

  reservedQuantity: number

  availableQuantity: number

  warehouse: string

  yard: string

  location: string

  minStock: number

  maxStock: number

  status: string

  createdAt: string
}

export interface InventoryTransaction {
  id: string

  transactionCode: string

  transactionType:
    | 'INBOUND'
    | 'OUTBOUND'
    | 'TRANSFER'

  materialCode: string

  quantity: number

  sourceLocation?: string

  destinationLocation?: string

  operator: string

  createdAt: string
}
