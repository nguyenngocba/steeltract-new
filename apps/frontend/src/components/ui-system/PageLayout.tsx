import type {
  ReactNode,
} from 'react'

interface PageLayoutProps {
  title?: string
  description?: string
  actions?: ReactNode
  children: ReactNode
}

export function PageLayout({
  title,
  description,
  actions,
  children,
}: PageLayoutProps) {
  return (
    <div className="space-y-6">
      {title || actions ? (
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            {title ? (
              <h1 className="text-2xl font-semibold tracking-normal text-white md:text-3xl">
                {title}
              </h1>
            ) : null}

            {description ? (
              <p className="mt-2 max-w-3xl text-sm text-zinc-400">
                {description}
              </p>
            ) : null}
          </div>

          {actions ? (
            <div className="flex flex-wrap gap-2">
              {actions}
            </div>
          ) : null}
        </header>
      ) : null}

      {children}
    </div>
  )
}
