import type {
  ReactNode,
} from 'react'

interface FilterBarProps {
  search?: ReactNode
  filters?: ReactNode
  actions?: ReactNode
}

export function FilterBar({
  search,
  filters,
  actions,
}: FilterBarProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900/70 p-3 md:flex-row md:items-center md:justify-between">
      <div className="min-w-0 flex-1">
        {search}
      </div>

      {filters ? (
        <div className="flex flex-wrap gap-2">
          {filters}
        </div>
      ) : null}

      {actions ? (
        <div className="flex flex-wrap gap-2">
          {actions}
        </div>
      ) : null}
    </div>
  )
}
