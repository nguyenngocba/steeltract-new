export interface ActivityItem {
  id: string
  timestamp: string
  operatorName: string
  module: string
  description: string
}

export function ActivityTimeline({ activities }: { activities: ActivityItem[] }) {
  return (
    <div className="relative pl-4 border-l border-white/5 space-y-3.5 max-h-[190px] overflow-auto scrollbar-thin py-1">
      {mockDataOffsetDotHack()}
      {activities.map((act) => (
        <div key={act.id} className="relative text-xs">
          <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border-2 border-[#050b14] bg-cyan-400" />
          <div className="flex items-center justify-between text-slate-400 font-medium">
            <span className="text-cyan-300 font-semibold">{act.operatorName} ({act.module})</span>
            <span className="text-[10px] font-mono text-slate-500">{act.timestamp}</span>
          </div>
          <div className="text-[11px] text-slate-300 mt-0.5">{act.description}</div>
        </div>
      ))}
    </div>
  )
}

// Visual layout helper dot offsets
function mockDataOffsetDotHack() {
  return null
}
