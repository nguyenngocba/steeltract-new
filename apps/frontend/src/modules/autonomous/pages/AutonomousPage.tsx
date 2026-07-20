import { OperationalShell } from '@/shared/layouts/OperationalShell'

import { AutonomousDecisionPanel } from '../components/AutonomousDecisionPanel'
import { OptimizationRuntimeGrid } from '../components/OptimizationRuntimeGrid'
import { PredictiveOrchestrationPanel } from '../components/PredictiveOrchestrationPanel'
import { SelfHealingPanel } from '../components/SelfHealingPanel'

export function AutonomousPage() {
  return (
    <OperationalShell>
      <div className="space-y-6 p-6">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-orange-400">
            Tự động hóa vận hành
          </div>

          <h1 className="mt-2 text-4xl font-black text-white">
            Trung tâm điều phối tự động
          </h1>

          <div className="mt-2 text-sm text-zinc-500">
            Theo dõi các đề xuất điều phối và tình huống hệ thống có thể tự xử lý.
          </div>
        </div>

        <OptimizationRuntimeGrid />

        <div className="grid grid-cols-2 gap-6">
          <AutonomousDecisionPanel />

          <SelfHealingPanel />
        </div>

        <PredictiveOrchestrationPanel />
      </div>
    </OperationalShell>
  )
}
