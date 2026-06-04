type Props = {
  title: string
  description?: string
}

export function SectionHeader({ title, description }: Props) {
  return (
    <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-300">SteelTrack ERP</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">{title}</h1>
        {description && <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-400">{description}</p>}
      </div>
    </header>
  )
}
