import { CircleDot } from 'lucide-react'

export interface AlertItem {
  id: string
  timestamp: string
  severity: 'critical' | 'warning' | 'info'
  title: string
  message: string
}

export function AlertsPanel({ alerts }: { alerts: AlertItem[] }) {
  return (
    <div className="space-y-1.5 max-h-[220px] overflow-auto scrollbar-thin py-1">
      {alerts.map((a) => (
        <div 
          key={a.id} 
          className={`rounded-lg border px-3 py-2 flex items-start gap-2 text-xs transition duration-150 ${
            a.severity === 'critical' 
              ? 'border-red-950 bg-red-950/20 text-red-200' 
              : a.severity === 'warning' 
              ? 'border-amber-950 bg-amber-950/20 text-amber-200'
              : 'border-blue-950 bg-blue-950/20 text-blue-200'
          }`}
        >
          <CircleDot className={`h-4 w-4 shrink-0 mt-0.5 ${
            a.severity === 'critical' ? 'text-red-400' : a.severity === 'warning' ? 'text-amber-400' : 'text-blue-400'
          }`} />
          <div className="min-w-0 flex-1">
            <div className="font-bold flex items-center justify-between">
              <span className="truncate">{a.title}</span>
              <span className="text-[10px] text-slate-500 font-mono shrink-0 ml-2">{a.timestamp}</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5 truncate">{a.message}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
