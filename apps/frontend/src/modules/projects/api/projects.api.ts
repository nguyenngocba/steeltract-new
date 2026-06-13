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
  materialCode: string
  materialName: string
  unit?: string | null
  quantity: number
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
}

export async function createProject(payload: CreateProjectPayload) {
  const response = await api.post('/projects', payload)
  return response.data
}

export async function deliverProjectComponent(id: string) {
  const response = await api.post(`/components/${id}/deliver`)
  return response.data as ProjectComponentRuntime
}

export async function installProjectComponent({ id, payload }: { id: string; payload: InstallProjectComponentPayload }) {
  const response = await api.post(`/components/${id}/install`, payload)
  return response.data as ProjectComponentRuntime
}
