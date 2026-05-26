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
        'relative overflow-hidden rounded-xl border border-cyan-500/10 bg-[#071321]/90 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.035),0_14px_44px_rgba(0,0,0,0.16)]',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            {label}
          </p>
          <p className="mt-2 text-2xl font-semibold text-white">
            {value}
          </p>
        </div>

        {icon ? (
          <div className="rounded-xl border border-cyan-500/15 bg-cyan-500/10 p-2.5 text-cyan-300 shadow-[0_0_22px_rgba(34,211,238,0.08)]">
            {icon}
          </div>
        ) : null}
      </div>

      {trend ? (
        <div className="mt-3 text-xs text-zinc-300">
          {trend}
        </div>
      ) : null}
    </div>
  )
}
