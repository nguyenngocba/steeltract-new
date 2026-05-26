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
        'relative overflow-hidden rounded-xl border border-cyan-500/10 bg-[#071321]/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.035),0_18px_55px_rgba(0,0,0,0.18)]',
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/35 to-transparent" />
      {title || actions ? (
        <div className="relative flex flex-col gap-3 border-b border-cyan-500/10 px-4 py-3 md:flex-row md:items-center md:justify-between">
          <div>
            {title ? (
              <h2 className="text-base font-semibold text-white">
                {title}
              </h2>
            ) : null}

            {description ? (
              <p className="mt-1 text-xs leading-5 text-zinc-500">
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

      <div className="relative p-4">{children}</div>
    </section>
  )
}
