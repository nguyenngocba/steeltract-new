import { api } from '@/lib/api'

export type ProductionOrder = {
  id: string
  orderNo: string
  title: string
  projectId?: string
  componentId?: string
  componentRequirementId?: string
  bomId?: string
  aggregateVersion?: number
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
  materialConsumptions?: ProductionMaterialConsumption[]
  cockpit?: {
    progress: number
    delayed: boolean
    materialReadiness: ProductionCockpitMaterialReadiness
  }
  canonical?: ProductionOrderCanonicalRead
}

export type ComponentRequirementProductionOrder = {
  id: string
  orderNo: string
  title: string
  quantity: number
  status: string
  aggregateVersion?: number
  createdAt?: string
  updatedAt?: string
}

export type ProjectComponentRequirement = {
  id: string
  requirementNo: string
  projectId: string
  projectTaskId?: string
  componentId: string
  componentRevisionId?: string
  bomDefinitionId?: string
  requiredQuantity: number
  producedQuantity?: number
  acceptedQuantity?: number
  installedQuantity?: number
  status: string
  requiredBy?: string
  createdAt: string
  updatedAt: string
  project?: { id: string; code: string; name: string }
  projectTask?: { id: string; name: string }
  component?: { id: string; code: string; name: string; lifecycleState: string }
  componentRevision?: { id: string; revisionNo: string; state: string }
  bomDefinition?: { id: string; state: string; contentHash?: string | null }
  productionOrders?: ComponentRequirementProductionOrder[]
}

export type ProjectComponentRequirementList = {
  data: ProjectComponentRequirement[]
  meta: { page: number; limit: number; total: number; totalPages: number }
}

export type ComponentInstanceExecution = {
  id: string
  status: string
  startedAt?: string
  completedAt?: string
  cancelledAt?: string
  workOrder?: {
    id: string
    workOrderNo: string
    productCode: string
    quantity: number
    status: string
    lifecycleState?: string
    sequence?: number
  }
  productionExecution?: {
    id: string
    state: string
    workCenterId?: string
    machineId?: string
    startedAt?: string
    completedAt?: string
  }
}

export type ComponentInstance = {
  id: string
  instanceNo: string
  componentId: string
  componentRevisionId: string
  bomDefinitionId?: string
  productionOrderId?: string
  requirementId?: string
  projectId?: string
  projectTaskId?: string
  state: string
  serialSequence?: number
  producedAt?: string
  qcPassedAt?: string
  scrappedAt?: string
  installedAt?: string
  createdAt: string
  updatedAt: string
  component?: { id: string; code: string; name: string; lifecycleState: string }
  componentRevision?: { id: string; revisionNo: string; state: string }
  bomDefinition?: { id: string; state: string; contentHash?: string | null }
  productionOrder?: { id: string; orderNo: string; title: string; quantity: number; status: string }
  requirement?: { id: string; requirementNo: string; requiredQuantity: number }
  project?: { id: string; code: string; name: string }
  projectTask?: { id: string; name: string }
  executions?: ComponentInstanceExecution[]
}

export type ComponentInstanceList = {
  data: ComponentInstance[]
  meta: { page: number; limit: number; total: number; totalPages: number }
}

export type CreateCanonicalProductionOrderInput = {
  orderNo: string
  title: string
  description?: string
  projectId?: string
  componentRequirementId: string
  quantity: number
  unit: string
  orderKind?: string
  plannedStartAt?: string
  plannedEndAt?: string
  engineeringBasis: {
    componentId: string
    componentRevisionId: string
    bomDefinitionId: string
    contentHash: string
    verifiedAt: string
  }
}

export type ReleaseCanonicalProductionOrderInput = {
  expectedVersion: number
  reason?: string
  workOrders: Array<{
    routingOperationId: string
    productCode: string
    quantity: number
    sequence: number
    plannedStart?: string
    plannedEnd?: string
  }>
}

export type ProductionCockpitMaterialReadiness = {
  hasBom: boolean
  requiredQty: number
  issuedQty: number
  remainingQty: number
  readinessPercent: number
  label: string
}

export type ProductionCockpitParams = {
  search?: string
  status?: string
  scope?: 'all' | 'planning'
  sortBy?: 'updatedAt' | 'orderNo' | 'plannedEndAt' | 'status'
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export type ProductionCockpitReadModel = {
  data: ProductionOrder[]
  meta: { page: number; limit: number; total: number; totalPages: number }
  summary: {
    total: number
    planned: number
    released: number
    inProgress: number
    completed: number
    completedToday: number
    waitingMaterial: number
    delayed: number
    runningComponents: number
    productionWeight: number
    componentInstances?: number
    waitingQc?: number
    qcPassed?: number
  }
  overview: {
    progress: { running: number; pending: number; completed: number }
    material: { issued: number; waiting: number; shortage: number }
    stages: Array<{ label: string; value: number }>
    activeComponents: ProductionComponent[]
  }
  orderAnalytics: {
    progressSegments: Array<{ label: string; value: number }>
    readinessSegments: Array<{ label: string; value: number }>
    topMaterial: Array<{ id: string; orderNo: string; title: string; value: number }>
    topShortage: Array<{ id: string; orderNo: string; title: string; value: number }>
    upcomingDelayed: Array<{ id: string; orderNo: string; title: string; plannedEndAt?: string }>
  }
  queue: { ready: number; inProgress: number; paused: number; total: number }
  workCenters: Array<{
    id: string
    code: string
    name: string
    status: string
    _count: { stages: number; machines: number; tasks: number }
  }>
}

export type ProductionOrderCanonicalRead = {
  productionOrder: {
    id: string
    componentRequirementId?: string | null
    projectId?: string | null
    updatedAt?: string | null
  }
  project?: { id: string; code: string; name: string } | null
  requirement?: {
    id: string
    requirementNo: string
    requiredQuantity: number
  } | null
  componentDefinition?: {
    id: string
    code: string
    name: string
    componentType?: string | null
    profile?: string | null
    lifecycleState?: string | null
  } | null
  revision?: { id: string; revisionNo: string; state: string } | null
  bomDefinition?: { id: string; state: string; contentHash?: string | null } | null
  bom?: {
    id?: string | null
    bomNo?: string | null
    productCode?: string | null
    version?: string | null
    status?: string | null
  } | null
  plannedQuantity: number
  allocatedQuantity: number
  componentInstances: {
    total: number
    stateCounts: Record<string, number>
    rows: Array<{
      id: string
      instanceNo?: string | null
      state: string
      producedAt?: string | null
      qcPassedAt?: string | null
      scrappedAt?: string | null
      updatedAt?: string | null
      executions: ComponentInstanceExecution[]
      qcInspections: Array<{
        id: string
        inspectionNo: string
        status: string
        completedAt?: string | null
        approvedAt?: string | null
        rejectedAt?: string | null
        updatedAt: string
      }>
      ncrs: Array<{
        id: string
        ncrNo: string
        status: string
        disposition?: string | null
        updatedAt: string
      }>
    }>
  }
  execution: {
    assigned: number
    running: number
    completed: number
    cancelled: number
    rows: Array<ComponentInstanceExecution & {
      componentInstanceId: string
      instanceNo: string
    }>
  }
  qc: {
    passed: number
    failed: number
    approved: number
    rejected: number
    rows: Array<{
      id: string
      inspectionNo: string
      status: string
      componentInstanceId: string
      instanceNo: string
      completedAt?: string | null
      approvedAt?: string | null
      rejectedAt?: string | null
      updatedAt: string
    }>
  }
  materialReadiness: ProductionCockpitMaterialReadiness
  material: {
    reservations: Array<{
      id: string
      reservationNo: string
      status: string
      reservedAt?: string | null
      lines: Array<{
        id: string
        requiredQty: number
        reservedQty: number
        issuedQty: number
        returnedQty: number
        status: string
        inventoryItem: { id: string; code: string; name: string; unit?: string | null }
        warehouse?: { id: string; code: string; name: string } | null
        zone?: { id: string; code: string; name: string } | null
        slotId?: string | null
        level?: string | null
      }>
    }>
    issues: ProductionMaterialIssue[]
  }
  updatedAt?: string | null
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
  placements?: Array<{
    id: string
    componentInstanceId?: string | null
    itemId?: string
    quantity?: number
    stackLevel?: number
    metadata?: { productionOrderId?: string } | null
  }>
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
    materialId: string
    quantity: number
    wastePercent: number
    category: string
    material: { id?: string; code: string; name: string; unit?: string; unitMaster?: { symbol?: string } }
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
  reservationId?: string
  reservationLineId?: string
  inventoryItemId: string
  warehouseId?: string
  zoneId?: string
  slotId?: string
  level?: string
  issuedQty: number
  returnedQty?: number
  issuedBy?: string
  issuedDate: string
  status: string
  remarks?: string
  productionOrder?: ProductionOrder
  inventoryItem?: { code: string; name: string; unit?: string }
}

export type ProductionMaterialConsumption = {
  id: string
  productionOrderId: string
  inventoryItemId: string
  issuedQty: number
  consumedQty: number
  scrapQty: number
  returnedQty: number
  remark?: string
  createdBy?: string
  createdAt: string
  productionOrder?: Pick<ProductionOrder, 'id' | 'orderNo' | 'title' | 'status'>
  inventoryItem?: { id: string; code: string; name: string; unit?: string; unitMaster?: { symbol?: string } }
}

export type ProductionConsumptionParams = {
  productionOrderId?: string
  inventoryItemId?: string
}

export type ProductionReservationLine = {
  id: string
  inventoryItemId: string
  bomItemId?: string
  warehouseId?: string
  zoneId?: string
  slotId?: string
  level?: string
  requiredQty: number
  reservedQty: number
  issuedQty: number
  returnedQty: number
  status: string
  inventoryItem?: { id: string; code: string; name: string; unit?: string; unitMaster?: { symbol?: string } }
  warehouse?: { id: string; code: string; name: string }
  zone?: { id: string; code: string; name: string }
}

export type ProductionReservation = {
  id: string
  reservationNo: string
  productionOrderId: string
  bomId?: string
  status: string
  reservedBy?: string
  reservedAt?: string
  expiresAt?: string
  releasedAt?: string
  note?: string
  createdAt: string
  updatedAt: string
  productionOrder?: Pick<ProductionOrder, 'id' | 'orderNo' | 'title' | 'status'>
  bom?: Pick<ProductionBom, 'id' | 'bomNo' | 'productCode' | 'productName'>
  lines: ProductionReservationLine[]
}

export type ProductionReservationPreview = {
  productionOrderId: string
  orderNo: string
  bomId?: string
  status: 'READY' | 'SHORTAGE'
  totalRequiredQty: number
  totalAvailableQty: number
  totalAlreadyReservedQty: number
  totalReservableQty: number
  totalShortageQty: number
  lines: Array<{
    bomItemId: string
    materialId: string
    materialCode: string
    materialName: string
    unit?: string
    requiredQty: number
    availableQty: number
    alreadyReservedQty: number
    reservableQty: number
    shortageQty: number
    allocations: Array<{
      warehouseId?: string
      warehouseCode?: string
      warehouseName?: string
      zoneId?: string
      zoneCode?: string
      zoneName?: string
      slotId?: string
      level?: string
      availableQty: number
      reservedQty: number
    }>
  }>
}

export type ProductionMaterialLedger = {
  id: string
  productionOrderId: string
  reservationId?: string
  inventoryItemId: string
  warehouseId?: string
  zoneId?: string
  slotId?: string
  level?: string
  quantity: number
  eventType: 'RESERVE' | 'RELEASE' | 'ISSUE' | 'RETURN' | 'CONSUME' | 'ADJUST'
  eventDate: string
  remark?: string
  createdBy?: string
  createdAt: string
  productionOrder?: Pick<ProductionOrder, 'id' | 'orderNo' | 'title' | 'status'>
  reservation?: Pick<ProductionReservation, 'id' | 'reservationNo' | 'status'>
  inventoryItem?: { id: string; code: string; name: string; unit?: string; unitMaster?: { symbol?: string } }
  warehouse?: { id: string; code: string; name: string }
  zone?: { id: string; code: string; name: string }
}

export type ProductionMaterialLedgerParams = {
  productionOrderId?: string
  reservationId?: string
  inventoryItemId?: string
  warehouseId?: string
  zoneId?: string
  eventType?: ProductionMaterialLedger['eventType'] | ''
  fromDate?: string
  toDate?: string
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
  onHandQty?: number
  reservedQty?: number
  availableQty: number
  reservableQty?: number
  issuedQty: number
  shortageQty: number
}

export const productionApi = {
  orders: () => api.get<ProductionOrder[]>('/production').then((res) => res.data),
  cockpit: (params: ProductionCockpitParams) =>
    api.get<ProductionCockpitReadModel>('/production/read-model/cockpit', { params }).then((res) => res.data),
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
  consumptions: (params?: ProductionConsumptionParams) =>
    api.get<ProductionMaterialConsumption[]>('/production/consumptions', { params }).then((res) => res.data),
  consumptionsByOrder: (id: string) =>
    api.get<ProductionMaterialConsumption[]>(`/production/${id}/consumptions`).then((res) => res.data),
  consumeMaterial: (id: string, payload: Record<string, unknown>) =>
    api.post<ProductionMaterialConsumption>(`/production/${id}/consume`, payload).then((res) => res.data),
  reservations: (productionOrderId?: string) =>
    api.get<ProductionReservation[]>('/production/reservations', { params: { productionOrderId } }).then((res) => res.data),
  reservationPreview: (id: string) =>
    api.get<ProductionReservationPreview>(`/production/${id}/reservation-preview`).then((res) => res.data),
  createReservation: (id: string, payload: Record<string, unknown>) =>
    api.post<ProductionReservation>(`/production/${id}/reservations`, payload).then((res) => res.data),
  reserveReservation: (id: string, payload: Record<string, unknown> = {}) =>
    api.post<ProductionReservation>(`/production/reservations/${id}/reserve`, payload).then((res) => res.data),
  issueReservation: (id: string, payload: Record<string, unknown> = {}) =>
    api.post<ProductionMaterialIssue[]>(`/production/reservations/${id}/issue`, payload).then((res) => res.data),
  releaseReservation: (id: string, payload: Record<string, unknown> = {}) =>
    api.post<ProductionReservation>(`/production/reservations/${id}/release`, payload).then((res) => res.data),
  expireReservation: (id: string, payload: Record<string, unknown> = {}) =>
    api.post<ProductionReservation>(`/production/reservations/${id}/expire`, payload).then((res) => res.data),
  returnMaterialIssue: (id: string, payload: Record<string, unknown> = {}) =>
    api.post<ProductionMaterialIssue>(`/production/material-issues/${id}/return`, payload).then((res) => res.data),
  materialLedger: (params?: ProductionMaterialLedgerParams) =>
    api.get<ProductionMaterialLedger[]>('/production/material-ledger', { params }).then((res) => res.data),
  materialLedgerByOrder: (id: string) =>
    api.get<ProductionMaterialLedger[]>(`/production/${id}/material-ledger`).then((res) => res.data),
  logs: () => api.get<ProductionLog[]>('/production/logs').then((res) => res.data),
  machines: () => api.get<ProductionMachine[]>('/production/machines').then((res) => res.data),
  requirements: (id: string) =>
    api.get<MaterialRequirement[]>(`/production/${id}/requirements`).then((res) => res.data),
  componentRequirements: (params?: Record<string, unknown>) =>
    api.get<ProjectComponentRequirementList>('/components/foundation/requirements', { params }).then((res) => res.data),
  componentInstances: (params?: Record<string, unknown>) =>
    api.get<ComponentInstanceList>('/components/foundation/instances', { params }).then((res) => res.data),
  createOrder: (payload: Record<string, unknown>) =>
    api.post<ProductionOrder>('/production', payload).then((res) => res.data),
  createCanonicalOrder: (payload: CreateCanonicalProductionOrderInput) =>
    api.post<ProductionOrder>('/production/commands/orders', payload, {
      headers: { 'Idempotency-Key': `production-order-${payload.orderNo}` },
    }).then((res) => res.data),
  releaseCanonicalOrder: (id: string, payload: ReleaseCanonicalProductionOrderInput) =>
    api.post<ProductionOrder>(`/production/commands/orders/${id}/release`, payload, {
      headers: { 'Idempotency-Key': `production-order-release-${id}-${payload.expectedVersion}` },
    }).then((res) => res.data),
  assignComponentInstanceExecution: (payload: { productionExecutionId: string; componentInstanceIds: string[] }) =>
    api.post<ComponentInstanceExecution>('/production/commands/instance-executions/assign', payload).then((res) => res.data),
  startComponentInstanceExecution: (id: string) =>
    api.post<ComponentInstanceExecution>(`/production/commands/instance-executions/${id}/start`, {}).then((res) => res.data),
  completeComponentInstanceExecution: (id: string) =>
    api.post<ComponentInstanceExecution>(`/production/commands/instance-executions/${id}/complete`, {}).then((res) => res.data),
  componentInstanceExecutionHistory: (componentInstanceId: string) =>
    api.get<ComponentInstanceExecution[]>(`/production/commands/component-instances/${componentInstanceId}/executions`).then((res) => res.data),
  startOrder: (id: string) =>
    api.post<ProductionOrder>(`/production/${id}/start`, {}).then((res) => res.data),
  completeStage: (id: string) =>
    api.post<ProductionOrder>(`/production/stages/${id}/complete`, {}).then((res) => res.data),
  createComponentFromOrder: (id: string) =>
    api.post<ProductionComponent>(`/production/${id}/component`, {}).then((res) => res.data),
}
