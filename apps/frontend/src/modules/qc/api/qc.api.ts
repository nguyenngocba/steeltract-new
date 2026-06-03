import { http } from '../../../shared/http/http-client'

export type QcInspectionStatus = 'DRAFT' | 'READY' | 'IN_PROGRESS' | 'PASSED' | 'FAILED' | 'REWORK_REQUIRED' | 'APPROVED' | 'REJECTED' | 'CANCELLED'

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
    inProgress: number
    passed: number
    failed: number
    rework: number
    openIssues: number
    openNcrs: number
    passRate: number
    defects: Array<{ severity: string; status: string; _count: number }>
  }
  inspections: QcInspectionRow[]
  productionQueue: QcProductionQueueRow[]
  checklists: Array<{ id: string; code: string; name: string; type: string; revision: string; isActive: boolean; items: unknown[] }>
  ncrs: Array<{ id: string; ncrNo: string; title: string; status: string; severity: string; productionOrderId?: string; componentId?: string; updatedAt: string }>
  byCategory: Array<{ category: string; count: number }>
  byProject: Array<{ projectName: string; total: number; passed: number; passRate: number }>
}

export async function getQcCockpit() {
  const response = await http.get('/qc/cockpit')
  return response.data as QcCockpit
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
