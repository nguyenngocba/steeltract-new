import { api as http } from '../../../lib/api'

export type QcInspectionStatus = 'DRAFT' | 'READY' | 'IN_PROGRESS' | 'PASSED' | 'FAILED' | 'REWORK_REQUIRED' | 'APPROVED' | 'REJECTED' | 'CANCELLED'

export type ComponentInstanceExecutionRow = {
  id: string
  status: string
  startedAt?: string
  completedAt?: string
  workOrder?: { id: string; workOrderNo: string; productCode: string; status: string; lifecycleState?: string; sequence?: number }
  productionExecution?: { id: string; state: string; startedAt?: string; completedAt?: string }
}

export type QcComponentInstance = {
  id: string
  instanceNo: string
  componentId: string
  componentRevisionId: string
  productionOrderId?: string
  requirementId?: string
  projectId?: string
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
  executions?: ComponentInstanceExecutionRow[]
}

export type QcComponentInstanceList = {
  data: QcComponentInstance[]
  meta: { page: number; limit: number; total: number; totalPages: number }
}

export type QcInspectionRow = {
  id: string
  inspectionNo: string
  date: string
  projectId?: string
  projectName: string
  componentId?: string
  componentCode: string
  componentName: string
  productionOrderId?: string
  productionOrderNo: string
  category: string
  checklistName: string
  result: 'PASS' | 'FAIL' | 'PENDING'
  status: QcInspectionStatus
  inspectorId?: string
  passRate: number
  issueCount: number
  ncrCount: number
}

export type QcInspectionDetail = QcInspectionRow & {
  componentInstanceId?: string
  checklist?: { id: string; code: string; name: string; type: string; revision: string }
  componentInstance?: QcComponentInstance
  ncrs?: Array<{ id: string; ncrNo: string; status: string; severity: string; title: string; disposition?: string | null; updatedAt: string }>
  metadata?: Record<string, unknown> | null
}

export type QcProductionQueueRow = {
  id: string
  orderNo: string
  title: string
  componentId?: string
  componentCode: string
  componentName: string
  projectId?: string
  status: string
  qcStatus: 'APPROVED' | 'REWORK_REQUIRED' | 'WAITING_QC'
  inspectionCount: number
  completedAt: string
}

export type QcCockpit = {
  metrics: {
    total: number
    pending: number
    inProgress: number
    passed: number
    failed: number
    rework: number
    overdue: number
    openIssues: number
    openNcrs: number
    waitingProductionOrders: number
    passRate: number
    defects: Array<{ severity: string; status: string; _count: number }>
  }
  inspections: QcInspectionRow[]
  productionQueue: QcProductionQueueRow[]
  checklists: Array<{ id: string; code: string; name: string; type: string; revision: string; isActive: boolean; items: unknown[] }>
  ncrs: Array<{ id: string; ncrNo: string; title: string; status: string; severity: string; productionOrderId?: string; componentInstanceId?: string; componentId?: string; updatedAt: string }>
  byCategory: Array<{ category: string; count: number }>
  byProject: Array<{ projectName: string; total: number; passed: number; passRate: number }>
  trend: Array<{ date: string; total: number; passed: number; failed: number }>
  meta: { page: number; limit: number; total: number; totalPages: number }
}

export type QcWorkspaceParams = {
  page?: number
  limit?: number
  search?: string
  status?: string
  sortBy?: 'updatedAt' | 'createdAt' | 'inspectionNo' | 'status'
  sortOrder?: 'asc' | 'desc'
}

export type QcDashboardRead = {
  data: {
    scopeKey: string
    snapshotDate: string
    totalInspections: number
    pendingCount: number
    inProgressCount: number
    passedCount: number
    failedCount: number
    reworkCount: number
    openIssueCount: number
    openNcrCount: number
    waitingProductionCount: number
    passRate: number
    payload?: {
      defects?: QcCockpit['metrics']['defects']
      trend?: QcCockpit['trend']
    } | null
  }
  source: 'snapshot' | 'runtime'
  meta: {
    ageSeconds: number
    confidence: number
    isStale: boolean
    snapshotType: string
    fallbackReason?: 'disabled' | 'missing' | 'stale' | 'mismatch'
  }
}

export async function getQcCockpit() {
  const response = await http.get('/qc/cockpit')
  return response.data as QcCockpit
}

export async function getQcWorkspace(params: QcWorkspaceParams = {}) {
  const response = await http.get('/qc/read-model/workspace', { params })
  return response.data as QcCockpit
}

export async function getQcDashboard() {
  const response = await http.get('/qc/dashboard')
  return response.data as QcDashboardRead
}

export async function getQcComponentInstances(params: Record<string, unknown> = {}) {
  const response = await http.get('/components/foundation/instances', { params })
  return response.data as QcComponentInstanceList
}

export async function getInspection(id: string) {
  const response = await http.get(`/qc/inspections/${id}`)
  return response.data as QcInspectionDetail
}

export async function createInspection(payload: Record<string, unknown>) {
  const response = await http.post('/qc/inspections', payload)
  return response.data
}

export async function startInspection(id: string) {
  const response = await http.post(`/qc/inspections/${id}/start`, {})
  return response.data
}

export async function completeInspection(id: string, status: 'PASSED' | 'FAILED' | 'REWORK_REQUIRED') {
  const response = await http.post(`/qc/inspections/${id}/complete`, { status })
  return response.data
}

export async function approveInspection(id: string) {
  const response = await http.post(`/qc/inspections/${id}/approve`, {})
  return response.data
}

export async function passFinalInspection(id: string, expectedVersion = 0) {
  const response = await http.post(`/qc/commands/inspections/${id}/pass`, { expectedVersion }, {
    headers: { 'Idempotency-Key': `qc-final-pass-${id}-${expectedVersion}` },
  })
  return response.data
}

export async function failFinalInspection(id: string, expectedVersion = 0) {
  const response = await http.post(`/qc/commands/inspections/${id}/fail`, { expectedVersion }, {
    headers: { 'Idempotency-Key': `qc-final-fail-${id}-${expectedVersion}` },
  })
  return response.data
}

export async function createCanonicalNcr(inspectionId: string, payload: {
  expectedVersion: number
  title: string
  description?: string
  severity?: string
  defectCode?: string
  reasonCode?: string
}) {
  const response = await http.post(`/qc/commands/inspections/${inspectionId}/ncr`, payload, {
    headers: { 'Idempotency-Key': `qc-final-ncr-${inspectionId}-${payload.expectedVersion}` },
  })
  return response.data
}

export async function markNcrRework(ncrId: string, expectedVersion = 0, reason = 'Yêu cầu làm lại từ QC') {
  const response = await http.post(`/qc/commands/ncr/${ncrId}/rework`, { expectedVersion, reason }, {
    headers: { 'Idempotency-Key': `qc-ncr-rework-${ncrId}-${expectedVersion}` },
  })
  return response.data
}

export async function markNcrScrap(ncrId: string, expectedVersion = 0, reason = 'Đề xuất loại bỏ từ QC') {
  const response = await http.post(`/qc/commands/ncr/${ncrId}/scrap`, { expectedVersion, reason }, {
    headers: { 'Idempotency-Key': `qc-ncr-scrap-${ncrId}-${expectedVersion}` },
  })
  return response.data
}

export async function markNcrUseAsIs(ncrId: string, expectedVersion = 0, reason = 'Chấp nhận sử dụng có điều kiện') {
  const response = await http.post(`/qc/commands/ncr/${ncrId}/use-as-is`, { expectedVersion, reason }, {
    headers: { 'Idempotency-Key': `qc-ncr-use-as-is-${ncrId}-${expectedVersion}` },
  })
  return response.data
}
