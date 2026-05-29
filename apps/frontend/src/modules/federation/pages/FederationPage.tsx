import { OperationalShell } from '@/shared/layouts/OperationalShell'

import { CrossSiteTelemetry } from '../components/CrossSiteTelemetry'
import { FederationTopology } from '../components/FederationTopology'
import { GlobalOperationsGrid } from '../components/GlobalOperationsGrid'
import { PlantRuntimeStatus } from '../components/PlantRuntimeStatus'

export function FederationPage() {
  return (
    <OperationalShell>
      <div className="space-y-6 p-6">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-sky-400">
            Federation Runtime
          </div>

          <h1 className="mt-2 text-4xl font-black text-white">
            Enterprise Industrial Federation
          </h1>

          <div className="mt-2 text-sm text-zinc-500">
            Multi-plant operational orchestration & enterprise telemetry
          </div>
        </div>

        <CrossSiteTelemetry />

        <FederationTopology />

        <div className="grid grid-cols-2 gap-6">
          <PlantRuntimeStatus />

          <GlobalOperationsGrid />
        </div>
      </div>
    </OperationalShell>
  )
}
