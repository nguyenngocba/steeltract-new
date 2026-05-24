export type BackgroundJobStatus =
  | 'QUEUED'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED'
  | 'RETRYING'
  | 'CANCELLED'
  | 'DEAD_LETTER'

export type JobExecutionStatus =
  | 'STARTED'
  | 'COMPLETED'
  | 'FAILED'

export interface JobExecution {
  id: string
  jobId: string
  status: JobExecutionStatus
  workerId?: string | null
  startedAt: string
  completedAt?: string | null
  durationMs?: number | null
  error?: string | null
  metadata?: Record<string, unknown> | null
}

export interface BackgroundJob {
  id: string
  name: string
  queue: string
  payload: Record<string, unknown>
  status: BackgroundJobStatus
  idempotencyKey?: string | null
  priority: number
  runAt: string
  retryCount: number
  maxRetries: number
  lockedAt?: string | null
  lockedBy?: string | null
  heartbeatAt?: string | null
  completedAt?: string | null
  failedAt?: string | null
  deadLetteredAt?: string | null
  lastError?: string | null
  createdAt: string
  updatedAt: string
  executions: JobExecution[]
}

export interface JobListParams {
  queue?: string
  name?: string
  status?: BackgroundJobStatus
  page?: number
  limit?: number
  [key: string]: unknown
}

export interface ScheduleJobPayload {
  name: string
  queue?: string
  payload?: Record<string, unknown>
  idempotencyKey?: string
  priority?: number
  delaySeconds?: number
  maxRetries?: number
}

export interface PaginatedJobsResponse<T> {
  data: T[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
