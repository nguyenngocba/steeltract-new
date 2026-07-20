import { OperationalShell } from '@/shared/layouts/OperationalShell'

import { DataLakePanel } from '../components/DataLakePanel'
import { IntelligenceMeshPanel } from '../components/IntelligenceMeshPanel'
import { ReplayEnginePanel } from '../components/ReplayEnginePanel'
import { TelemetryLakeGrid } from '../components/TelemetryLakeGrid'

export function IntelligencePage() {
  return (
    <OperationalShell>
      <div className="space-y-6 p-6">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-rose-400">
            Intelligence Mesh
          </div>

          <h1 className="mt-2 text-4xl font-black text-white">
            Trung tâm dữ liệu vận hành
          </h1>

          <div className="mt-2 text-sm text-zinc-500">
            Tổng hợp dữ liệu vận hành và tín hiệu phân tích cho đội điều hành.
          </div>
        </div>

        <TelemetryLakeGrid />

        <div className="grid grid-cols-2 gap-6">
          <DataLakePanel />

          <IntelligenceMeshPanel />
        </div>

        <ReplayEnginePanel />
      </div>
    </OperationalShell>
  )
}
