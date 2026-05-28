export type QcInspectionStatus =
  | 'DRAFT'
  | 'READY'
  | 'IN_PROGRESS'
  | 'PASSED'
  | 'FAILED'
  | 'REWORK_REQUIRED'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED'

export type QcChecklistType =
  | 'DIMENSIONAL'
  | 'WELDING'
  | 'PAINTING'
  | 'COATING'
  | 'MATERIAL'
  | 'FINAL'

export type QcResultStatus =
  | 'PENDING'
  | 'PASS'
  | 'FAIL'
  | 'NA'

export type QcIssueSeverity =
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH'
  | 'CRITICAL'

export type QcIssueStatus =
  | 'OPEN'
  | 'CORRECTIVE_ACTION_ASSIGNED'
  | 'RESOLVED'
  | 'VERIFIED'
  | 'CLOSED'

export type NcrStatus =
  | 'OPEN'
  | 'UNDER_REVIEW'
  | 'REWORK_REQUIRED'
  | 'APPROVED'
  | 'REJECTED'
  | 'CLOSED'

export interface PaginatedQcResponse<T> {
  data: T[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface QcChecklistItem {
  id: string
  checklistId: string
  sequence: number
  title: string
  description?: string | null
  required: boolean
  expectedValue?: string | null
  tolerance?: string | null
  unit?: string | null
}

export interface QcChecklist {
  id: string
  code: string
  name: string
  type: QcChecklistType
  revision: string
  description?: string | null
  isActive: boolean
  items?: QcChecklistItem[]
}

export interface QcResult {
  id: string
  inspectionId: string
  checklistItemId?: string | null
  category: QcChecklistType
  status: QcResultStatus
  measuredValue?: string | null
  expectedValue?: string | null
  tolerance?: string | null
  unit?: string | null
  notes?: string | null
  checklistItem?: QcChecklistItem | null
}

export interface QcIssue {
  id: string
  inspectionId: string
  resultId?: string | null
  code?: string | null
  title: string
  description?: string | null
  severity: QcIssueSeverity
  status: QcIssueStatus
  correctiveAction?: string | null
  assignedToId?: string | null
  dueAt?: string | null
  resolvedAt?: string | null
  verifiedAt?: string | null
  createdAt: string
}

export interface QcInspection {
  id: string
  inspectionNo: string
  checklistId?: string | null
  productionOrderId?: string | null
  productionStageId?: string | null
  componentId?: string | null
  projectId?: string | null
  status: QcInspectionStatus
  inspectorId?: string | null
  startedAt?: string | null
  completedAt?: string | null
  checklist?: QcChecklist | null
  results?: QcResult[]
  issues?: QcIssue[]
  ncrs?: NonConformanceReport[]
}

export interface NonConformanceReport {
  id: string
  ncrNo: string
  inspectionId: string
  issueId?: string | null
  productionOrderId?: string | null
  componentId?: string | null
  status: NcrStatus
  severity: QcIssueSeverity
  title: string
  description?: string | null
  rootCause?: string | null
  correctiveAction?: string | null
  disposition?: string | null
  createdAt: string
}

export interface QcMetrics {
  total: number
  inProgress: number
  passed: number
  failed: number
  rework: number
  openIssues: number
  openNcrs: number
  passRate: number
  defects: Array<{
    severity: QcIssueSeverity
    status: QcIssueStatus
    _count: number
  }>
}

export interface QcListParams {
  [key: string]: unknown
  page?: number
  limit?: number
  search?: string
  q?: string
  status?: string
  severity?: QcIssueSeverity
  type?: QcChecklistType
  productionOrderId?: string
  productionStageId?: string
  componentId?: string
  projectId?: string
}
