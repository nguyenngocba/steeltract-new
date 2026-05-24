import type {
  ReactNode,
} from 'react'

interface ChartContainerProps {
  title?: string
  children: ReactNode
}

export function ChartContainer({
  title,
  children,
}: ChartContainerProps) {
  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      {title ? (
        <h2 className="mb-4 text-base font-semibold text-white">
          {title}
        </h2>
      ) : null}
      <div className="min-h-64">{children}</div>
    </section>
  )
}
