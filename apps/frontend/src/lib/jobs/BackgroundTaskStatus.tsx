import {
  Loader2,
  RotateCcw,
} from 'lucide-react'

import { Button } from '../../components/ui/Button'
import { JobStatusBadge } from './JobStatusBadge'
import { RetryStatusBadge } from './RetryStatusBadge'

import type {
  BackgroundJob,
} from './job.types'

interface BackgroundTaskStatusProps {
  job: BackgroundJob
  retrying?: boolean
  onRetry?: (id: string) => void
}

export function BackgroundTaskStatus({
  job,
  retrying = false,
  onRetry,
}: BackgroundTaskStatusProps) {
  const processing =
    job.status === 'RUNNING' ||
    job.status === 'QUEUED' ||
    job.status === 'RETRYING'

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-medium text-white">
              {job.name}
            </p>

            <JobStatusBadge status={job.status} />
            <RetryStatusBadge
              retryCount={job.retryCount}
              maxRetries={job.maxRetries}
            />
          </div>

          <p className="mt-1 text-xs text-zinc-500">
            {job.queue} · {job.id}
          </p>
        </div>

        {processing ? (
          <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
        ) : null}

        {onRetry &&
        ['FAILED', 'DEAD_LETTER'].includes(job.status) ? (
          <Button
            type="button"
            variant="secondary"
            disabled={retrying}
            onClick={() => onRetry(job.id)}
          >
            <span className="inline-flex items-center gap-2">
              <RotateCcw className="h-4 w-4" />
              Retry
            </span>
          </Button>
        ) : null}
      </div>

      {job.lastError ? (
        <p className="mt-3 rounded-md bg-red-500/10 px-3 py-2 text-xs text-red-200">
          {job.lastError}
        </p>
      ) : null}
    </div>
  )
}
