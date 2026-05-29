import { OperationalShell } from '@/shared/layouts/OperationalShell'

import { FactoryTopology } from '../components/FactoryTopology'
import { MachineRuntimeMap } from '../components/MachineRuntimeMap'
import { OperationalHeatmap } from '../components/OperationalHeatmap'
import { TwinTelemetry } from '../components/TwinTelemetry'

export function DigitalTwinPage() {
  return (
    <OperationalShell>
      <div className="space-y-6 p-6">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-indigo-400">
            Digital Twin Runtime
          </div>

          <h1 className="mt-2 text-4xl font-black text-white">
            Industrial Visualization Engine
          </h1>

          <div className="mt-2 text-sm text-zinc-500">
            Realtime operational topology & equipment intelligence
          </div>
        </div>

        <TwinTelemetry />

        <div className="grid grid-cols-2 gap-6">
          <FactoryTopology />

          <MachineRuntimeMap />
        </div>

        <OperationalHeatmap />
      </div>
    </OperationalShell>
  )
}
