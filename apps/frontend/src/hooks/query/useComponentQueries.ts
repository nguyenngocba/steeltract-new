import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {
  invalidateComponents,
} from '../../lib/query/invalidation'
import { queryKeys } from '../../lib/query/query-keys'
import {
  createComponent,
  getComponents,
  uploadComponentImage,
} from '../../services/api/components.api'

import type {
  CreateComponentPayload,
} from '../../services/api/components.api'

export function useComponentsQuery() {
  return useQuery({
    queryKey: queryKeys.components.list(),
    queryFn: () => getComponents(),
  })
}

export function useCreateComponentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createComponent,
    onSuccess: () =>
      invalidateComponents(queryClient),
  })
}

export function useUploadComponentImageMutation() {
  return useMutation({
    mutationFn: uploadComponentImage,
  })
}

export type {
  CreateComponentPayload,
}
