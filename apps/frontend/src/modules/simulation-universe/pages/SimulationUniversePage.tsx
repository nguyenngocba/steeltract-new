import { OperationalShell } from '@/shared/layouts/OperationalShell'

import { PredictiveScenarioPanel } from '../components/PredictiveScenarioPanel'
import { SimulationForecastGrid } from '../components/SimulationForecastGrid'
import { UniverseTopologyPanel } from '../components/UniverseTopologyPanel'
import { VirtualSandboxPanel } from '../components/VirtualSandboxPanel'

export function SimulationUniversePage() {
  return (
    <OperationalShell>
      <div className="space-y-6 p-6">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-cyan-300">
            Simulation Universe
          </div>

          <h1 className="mt-2 text-4xl font-black text-white">
            Industrial Simulation Engine
          </h1>

          <div className="mt-2 text-sm text-zinc-500">
            Predictive industrial sandbox & operational forecasting runtime
          </div>
        </div>

        <SimulationForecastGrid />

        <div className="grid grid-cols-2 gap-6">
          <PredictiveScenarioPanel />

          <VirtualSandboxPanel />
        </div>

        <UniverseTopologyPanel />
      </div>
    </OperationalShell>
  )
}
