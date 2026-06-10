import { http } from '@/shared/http/http-client'

export type ProjectStatus = 'PLANNING' | 'ACTIVE' | 'COMPLETED' | 'ON_HOLD'

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

export type ProjectsRuntime = {
  metrics: {
    totalProjects: number
    activeProjects: number
    planningProjects: number
    completedProjects: number
    contractValue: number
    actualValue: number
    averageProgress: number
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
  reports: {
    byStatus: Array<{ status: ProjectStatus; count: number }>
    byType: Array<{ type: string; value: number }>
    topByContract: ProjectRuntimeRow[]
  }
}

export async function getProjects() {
  const response = await http.get('/projects')
  return Array.isArray(response.data) ? response.data : response.data?.data ?? []
}

export async function getProjectsRuntime() {
  const response = await http.get('/projects/runtime')
  return response.data as ProjectsRuntime
}

export type CreateProjectPayload = {
  code: string
  name: string
  description?: string
  status?: ProjectStatus
}

export async function createProject(payload: CreateProjectPayload) {
  const response = await http.post('/projects', payload)
  return response.data
}
