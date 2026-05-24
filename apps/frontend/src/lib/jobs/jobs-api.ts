import { api } from '../api'

import type {
  BackgroundJob,
  JobListParams,
  PaginatedJobsResponse,
  ScheduleJobPayload,
} from './job.types'

type JobListResult =
  | BackgroundJob[]
  | PaginatedJobsResponse<BackgroundJob>

export async function getJobs(
  params?: JobListParams,
) {
  const response =
    await api.get<JobListResult>('/jobs', {
      params,
    })

  return response.data
}

export async function getJob(id: string) {
  const response =
    await api.get<BackgroundJob>(`/jobs/${id}`)

  return response.data
}

export async function scheduleJob(
  payload: ScheduleJobPayload,
) {
  const response =
    await api.post<BackgroundJob>(
      '/jobs',
      payload,
    )

  return response.data
}

export async function retryJob(id: string) {
  const response =
    await api.post<BackgroundJob>(
      `/jobs/${id}/retry`,
    )

  return response.data
}

export async function runWorkerTick() {
  const response =
    await api.post<void>('/jobs/worker/tick')

  return response.data
}
