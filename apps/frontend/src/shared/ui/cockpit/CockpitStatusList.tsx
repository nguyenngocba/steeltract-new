export function CockpitStatusList({
  items,
  emptyMessage = 'Không có dữ liệu.',
}: {
  items: Array<{
    id: string
    label: string
    value: string | number
    statusTone?: 'emerald' | 'amber' | 'red' | 'blue' | 'purple' | 'cyan'
  }>
  emptyMessage?: string
}) {
  const toneClasses = {
    emerald: 'bg-emerald-950 text-emerald-300 border-emerald-500/20',
    amber: 'bg-amber-950 text-amber-300 border-amber-500/20',
    red: 'bg-red-950 text-red-300 border-red-500/20',
    blue: 'bg-blue-950 text-blue-300 border-blue-500/20',
    purple: 'bg-purple-950 text-purple-300 border-purple-500/20',
    cyan: 'bg-cyan-950 text-cyan-300 border-cyan-500/20',
  }
  return (
    <div className="space-y-1">
      {items.map((item) => (
        <div key={item.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.015] p-2 px-3 text-xs">
          <span className="text-slate-350">{item.label}</span>
          <span className={`rounded-lg border px-2 py-0.5 text-[10px] font-medium font-mono ${item.statusTone ? toneClasses[item.statusTone] : 'border-slate-800 text-slate-400 bg-slate-900/40'}`}>
            {item.value}
          </span>
        </div>
      ))}
      {items.length === 0 && (
        <p className="py-6 text-center text-xs text-slate-500">{emptyMessage}</p>
      )}
    </div>
  )
}
