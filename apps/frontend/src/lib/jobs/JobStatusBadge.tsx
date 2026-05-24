import clsx from 'clsx'

import type {
  BackgroundJobStatus,
} from './job.types'

interface JobStatusBadgeProps {
  status: BackgroundJobStatus | string
}

const statusClassName: Record<string, string> = {
  QUEUED: 'bg-zinc-700 text-zinc-200',
  RUNNING: 'bg-cyan-500/20 text-cyan-300',
  COMPLETED: 'bg-emerald-500/20 text-emerald-300',
  FAILED: 'bg-red-500/20 text-red-300',
  RETRYING: 'bg-amber-500/20 text-amber-300',
  CANCELLED: 'bg-zinc-600 text-zinc-200',
  DEAD_LETTER: 'bg-red-900/70 text-red-200',
}

export function JobStatusBadge({
  status,
}: JobStatusBadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium',
        statusClassName[status] ??
          'bg-zinc-700 text-zinc-200',
      )}
    >
      {status.replaceAll('_', ' ')}
    </span>
  )
}
