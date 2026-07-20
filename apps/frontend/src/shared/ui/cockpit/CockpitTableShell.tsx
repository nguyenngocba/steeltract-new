import type { ReactNode } from 'react'

type CockpitTableShellProps = {
  children: ReactNode
  className?: string
}

export function CockpitTableShell({ children, className = '' }: CockpitTableShellProps) {
  return (
    <div className={`min-h-0 flex-1 rounded-xl border border-white/[0.035] bg-slate-950/18 ring-1 ring-white/[0.025] overflow-auto scrollbar-thin ${className}`}>
      {children}
    </div>
  )
}
