import { api } from '../../../../lib/api'

import type {
  ComponentCostingRecord,
  ComponentRecord,
  CreateComponentPayload,
  CreateProductionOrderPayload,
  ProductionOrderRecord,
} from '../../api/contracts/components.contract'

export async function getComponents() {
  const response = await api.get<ComponentRecord[] | { data: ComponentRecord[] }>(
    '/components',
  )

  return Array.isArray(response.data)
    ? response.data
    : response.data.data
}

export async function createComponent(payload: CreateComponentPayload) {
  const response = await api.post<ComponentRecord>('/components', payload)

  return response.data
}

export async function deleteComponent(id: string) {
  await api.delete(`/components/${id}`)
}

export async function getComponentCosting(id: string) {
  const response = await api.get<ComponentCostingRecord>(`/components/${id}/costing`)

  return response.data
}

export async function recalculateComponentCosting(id: string) {
  const response = await api.post<ComponentCostingRecord>(
    `/components/${id}/costing/recalculate`,
    {},
  )

  return response.data
}

export async function getProductionOrders() {
  const response = await api.get<
    ProductionOrderRecord[] | { data: ProductionOrderRecord[] }
  >('/production')

  return Array.isArray(response.data)
    ? response.data
    : response.data.data
}

export async function createProductionOrder(
  payload: CreateProductionOrderPayload,
) {
  const response = await api.post<ProductionOrderRecord>('/production', payload)

  return response.data
}
