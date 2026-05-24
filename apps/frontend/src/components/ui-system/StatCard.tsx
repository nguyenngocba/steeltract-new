import clsx from 'clsx'
import type {
  ReactNode,
} from 'react'

interface StatCardProps {
  label: string
  value: ReactNode
  icon?: ReactNode
  trend?: ReactNode
  className?: string
}

export function StatCard({
  label,
  value,
  icon,
  trend,
  className,
}: StatCardProps) {
  return (
    <div
      className={clsx(
        'rounded-xl border border-zinc-800 bg-zinc-900 p-5 shadow-[var(--shadow-sm)]',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm text-zinc-400">
            {label}
          </p>
          <p className="mt-2 text-2xl font-semibold text-white">
            {value}
          </p>
        </div>

        {icon ? (
          <div className="rounded-lg bg-cyan-500/10 p-2 text-cyan-300">
            {icon}
          </div>
        ) : null}
      </div>

      {trend ? (
        <div className="mt-4 text-sm text-zinc-300">
          {trend}
        </div>
      ) : null}
    </div>
  )
}
