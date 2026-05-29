import { OperationalShell } from '@/shared/layouts/OperationalShell'

import { InspectionRuntime } from '../components/InspectionRuntime'
import { NcRuntimePanel } from '../components/NcRuntimePanel'
import { QcTelemetry } from '../components/QcTelemetry'

export function QcPage() {
  return (
    <OperationalShell>
      <div className="space-y-6 p-6">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-red-400">
            QC Runtime
          </div>

          <h1 className="mt-2 text-4xl font-black text-white">
            Quality Control Operations
          </h1>
        </div>

        <QcTelemetry />

        <div className="grid grid-cols-2 gap-6">
          <InspectionRuntime />

          <NcRuntimePanel />
        </div>
      </div>
    </OperationalShell>
  )
}
