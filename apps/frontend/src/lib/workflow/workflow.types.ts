export type WorkflowDefinitionStatus =
  | 'DRAFT'
  | 'ACTIVE'
  | 'ARCHIVED'

export type WorkflowInstanceStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'APPROVED'
  | 'REJECTED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'ESCALATED'

export type WorkflowStepType =
  | 'APPROVAL'
  | 'REVIEW'
  | 'AUTOMATION'
  | 'NOTIFICATION'

export type WorkflowActionType =
  | 'START'
  | 'APPROVE'
  | 'REJECT'
  | 'MOVE_NEXT'
  | 'ESCALATE'
  | 'COMPLETE'
  | 'CANCEL'

export interface WorkflowStep {
  id: string
  definitionId: string
  key: string
  name: string
  description?: string | null
  type: WorkflowStepType
  order: number
  approverRole?: string | null
  approverUserId?: string | null
  requiredPermission?: string | null
  slaHours?: number | null
  escalationRole?: string | null
  escalationAfterHours?: number | null
  metadata?: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
}

export interface WorkflowDefinition {
  id: string
  key: string
  name: string
  description?: string | null
  module?: string | null
  status: WorkflowDefinitionStatus
  version: number
  metadata?: Record<string, unknown> | null
  steps: WorkflowStep[]
  createdAt: string
  updatedAt: string
}

export interface WorkflowAction {
  id: string
  instanceId: string
  stepId?: string | null
  type: WorkflowActionType
  actorId?: string | null
  comment?: string | null
  fromStatus?: string | null
  toStatus?: string | null
  metadata?: Record<string, unknown> | null
  createdAt: string
  step?: WorkflowStep | null
}

export interface WorkflowInstance {
  id: string
  definitionId: string
  currentStepId?: string | null
  referenceModule: string
  referenceId: string
  status: WorkflowInstanceStatus
  startedById?: string | null
  completedAt?: string | null
  dueAt?: string | null
  escalatedAt?: string | null
  metadata?: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
  definition: WorkflowDefinition
  currentStep?: WorkflowStep | null
  actions: WorkflowAction[]
}

export interface WorkflowListParams {
  search?: string
  q?: string
  module?: string
  referenceModule?: string
  referenceId?: string
  status?: string
  page?: number
  limit?: number
  [key: string]: unknown
}

export interface CreateWorkflowDefinitionPayload {
  key: string
  name: string
  description?: string
  module?: string
  status?: WorkflowDefinitionStatus
  version?: number
  metadata?: Record<string, unknown>
  steps: Array<{
    key: string
    name: string
    description?: string
    type?: WorkflowStepType
    order: number
    approverRole?: string
    approverUserId?: string
    requiredPermission?: string
    slaHours?: number
    escalationRole?: string
    escalationAfterHours?: number
    metadata?: Record<string, unknown>
  }>
}

export interface StartWorkflowPayload {
  definitionKey: string
  referenceModule: string
  referenceId: string
  metadata?: Record<string, unknown>
}

export interface WorkflowActionPayload {
  comment?: string
  reason?: string
  metadata?: Record<string, unknown>
}

export interface PaginatedWorkflowResponse<T> {
  data: T[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
