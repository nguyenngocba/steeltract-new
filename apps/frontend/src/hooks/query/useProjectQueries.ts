import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {
  invalidateProjects,
} from '../../lib/query/invalidation'
import { queryKeys } from '../../lib/query/query-keys'
import {
  createProject,
  deleteProject,
  getProjects,
  updateProject,
} from '../../services/api/projects.api'

import type {
  SaveProjectPayload,
} from '../../services/api/projects.api'

export function useProjectsQuery() {
  return useQuery({
    queryKey: queryKeys.projects.list(),
    queryFn: () => getProjects(),
  })
}

export function useCreateProjectMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createProject,
    onSuccess: () =>
      invalidateProjects(queryClient),
  })
}

export function useUpdateProjectMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: SaveProjectPayload
    }) => updateProject(id, payload),
    onSuccess: () =>
      invalidateProjects(queryClient),
  })
}

export function useDeleteProjectMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteProject,
    onSuccess: () =>
      invalidateProjects(queryClient),
  })
}
