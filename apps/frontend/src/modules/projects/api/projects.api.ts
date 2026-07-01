import { api } from '@/lib/api'

export type ProjectStatus = 'PLANNING' | 'ACTIVE' | 'COMPLETED' | 'ON_HOLD'
export type ProjectComponentStatus = 'STOCK' | 'CUTTING' | 'WELDING' | 'PAINTING' | 'READY' | 'SHIPPED' | 'DELIVERED' | 'INSTALLED'

export type ProjectRuntimeRow = {
  id: string
  code: string
  name: string
  description?: string | null
  status: ProjectStatus
  createdAt: string
  updatedAt: string
  progress: number
  type: string
  location: string
  owner: string
  contractValue: number
  actualValue: number
  tonnage: number
  readyComponents: number
  shippedComponents: number
  deliveredComponents: number
  installedComponents: number
  delivered: number
  pending: number
  delayedOrders: number
  componentCount: number
  orderCount: number
  materialTransactions: number
  startedAt: string
  plannedEndAt: string
}

export type ProjectMaterialRuntime = {
  id: string
  projectId?: string | null
  projectCode: string
  projectName: string
  inventoryItemId: string
  unitId?: string | null
  zoneId?: string | null
  materialCode: string
  materialName: string
  unit?: string | null
  quantity: number
  allocatedQuantity?: number
  usedQuantity?: number
  pendingReturnQuantity?: number
  returnedQuantity?: number
  availableReturnQuantity?: number
  unitPrice: number
  totalAmount: number
  type: string
  date: string
}

export type ProjectComponentRuntime = {
  id: string
  projectId?: string | null
  projectCode: string
  projectName: string
  code: string
  name: string
  status: ProjectComponentStatus
  plannedDate?: string | null
  installedDate?: string | null
  installZone?: string | null
  installAxis?: string | null
  installLevel?: string | null
  installPosition?: string | null
  estimatedCost: number
  actualCost: number
}

export type InstallProjectComponentPayload = {
  installZone: string
  installAxis: string
  installLevel: string
  installPosition: string
}

export type ProjectWbsRuntime = {
  id: string
  projectId: string
  parentId?: string | null
  level: number
  type: 'PROJECT' | 'PHASE' | 'TASK' | 'SUBTASK'
  name: string
  description?: string
  owner: string
  plannedStartAt?: string | null
  plannedFinishAt?: string | null
  baselineStartAt?: string | null
  baselineFinishAt?: string | null
  scheduledStartAt?: string | null
  scheduledFinishAt?: string | null
  forecastFinishAt?: string | null
  actualStartAt?: string | null
  actualFinishAt?: string | null
  progress: number
  status: string
  materialCount: number
  componentCount: number
  delayDays: number
  baselineVarianceDays?: number
  cascadeDelayDays?: number
  cost: number
  resourceCode?: string
  sortOrder?: number
  materials?: ProjectTaskMaterialLink[]
  components?: ProjectTaskComponentLink[]
  predecessors?: ProjectTaskDependency[]
  successors?: ProjectTaskDependency[]
  revenue?: number
  laborCost?: number
  machineCost?: number
  otherCost?: number
  profit?: number
  workers?: ProjectTaskLaborResource[]
  machines?: ProjectTaskEquipmentResource[]
  inspectionStatus?: ProjectTaskInspectionStatus | null
}

export type ProjectTaskStatus = 'DRAFT' | 'PLANNED' | 'READY' | 'IN_PROGRESS' | 'BLOCKED' | 'PAUSED' | 'COMPLETED' | 'CANCELLED'
export type ProjectTaskInspectionStatus = 'PENDING_INSPECTION' | 'INSPECTION_FAILED' | 'INSPECTION_PASSED' | 'ACCEPTED' | 'HANDED_OVER'

export type ProjectTaskDependency = {
  taskId: string
  type?: 'FS' | 'SS' | 'FF'
}

export type ProjectTaskMaterialLink = {
  id: string
  code?: string
  name?: string
  planned?: number
  issued?: number
  used?: number
  returned?: number
  remaining?: number
  cost?: number
  status?: string
}

export type ProjectTaskLaborResource = {
  role: string
  required?: number
  allocated?: number
}

export type ProjectTaskEquipmentResource = {
  type: string
  required?: number
  allocated?: number
}

export type ProjectTaskComponentLink = {
  id: string
  code?: string
  name?: string
  assigned?: number
  installed?: number
  returned?: number
  cost?: number
  status?: string
}

export type ProjectWbsTaskPayload = {
  name: string
  description?: string
  parentId?: string | null
  owner?: string
  plannedStartAt?: string | null
  plannedFinishAt?: string | null
  baselineStartAt?: string | null
  baselineFinishAt?: string | null
  actualStartAt?: string | null
  actualFinishAt?: string | null
  progress?: number
  status?: ProjectTaskStatus
  sortOrder?: number
  materials?: ProjectTaskMaterialLink[]
  components?: ProjectTaskComponentLink[]
  predecessors?: ProjectTaskDependency[]
  successors?: ProjectTaskDependency[]
  revenue?: number
  laborCost?: number
  machineCost?: number
  otherCost?: number
  workers?: ProjectTaskLaborResource[]
  machines?: ProjectTaskEquipmentResource[]
  inspectionStatus?: ProjectTaskInspectionStatus | null
}

export type ProjectTemplateStatus = 'DRAFT' | 'PUBLISHED' | 'INACTIVE'

export type ProjectTemplateTask = {
  key: string
  name: string
  description?: string
  parentKey?: string
  durationDays?: number
  dependsOn?: Array<{ key: string; type?: 'FS' | 'SS' | 'FF'; lagDays?: number }>
  resources?: Array<{ type: 'WORKER' | 'MACHINE' | 'OTHER'; name: string; quantity?: number; cost?: number }>
  suggestedMaterials?: string[]
  suggestedComponents?: string[]
  suggestedMachines?: string[]
  suggestedChecklist?: string[]
}

export type ProjectTemplateTaskRule = {
  taskType: string
  defaultDuration?: number
  suggestedMaterials: string[]
  suggestedComponents: string[]
  suggestedResources: Array<{ type: 'WORKER' | 'MACHINE' | 'OTHER'; name: string; quantity?: number; cost?: number }>
  suggestedMachines: string[]
  suggestedChecklist: string[]
}

export type ProjectTemplateStructure = {
  version: number
  tasks: ProjectTemplateTask[]
  rules?: ProjectTemplateTaskRule[]
}

export type ProjectTemplate = {
  id: string
  code: string
  name: string
  description?: string | null
  status: ProjectTemplateStatus
  isDefault: boolean
  structure: ProjectTemplateStructure
  publishedAt?: string | null
  createdAt: string
  updatedAt: string
}

export type ProjectFinancialRuntime = {
  projectId: string
  contractValue: number
  budget: number
  actualCost: number
  profit: number
  marginPercent: number
  breakdown: {
    materialCost: number
    componentCost: number
    laborCost: number
    machineCost: number
    otherCost: number
  }
  byTime: Array<{ date: string; value: number }>
  profitByProgress: Array<{ label: string; value: number }>
}

export type ProjectHealthRuntime = {
  projectId: string
  status: 'NORMAL' | 'RISK' | 'DELAYED'
  score: number
  warnings: string[]
  suggestedActions: string[]
  blockedTasks: number
  overdueTasks: number
  missingMaterials: number
  missingComponents: number
  overBudget: boolean
  openReturns: number
}

export type ProjectReturnRequestRuntime = {
  id: string
  returnNo: string
  flowType: string
  status: string
  projectId?: string | null
  projectCode: string
  projectName: string
  warehouseCode: string
  warehouseName: string
  requestedBy?: string | null
  remarks?: string | null
  createdAt: string
  items: Array<{
    id: string
    inventoryItemId: string
    materialCode: string
    materialName: string
    requestedQuantity: number
    receivedQuantity: number
    inspectedQuantity: number
    disposition?: string | null
    unit?: string | null
    zoneCode: string
    zoneName: string
  }>
}

export type ProjectDocumentRuntime = {
  id: string
  title: string
  originalName?: string | null
  category?: string | null
  mimeType: string
  fileSize: number
  module?: string | null
  entityType?: string | null
  entityId?: string | null
  projectId?: string | null
  source: string
  publicUrl?: string | null
  createdAt: string
}

export type ProjectLogRuntime = {
  id: string
  action: string
  entity: string
  entityId?: string | null
  module?: string | null
  userId?: string | null
  projectId?: string | null
  title: string
  detail?: string | null
  createdAt: string
}

export type ProjectsRuntime = {
  metrics: {
    totalProjects: number
    activeProjects: number
    planningProjects: number
    completedProjects: number
    contractValue: number
    actualValue: number
    averageProgress: number
    readyComponents: number
    shippedComponents: number
    deliveredComponents: number
    installedComponents: number
  }
  projects: ProjectRuntimeRow[]
  progress: Array<{
    id: string
    code: string
    name: string
    progress: number
    status: ProjectStatus
    tonnage: number
    componentCount: number
    delayedOrders: number
    startedAt: string
    plannedEndAt: string
  }>
  materials: ProjectMaterialRuntime[]
  components: ProjectComponentRuntime[]
  wbs: ProjectWbsRuntime[]
  financial: ProjectFinancialRuntime[]
  health: ProjectHealthRuntime[]
  returnRequests: ProjectReturnRequestRuntime[]
  documents: ProjectDocumentRuntime[]
  logs: ProjectLogRuntime[]
  reports: {
    byStatus: Array<{ status: ProjectStatus; count: number }>
    byType: Array<{ type: string; value: number }>
    topByContract: ProjectRuntimeRow[]
  }
}

export async function getProjects() {
  const response = await api.get('/projects')
  return Array.isArray(response.data) ? response.data : response.data?.data ?? []
}

export async function getProjectsRuntime() {
  const response = await api.get('/projects/runtime')
  return response.data as ProjectsRuntime
}

export type CreateProjectPayload = {
  code: string
  name: string
  description?: string
  status?: ProjectStatus
  customerName?: string
  location?: string
  projectType?: string
  startDate?: string | null
  handoverDate?: string | null
  contractValue?: number
  templateId?: string
}

export async function createProject(payload: CreateProjectPayload) {
  const response = await api.post('/projects', payload)
  return response.data
}

export async function updateProject({ id, payload }: { id: string; payload: Partial<CreateProjectPayload> }) {
  const response = await api.patch(`/projects/${id}`, payload)
  return response.data as ProjectRuntimeRow
}

export async function returnProjectComponent({ projectId, componentId, reason }: { projectId: string; componentId: string; reason?: string }) {
  const response = await api.post(`/projects/${projectId}/components/${componentId}/return`, {
    reason,
  })
  return response.data as ProjectComponentRuntime
}

export type SaveProjectTemplatePayload = {
  code: string
  name: string
  description?: string
  status?: ProjectTemplateStatus
  isDefault?: boolean
  structure: ProjectTemplateStructure
}

export async function getProjectTemplates() {
  const response = await api.get('/projects/templates')
  return response.data as ProjectTemplate[]
}

export async function createProjectTemplate(payload: SaveProjectTemplatePayload) {
  const response = await api.post('/projects/templates', payload)
  return response.data as ProjectTemplate
}

export async function updateProjectTemplate({ id, payload }: { id: string; payload: Partial<SaveProjectTemplatePayload> }) {
  const response = await api.patch(`/projects/templates/${id}`, payload)
  return response.data as ProjectTemplate
}

export async function duplicateProjectTemplate(id: string) {
  const response = await api.post(`/projects/templates/${id}/duplicate`)
  return response.data as ProjectTemplate
}

export async function publishProjectTemplate(id: string) {
  const response = await api.post(`/projects/templates/${id}/publish`)
  return response.data as ProjectTemplate
}

export async function deactivateProjectTemplate(id: string) {
  const response = await api.post(`/projects/templates/${id}/deactivate`)
  return response.data as ProjectTemplate
}

export async function setDefaultProjectTemplate(id: string) {
  const response = await api.post(`/projects/templates/${id}/default`)
  return response.data as ProjectTemplate
}

export async function deliverProjectComponent(id: string) {
  const response = await api.post(`/components/${id}/deliver`)
  return response.data as ProjectComponentRuntime
}

export async function installProjectComponent({ id, payload }: { id: string; payload: InstallProjectComponentPayload }) {
  const response = await api.post(`/components/${id}/install`, payload)
  return response.data as ProjectComponentRuntime
}

export type CreateProjectMaterialReturnPayload = {
  projectId: string
  inventoryItemId: string
  unitId?: string | null
  zoneId?: string | null
  quantity: number
  reason: string
  requestedBy?: string
}

export async function createProjectMaterialReturn(payload: CreateProjectMaterialReturnPayload) {
  const response = await api.post('/inventory/returns', {
    flowType: 'SITE_RETURN',
    projectId: payload.projectId,
    requestedBy: payload.requestedBy,
    remarks: payload.reason,
    items: [
      {
        inventoryItemId: payload.inventoryItemId,
        requestedQuantity: payload.quantity,
        unitId: payload.unitId || undefined,
        zoneId: payload.zoneId || undefined,
        remarks: payload.reason,
      },
    ],
  })
  return response.data as ProjectReturnRequestRuntime
}

export async function getProjectWbs(projectId: string) {
  const response = await api.get(`/projects/${projectId}/wbs`)
  return response.data as ProjectWbsRuntime[]
}

export async function createProjectWbsTask({ projectId, payload }: { projectId: string; payload: ProjectWbsTaskPayload }) {
  const response = await api.post(`/projects/${projectId}/wbs`, payload)
  return response.data as ProjectWbsRuntime
}

export type GenerateProjectWbsPayload = {
  rootName: string
  parentId?: string | null
  spans: number
  axes: number
  floors: number
  startDate?: string | null
  taskDurationDays: number
}

export async function generateProjectWbs({ projectId, payload }: { projectId: string; payload: GenerateProjectWbsPayload }) {
  const response = await api.post(`/projects/${projectId}/wbs/generate`, payload)
  return response.data as { created: number; ids: string[]; rows: ProjectWbsRuntime[] }
}

export type BulkProjectWbsPayload = {
  taskIds: string[]
  parentId?: string | null
  owner?: string
  status?: ProjectTaskStatus
  plannedStartAt?: string | null
  plannedFinishAt?: string | null
  resources?: Array<{ type: 'WORKER' | 'MACHINE' | 'OTHER'; name: string; quantity?: number; cost?: number }>
  checklist?: string[]
}

export async function bulkUpdateProjectWbs({ projectId, payload }: { projectId: string; payload: BulkProjectWbsPayload }) {
  const response = await api.patch(`/projects/${projectId}/wbs/bulk`, payload)
  return response.data as { updated: number; ids: string[]; rows: ProjectWbsRuntime[] }
}

export type ProjectSiteUpdatePayload = {
  taskId: string
  installedQuantity: number
  usedQuantity: number
  qcStatus: 'PASSED' | 'FAILED' | 'NONE'
  hasIssue: boolean
  note?: string
  photoAttachmentIds?: string[]
}

export async function submitProjectSiteUpdate({ projectId, payload }: { projectId: string; payload: ProjectSiteUpdatePayload }) {
  const response = await api.post(`/projects/${projectId}/site-update`, payload)
  return response.data as ProjectWbsRuntime
}

export async function updateProjectWbsTask({ projectId, taskId, payload }: { projectId: string; taskId: string; payload: Partial<ProjectWbsTaskPayload> }) {
  const response = await api.patch(`/projects/${projectId}/wbs/${taskId}`, payload)
  return response.data as ProjectWbsRuntime
}

export async function moveProjectWbsTask({ projectId, taskId, parentId, sortOrder }: { projectId: string; taskId: string; parentId?: string | null; sortOrder?: number }) {
  const response = await api.patch(`/projects/${projectId}/wbs/${taskId}/move`, { parentId, sortOrder })
  return response.data as ProjectWbsRuntime
}

export async function deleteProjectWbsTask({ projectId, taskId }: { projectId: string; taskId: string }) {
  const response = await api.delete(`/projects/${projectId}/wbs/${taskId}`)
  return response.data as { deleted: number; ids: string[] }
}
