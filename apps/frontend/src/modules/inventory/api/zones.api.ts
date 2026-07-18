import { api } from '../../../lib/api'

export type WarehouseLocation = {
  id: string
  code: string
  name: string
  description?: string | null
  color?: string
  row?: string | null
  column?: string | null
  level?: string | null
  capacity?: number
  active: boolean
  materialCount?: number
  totalStockQuantity?: number
  warehouseId?: string | null
  warehouse?: WarehouseMaster | null
  cellOccupancy?: WarehouseCellOccupancy[]
}

export type WarehouseCellOccupancy = {
  key: string
  slotId: string
  level: string
  materialCount: number
  totalQuantity: number
  materialIds: string[]
  materials?: Array<{
    id: string
    code: string
    name: string
    quantity: number
    unit?: string | null
  }>
}

export type WarehouseMaster = {
  id: string
  code: string
  name: string
  description?: string | null
  active: boolean
  color?: string | null
}

export type WarehouseLocationDetail = WarehouseLocation & {
  inventoryItems: Array<{
    id: string
    code: string
    name: string
    quantity: number
    unit?: string | null
    slotId?: string | null
    level?: string | null
    unitMaster?: { symbol?: string; code?: string } | null
    category?: { name?: string } | null
    materialType?: { name?: string } | null
  }>
  transactionItems?: Array<{
    id: string
    quantity: number
    createdAt: string
    inventoryItem?: { code?: string; name?: string }
    transaction?: { transactionNo?: string | null; code?: string; type?: string; transactionDate?: string }
    unit?: { symbol?: string; code?: string } | null
  }>
}

export async function getZones() {

  const response =
    await api.get(
      '/inventory/zones',
    )

  return response.data
}

export async function getWarehouses() {
  const response = await api.get('/master-data/warehouses', {
    params: {
      active: 'true',
    },
  })
  return response.data as WarehouseMaster[]
}

export async function getZoneDetail(id: string) {
  const response = await api.get(`/inventory/zones/${id}`)
  return response.data as WarehouseLocationDetail | null
}

export async function createZone(payload: Partial<WarehouseLocation>) {
  const response = await api.post('/inventory/zones', payload)
  return response.data as WarehouseLocation
}

export async function updateZone(id: string, payload: Partial<WarehouseLocation>) {
  const response = await api.put(`/inventory/zones/${id}`, payload)
  return response.data as WarehouseLocation
}

export async function activateZone(id: string) {
  const response = await api.patch(`/inventory/zones/${id}/activate`, {})
  return response.data as WarehouseLocation
}

export async function deactivateZone(id: string) {
  const response = await api.patch(`/inventory/zones/${id}/deactivate`, {})
  return response.data as WarehouseLocation
}

export async function deleteZone(id: string) {
  const response = await api.delete(`/inventory/zones/${id}`)
  return response.data as WarehouseLocation
}
