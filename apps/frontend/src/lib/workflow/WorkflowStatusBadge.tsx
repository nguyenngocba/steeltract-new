import clsx from 'clsx'

import type {
  WorkflowInstanceStatus,
} from './workflow.types'

interface WorkflowStatusBadgeProps {
  status: WorkflowInstanceStatus | string
}

const statusClassName: Record<string, string> = {
  PENDING: 'bg-zinc-700 text-zinc-200',
  IN_PROGRESS: 'bg-cyan-500/20 text-cyan-300',
  APPROVED: 'bg-emerald-500/20 text-emerald-300',
  REJECTED: 'bg-red-500/20 text-red-300',
  COMPLETED: 'bg-green-500/20 text-green-300',
  CANCELLED: 'bg-zinc-600 text-zinc-200',
  ESCALATED: 'bg-amber-500/20 text-amber-300',
}

export function WorkflowStatusBadge({
  status,
}: WorkflowStatusBadgeProps) {
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
