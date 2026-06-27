import type { ReactNode } from 'react'

type CockpitTableShellProps = {
  children: ReactNode
  className?: string
}

export function CockpitTableShell({ children, className = '' }: CockpitTableShellProps) {
  return (
    <div className={`border-0 ring-0 bg-transparent shadow-none rounded-none overflow-auto scrollbar-none ${className}`}>
      {children}
    </div>
  )
}
