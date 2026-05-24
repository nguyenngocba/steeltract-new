import {
  Inbox,
} from 'lucide-react'
import type {
  ReactNode,
} from 'react'

interface EmptyStateProps {
  title?: string
  description?: string
  action?: ReactNode
}

export function EmptyState({
  title = 'No data',
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed border-zinc-800 bg-zinc-900/40 p-8 text-center">
      <Inbox className="mb-3 h-8 w-8 text-zinc-500" />
      <p className="text-sm font-medium text-white">
        {title}
      </p>

      {description ? (
        <p className="mt-2 max-w-md text-sm text-zinc-400">
          {description}
        </p>
      ) : null}

      {action ? (
        <div className="mt-4">{action}</div>
      ) : null}
    </div>
  )
}
