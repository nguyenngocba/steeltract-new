import type { ReactNode } from 'react'

type Props = {
  title?: string
  children: ReactNode
  className?: string
}

export function RuntimePanel({ title, children, className = '' }: Props) {
  return (
    <section className={`overflow-hidden rounded-xl border border-white/10 bg-white/[0.055] shadow-[0_18px_44px_rgba(0,0,0,0.18)] backdrop-blur-xl ${className}`}>
      {title && (
        <div className="border-b border-white/10 px-4 py-3">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">{title}</div>
        </div>
      )}
      <div className="p-4">{children}</div>
    </section>
  )
}
