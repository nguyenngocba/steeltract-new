export function CockpitRecentList({
  items,
  emptyMessage = 'Chưa có hoạt động gần đây.',
}: {
  items: Array<{
    id: string
    title: string
    subtitle?: string
    time?: string
    highlight?: boolean
    statusDot?: string
  }>
  emptyMessage?: string
}) {
  return (
    <div className="space-y-1">
      {items.map((item) => (
        <div key={item.id} className="flex items-start justify-between rounded-xl border border-white/5 bg-white/[0.02] p-2.5 text-xs">
          <div className="flex min-w-0 flex-1 gap-2">
            {item.statusDot && <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${item.statusDot}`} />}
            <div className="min-w-0 flex-1">
              <div className={`truncate font-medium ${item.highlight ? 'text-cyan-400 font-mono' : 'text-slate-200'}`}>
                {item.title}
              </div>
              {item.subtitle && <p className="mt-0.5 truncate text-[11px] text-slate-500">{item.subtitle}</p>}
            </div>
          </div>
          {item.time && <span className="ml-2 shrink-0 font-mono text-[10px] text-slate-500">{item.time}</span>}
        </div>
      ))}
      {items.length === 0 && (
        <p className="py-6 text-center text-xs text-slate-500">{emptyMessage}</p>
      )}
    </div>
  )
}
