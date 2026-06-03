import { api } from '@/lib/api'

export type ProductionOrder = {
  id: string
  orderNo: string
  title: string
  projectId?: string
  quantity: number
  priority: string
  status: string
  currentStageCode?: string
  plannedStartAt?: string
  plannedEndAt?: string
  bom?: ProductionBom
  component?: ProductionComponent
  stages?: Array<{ id: string; name: string; status: string; sequence: number }>
  materialIssues?: ProductionMaterialIssue[]
}

export type ProductionComponent = {
  id: string
  code: string
  name: string
  projectId?: string
  project?: { id: string; code: string; name: string }
}

export type YardSlot = {
  id: string
  code: string
  status: string
  currentStackLevel: number
  maxStackLevel: number
  zone: { id: string; code: string; name: string }
}

export type ProductionBom = {
  id: string
  bomNo: string
  productCode: string
  productName: string
  structureType?: string
  projectId?: string
  unit?: string
  estimatedWeight: number
  version: string
  status: string
  createdAt: string
  items: Array<{
    id: string
    quantity: number
    wastePercent: number
    category: string
    material: { code: string; name: string; unit?: string; unitMaster?: { symbol?: string } }
  }>
  routingSteps: Array<{
    id: string
    stepNo: number
    stepName: string
    workshop?: string
    expectedHours: number
    qcRequired: boolean
  }>
}

export type ProductionBomInput = {
  bomNo?: string
  productCode: string
  productName: string
  structureType?: string
  projectId?: string
  unit?: string
  estimatedWeight: number
  version: string
  status: string
  items: Array<{
    materialId: string
    quantity: number
    wastePercent: number
    category: 'MAIN_MATERIAL' | 'SECONDARY_MATERIAL' | 'CONSUMABLE'
  }>
  routingSteps: Array<{
    stepNo: number
    stepName: string
    workshop?: string
    expectedHours: number
    qcRequired: boolean
  }>
}

export type ProductionMaterialIssue = {
  id: string
  issueNo: string
  productionOrderId: string
  inventoryItemId: string
  issuedQty: number
  issuedBy?: string
  issuedDate: string
  status: string
  remarks?: string
  productionOrder?: ProductionOrder
  inventoryItem?: { code: string; name: string; unit?: string }
}

export type ProductionLog = {
  id: string
  createdAt: string
  message: string
  type: string
  workerId?: string
  productionOrder: ProductionOrder
  stage?: { name: string }
}

export type ProductionMachine = {
  id: string
  code: string
  name: string
  status: string
  utilization: number
  workCenter?: {
    id: string
    code: string
    name: string
  }
}

export type MaterialRequirement = {
  materialId: string
  materialCode: string
  materialName: string
  unit?: string
  requiredQty: number
  availableQty: number
  issuedQty: number
  shortageQty: number
}

export const productionApi = {
  orders: () => api.get<ProductionOrder[]>('/production').then((res) => res.data),
  order: (id: string) => api.get<ProductionOrder>(`/production/${id}`).then((res) => res.data),
  boms: () => api.get<ProductionBom[]>('/production/boms').then((res) => res.data),
  createBom: (payload: ProductionBomInput) =>
    api.post<ProductionBom>('/production/boms', payload).then((res) => res.data),
  cloneBom: (id: string) =>
    api.post<ProductionBom>(`/production/boms/${id}/clone`, {}).then((res) => res.data),
  archiveBom: (id: string) =>
    api.post<ProductionBom>(`/production/boms/${id}/archive`, {}).then((res) => res.data),
  components: () => api.get<ProductionComponent[] | { data: ProductionComponent[] }>('/components')
    .then((res) => Array.isArray(res.data) ? res.data : res.data.data),
  yardSlots: () => api.get<YardSlot[] | { data: YardSlot[] }>('/yard/slots')
    .then((res) => Array.isArray(res.data) ? res.data : res.data.data),
  issues: () => api.get<ProductionMaterialIssue[]>('/production/material-issues').then((res) => res.data),
  logs: () => api.get<ProductionLog[]>('/production/logs').then((res) => res.data),
  machines: () => api.get<ProductionMachine[]>('/production/machines').then((res) => res.data),
  requirements: (id: string) =>
    api.get<MaterialRequirement[]>(`/production/${id}/requirements`).then((res) => res.data),
  createOrder: (payload: Record<string, unknown>) =>
    api.post<ProductionOrder>('/production', payload).then((res) => res.data),
  startOrder: (id: string) =>
    api.post<ProductionOrder>(`/production/${id}/start`, {}).then((res) => res.data),
  completeStage: (id: string) =>
    api.post<ProductionOrder>(`/production/stages/${id}/complete`, {}).then((res) => res.data),
  stageToYard: (id: string, payload: Record<string, unknown>) =>
    api.post(`/production/${id}/stage-to-yard`, payload).then((res) => res.data),
}
