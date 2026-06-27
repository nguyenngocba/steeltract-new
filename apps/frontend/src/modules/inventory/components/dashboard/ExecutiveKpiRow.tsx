import type { ReactNode } from 'react'
import { CockpitKpiCard } from '@/shared/ui/cockpit'

export interface KpiItem {
  id: string
  title: string
  value: string
  note: string
  changePercent: number
  trend: number[]
  tone: 'blue' | 'emerald' | 'cyan' | 'amber' | 'red' | 'purple' | 'indigo' | 'violet' | 'orange'
  icon: ReactNode
}

export function ExecutiveKpiRow({ kpis }: { kpis: KpiItem[] }) {
  return (
    <div className="grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-5">
      {kpis.map((kpi) => (
        <CockpitKpiCard
          key={kpi.id}
          title={kpi.title}
          value={kpi.value}
          subtitle={kpi.note}
          icon={kpi.icon}
          trend={kpi.trend}
          tone={kpi.tone}
        />
      ))}
    </div>
  )
}
