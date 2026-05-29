import { OperationalShell } from '@/shared/layouts/OperationalShell'

import { ProductionTelemetry } from '../components/ProductionTelemetry'
import { ProductionWorkOrders } from '../components/ProductionWorkOrders'
import { WorkCenterRuntime } from '../components/WorkCenterRuntime'

export function ProductionPage() {
  return (
    <OperationalShell>
      <div className="space-y-6 p-6">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-orange-400">
            Production Runtime
          </div>

          <h1 className="mt-2 text-4xl font-black text-white">
            Manufacturing Operations
          </h1>
        </div>

        <ProductionTelemetry />

        <div className="grid grid-cols-2 gap-6">
          <WorkCenterRuntime />

          <ProductionWorkOrders />
        </div>
      </div>
    </OperationalShell>
  )
}
