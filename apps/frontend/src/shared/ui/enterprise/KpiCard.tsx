type Props = {
  title: string
  value: string
  trend?: string
}

export function KpiCard({ title, value, trend }: Props) {
  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.055] p-4 shadow-[0_16px_38px_rgba(0,0,0,0.16)] backdrop-blur-xl">
      <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">{title}</div>
      <div className="mt-2 text-2xl font-semibold tracking-tight text-white">{value}</div>
      {trend && <div className="mt-2 text-xs font-medium text-emerald-500">{trend}</div>}
    </section>
  )
}
