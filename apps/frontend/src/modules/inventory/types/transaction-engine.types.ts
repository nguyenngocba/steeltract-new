export interface InventoryTransaction {
  id: string
  code: string
  transactionNo?: string
  type: string
  direction?: 'inbound' | 'outbound' | 'internal'
  note?: string
  remarks?: string
  performedBy?: string
  transactionDate?: string
  transactionType?: {
    code: string
    name: string
  } | null
  warehouse?: {
    name: string
    code: string
  } | null
  zone?: {
    name: string
    code: string
  } | null
  items: Array<{
    id: string
    quantity: number
    inventoryItem: {
      id: string
      name: string
      code: string
    }
    unit?: {
      code: string
      symbol: string
    } | null
  }>
}

export interface TransactionPayload {
  type: 'IMPORT' | 'EXPORT' | 'TRANSFER' | 'RETURN' | 'ADJUSTMENT'
  transactionTypeId?: string
  transactionTypeCode?: string
  warehouseId?: string
  zoneId?: string
  performedBy?: string
  remarks?: string
  items: Array<{
    inventoryItemId: string
    quantity: number
    unitId?: string
    warehouseId?: string
    zoneId?: string
  }>
}

export type ReturnFlowType =
  | 'SITE_RETURN'
  | 'PRODUCTION_RETURN'
  | 'SUPPLIER_RETURN'

export type ReturnDisposition =
  | 'USABLE_STOCK'
  | 'QC_HOLD'
  | 'DAMAGED'
  | 'SCRAP'
  | 'REPAIR'

export interface ReturnRequest {
  id: string
  returnNo: string
  flowType: ReturnFlowType
  status:
    | 'REQUESTED'
    | 'APPROVED'
    | 'RECEIVED'
    | 'INSPECTED'
    | 'DISPOSED'
    | 'CANCELLED'
  warehouse?: {
    code: string
    name: string
  } | null
  project?: {
    code: string
    name: string
  } | null
  requestedBy?: string
  remarks?: string
  createdAt: string
  items: Array<{
    id: string
    requestedQuantity: number
    receivedQuantity?: number | null
    inspectedQuantity?: number | null
    disposition?: ReturnDisposition | null
    inventoryItem: {
      id: string
      code: string
      name: string
    }
    unit?: {
      id: string
      code: string
      symbol: string
    } | null
    zone?: {
      id: string
      code: string
      name: string
    } | null
  }>
}

export interface ReturnRequestPayload {
  flowType: ReturnFlowType
  warehouseId?: string
  requestedBy?: string
  remarks?: string
  items: Array<{
    inventoryItemId: string
    requestedQuantity: number
    unitId?: string
    zoneId?: string
  }>
}
