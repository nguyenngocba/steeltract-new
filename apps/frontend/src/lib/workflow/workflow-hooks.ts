import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import { queryKeys } from '../query/query-keys'
import {
  approveWorkflowStep,
  createWorkflowDefinition,
  escalateWorkflow,
  getWorkflowDefinitions,
  getWorkflowInstance,
  getWorkflowInstances,
  moveWorkflowNextStep,
  rejectWorkflowStep,
  startWorkflow,
} from './workflow-api'

import type {
  CreateWorkflowDefinitionPayload,
  StartWorkflowPayload,
  WorkflowActionPayload,
  WorkflowListParams,
} from './workflow.types'

function invalidateWorkflow(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  return queryClient.invalidateQueries({
    queryKey: queryKeys.workflow.all,
  })
}

export function useWorkflowDefinitionsQuery(
  params?: WorkflowListParams,
) {
  return useQuery({
    queryKey:
      queryKeys.workflow.definitionList(params),
    queryFn: () => getWorkflowDefinitions(params),
  })
}

export function useWorkflowInstancesQuery(
  params?: WorkflowListParams,
) {
  return useQuery({
    queryKey:
      queryKeys.workflow.instanceList(params),
    queryFn: () => getWorkflowInstances(params),
  })
}

export function useWorkflowInstanceQuery(
  id?: string,
) {
  return useQuery({
    queryKey: id
      ? queryKeys.workflow.instance(id)
      : queryKeys.workflow.instance('pending'),
    queryFn: () => getWorkflowInstance(id ?? ''),
    enabled: Boolean(id),
  })
}

export function useCreateWorkflowDefinitionMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (
      payload: CreateWorkflowDefinitionPayload,
    ) => createWorkflowDefinition(payload),
    onSuccess: () =>
      invalidateWorkflow(queryClient),
  })
}

export function useStartWorkflowMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: StartWorkflowPayload) =>
      startWorkflow(payload),
    onSuccess: () =>
      invalidateWorkflow(queryClient),
  })
}

export function useApproveWorkflowStepMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: WorkflowActionPayload
    }) => approveWorkflowStep(id, payload),
    onSuccess: () =>
      invalidateWorkflow(queryClient),
  })
}

export function useRejectWorkflowStepMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: WorkflowActionPayload
    }) => rejectWorkflowStep(id, payload),
    onSuccess: () =>
      invalidateWorkflow(queryClient),
  })
}

export function useMoveWorkflowNextStepMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: WorkflowActionPayload
    }) => moveWorkflowNextStep(id, payload),
    onSuccess: () =>
      invalidateWorkflow(queryClient),
  })
}

export function useEscalateWorkflowMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: WorkflowActionPayload
    }) => escalateWorkflow(id, payload),
    onSuccess: () =>
      invalidateWorkflow(queryClient),
  })
}
