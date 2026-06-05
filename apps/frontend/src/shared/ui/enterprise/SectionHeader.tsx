type Props = {
  title: string
  description?: string
}

export function SectionHeader({ title, description }: Props) {
  return (
    <header className="mb-2 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 backdrop-blur-xl">
      <div className="flex min-w-0 flex-col gap-0.5 md:flex-row md:items-end md:justify-between md:gap-4">
        <h2 className="truncate text-base font-semibold tracking-tight text-white">{title}</h2>
        {description && <p className="truncate text-xs text-slate-400 md:text-right">{description}</p>}
      </div>
    </header>
  )
}
