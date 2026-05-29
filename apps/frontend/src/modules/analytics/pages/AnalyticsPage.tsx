import { OperationalShell } from '@/shared/layouts/OperationalShell'

import { AiInsightsPanel } from '../components/AiInsightsPanel'
import { ExecutiveCockpit } from '../components/ExecutiveCockpit'
import { ForecastPanel } from '../components/ForecastPanel'
import { KpiRuntimeGrid } from '../components/KpiRuntimeGrid'

export function AnalyticsPage() {
  return (
    <OperationalShell>
      <div className="space-y-6 p-6">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-pink-400">
            Analytics Runtime
          </div>

          <h1 className="mt-2 text-4xl font-black text-white">
            Industrial Intelligence Platform
          </h1>
        </div>

        <ExecutiveCockpit />

        <KpiRuntimeGrid />

        <div className="grid grid-cols-2 gap-6">
          <AiInsightsPanel />

          <ForecastPanel />
        </div>
      </div>
    </OperationalShell>
  )
}
