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
            Autonomous Runtime
          </div>

          <h1 className="mt-2 text-4xl font-black text-white">
            Industrial Autonomous Engine
          </h1>

          <div className="mt-2 text-sm text-zinc-500">
            Self-optimizing industrial orchestration runtime
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
