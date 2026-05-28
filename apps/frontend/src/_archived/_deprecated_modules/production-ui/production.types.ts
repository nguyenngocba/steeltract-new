export type ProductionOrderStatus =
  | 'DRAFT'
  | 'PLANNED'
  | 'RELEASED'
  | 'IN_PROGRESS'
  | 'DELAYED'
  | 'COMPLETED'
  | 'CANCELLED'

export type ProductionStageCode =
  | 'CUTTING'
  | 'ASSEMBLY'
  | 'WELDING'
  | 'DRILLING'
  | 'PAINTING'
  | 'GALVANIZING'
  | 'PACKING'

export type ProductionStageStatus =
  | 'PENDING'
  | 'READY'
  | 'IN_PROGRESS'
  | 'BLOCKED'
  | 'COMPLETED'
  | 'SKIPPED'

export type ProductionTaskStatus =
  | 'TODO'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'BLOCKED'
  | 'DONE'
  | 'CANCELLED'

export type MachineStatus =
  | 'AVAILABLE'
  | 'RUNNING'
  | 'MAINTENANCE'
  | 'OFFLINE'

export interface WorkCenter {
  id: string
  code: string
  name: string
  status: string
  capacityPerDay?: number | null
  machines?: Machine[]
}

export interface Machine {
  id: string
  code: string
  name: string
  status: MachineStatus
  utilization: number
  workCenter?: WorkCenter | null
}

export interface ProductionStage {
  id: string
  code: ProductionStageCode
  name: string
  sequence: number
  status: ProductionStageStatus
  workCenter?: WorkCenter | null
  machine?: Machine | null
  assignedWorkerId?: string | null
  plannedStartAt?: string | null
  plannedEndAt?: string | null
  startedAt?: string | null
  completedAt?: string | null
}

export interface ProductionTask {
  id: string
  title: string
  status: ProductionTaskStatus
  priority: string
  assignedWorkerId?: string | null
  workCenter?: WorkCenter | null
  machine?: Machine | null
  plannedStartAt?: string | null
  plannedEndAt?: string | null
}

export interface ProductionLog {
  id: string
  type: string
  message: string
  quantity?: number | null
  workerId?: string | null
  machineId?: string | null
  attachmentIds: string[]
  createdAt: string
}

export interface ProductionOrder {
  id: string
  orderNo: string
  title: string
  description?: string | null
  projectId?: string | null
  componentId?: string | null
  quantity: number
  priority: string
  status: ProductionOrderStatus
  currentStageCode?: ProductionStageCode | null
  plannedStartAt?: string | null
  plannedEndAt?: string | null
  startedAt?: string | null
  completedAt?: string | null
  delayedAt?: string | null
  delayReason?: string | null
  workflowInstanceId?: string | null
  stages: ProductionStage[]
  tasks: ProductionTask[]
  logs: ProductionLog[]
}

export interface ProductionMetrics {
  totalOrders: number
  inProgress: number
  delayed: number
  completed: number
  completionRate: number
  throughput: number
  stageStatus: Array<{
    code: ProductionStageCode
    status: ProductionStageStatus
    _count: number
  }>
  machineUtilization: Array<{
    id: string
    code: string
    name: string
    status: MachineStatus
    utilization: number
  }>
  bottlenecks: Array<{
    stage: ProductionStageCode
    count: number
  }>
}

export interface ProductionListParams {
  search?: string
  q?: string
  status?: ProductionOrderStatus
  projectId?: string
  componentId?: string
  currentStageCode?: ProductionStageCode
  page?: number
  limit?: number
  [key: string]: unknown
}

export interface PaginatedProductionResponse<T> {
  data: T[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
