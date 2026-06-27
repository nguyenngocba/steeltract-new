import type { ReactNode } from 'react'

export function CockpitEmptyState({
  icon,
  title,
  description,
}: {
  icon?: ReactNode
  title: string
  description?: string
}) {
  return (
    <div className="flex flex-col items-center justify-center p-6 text-center">
      {icon && <div className="mb-2 text-slate-500">{icon}</div>}
      <h4 className="text-xs font-semibold text-slate-350">{title}</h4>
      {description && <p className="mt-1 text-[11px] text-slate-500 max-w-xs">{description}</p>}
    </div>
  )
}
