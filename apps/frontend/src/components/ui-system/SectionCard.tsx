import clsx from 'clsx'
import type {
  ReactNode,
} from 'react'

interface SectionCardProps {
  title?: string
  description?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
}

export function SectionCard({
  title,
  description,
  actions,
  children,
  className,
}: SectionCardProps) {
  return (
    <section
      className={clsx(
        'rounded-xl border border-zinc-800 bg-zinc-900/80 shadow-[var(--shadow-sm)]',
        className,
      )}
    >
      {title || actions ? (
        <div className="flex flex-col gap-3 border-b border-zinc-800 px-5 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            {title ? (
              <h2 className="text-base font-semibold text-white">
                {title}
              </h2>
            ) : null}

            {description ? (
              <p className="mt-1 text-sm text-zinc-400">
                {description}
              </p>
            ) : null}
          </div>

          {actions ? (
            <div className="flex flex-wrap gap-2">
              {actions}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="p-5">{children}</div>
    </section>
  )
}
