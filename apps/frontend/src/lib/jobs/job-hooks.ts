import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import { invalidateJobs } from '../query/invalidation'
import { queryKeys } from '../query/query-keys'
import {
  getJob,
  getJobs,
  retryJob,
  runWorkerTick,
  scheduleJob,
} from './jobs-api'

import type {
  JobListParams,
  ScheduleJobPayload,
} from './job.types'

export function useJobsQuery(
  params?: JobListParams,
) {
  return useQuery({
    queryKey: queryKeys.jobs.list(params),
    queryFn: () => getJobs(params),
    refetchInterval: 10000,
  })
}

export function useJobQuery(id?: string) {
  return useQuery({
    queryKey: id
      ? queryKeys.jobs.detail(id)
      : queryKeys.jobs.detail('pending'),
    queryFn: () => getJob(id ?? ''),
    enabled: Boolean(id),
    refetchInterval: (query) => {
      const status = query.state.data?.status

      return status === 'RUNNING' ||
        status === 'QUEUED' ||
        status === 'RETRYING'
        ? 5000
        : false
    },
  })
}

export function useScheduleJobMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (
      payload: ScheduleJobPayload,
    ) => scheduleJob(payload),
    onSuccess: () => invalidateJobs(queryClient),
  })
}

export function useRetryJobMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: retryJob,
    onSuccess: () => invalidateJobs(queryClient),
  })
}

export function useWorkerTickMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: runWorkerTick,
    onSuccess: () => invalidateJobs(queryClient),
  })
}
