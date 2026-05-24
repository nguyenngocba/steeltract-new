import { api } from '../api'

import type {
  CreateWorkflowDefinitionPayload,
  PaginatedWorkflowResponse,
  StartWorkflowPayload,
  WorkflowActionPayload,
  WorkflowDefinition,
  WorkflowInstance,
  WorkflowListParams,
} from './workflow.types'

type WorkflowListResult<T> =
  | T[]
  | PaginatedWorkflowResponse<T>

export async function getWorkflowDefinitions(
  params?: WorkflowListParams,
) {
  const response = await api.get<
    WorkflowListResult<WorkflowDefinition>
  >('/workflow/definitions', {
    params,
  })

  return response.data
}

export async function createWorkflowDefinition(
  payload: CreateWorkflowDefinitionPayload,
) {
  const response =
    await api.post<WorkflowDefinition>(
      '/workflow/definitions',
      payload,
    )

  return response.data
}

export async function getWorkflowInstances(
  params?: WorkflowListParams,
) {
  const response = await api.get<
    WorkflowListResult<WorkflowInstance>
  >('/workflow/instances', {
    params,
  })

  return response.data
}

export async function getWorkflowInstance(
  id: string,
) {
  const response =
    await api.get<WorkflowInstance>(
      `/workflow/instances/${id}`,
    )

  return response.data
}

export async function startWorkflow(
  payload: StartWorkflowPayload,
) {
  const response =
    await api.post<WorkflowInstance>(
      '/workflow/start',
      payload,
    )

  return response.data
}

export async function approveWorkflowStep(
  id: string,
  payload: WorkflowActionPayload,
) {
  const response =
    await api.post<WorkflowInstance>(
      `/workflow/instances/${id}/approve`,
      payload,
    )

  return response.data
}

export async function rejectWorkflowStep(
  id: string,
  payload: WorkflowActionPayload,
) {
  const response =
    await api.post<WorkflowInstance>(
      `/workflow/instances/${id}/reject`,
      payload,
    )

  return response.data
}

export async function moveWorkflowNextStep(
  id: string,
  payload: WorkflowActionPayload,
) {
  const response =
    await api.post<WorkflowInstance>(
      `/workflow/instances/${id}/move-next`,
      payload,
    )

  return response.data
}

export async function escalateWorkflow(
  id: string,
  payload: WorkflowActionPayload,
) {
  const response =
    await api.post<WorkflowInstance>(
      `/workflow/instances/${id}/escalate`,
      payload,
    )

  return response.data
}
