export function CockpitSidebarStats({
  stats,
}: {
  stats: Array<{ label: string; value: string | number; colorClass?: string }>
}) {
  return (
    <div className="grid grid-cols-2 gap-1">
      {stats.map((s, idx) => (
        <div key={idx} className="rounded-xl border border-white/5 bg-white/[0.02] p-2.5">
          <div className="text-[11px] text-slate-500 font-medium">{s.label}</div>
          <div className={`mt-1 text-sm font-semibold tabular-nums ${s.colorClass ?? 'text-slate-100'}`}>{s.value}</div>
        </div>
      ))}
    </div>
  )
}
