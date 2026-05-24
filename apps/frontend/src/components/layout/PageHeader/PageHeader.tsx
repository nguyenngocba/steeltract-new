import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  actions?: ReactNode
}

export function PageHeader({
  title,
  actions,
}: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <h1 className="text-2xl font-semibold text-white md:text-3xl">
        {title}
      </h1>

      {actions ? (
        <div className="flex flex-wrap gap-2">
          {actions}
        </div>
      ) : null}
    </div>
  )
}
