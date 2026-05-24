import {
  AlertTriangle,
} from 'lucide-react'
import type {
  ReactNode,
} from 'react'

interface ErrorStateProps {
  title?: string
  message?: string
  action?: ReactNode
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  action,
}: ErrorStateProps) {
  return (
    <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-5">
      <div className="flex gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 text-red-300" />
        <div>
          <p className="text-sm font-medium text-red-100">
            {title}
          </p>
          {message ? (
            <p className="mt-1 text-sm text-red-200/80">
              {message}
            </p>
          ) : null}
          {action ? (
            <div className="mt-4">{action}</div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
