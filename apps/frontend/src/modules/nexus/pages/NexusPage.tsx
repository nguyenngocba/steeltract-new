import { OperationalShell } from '@/shared/layouts/OperationalShell'

import { CognitiveSignalPanel } from '../components/CognitiveSignalPanel'
import { GlobalCognitionGrid } from '../components/GlobalCognitionGrid'
import { NeuralTopologyPanel } from '../components/NeuralTopologyPanel'
import { UnifiedCommandPanel } from '../components/UnifiedCommandPanel'

export function NexusPage() {
  return (
    <OperationalShell>
      <div className="space-y-6 p-6">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-pink-400">
            Neural Command Nexus
          </div>

          <h1 className="mt-2 text-4xl font-black text-white">
            Unified Industrial Brain
          </h1>

          <div className="mt-2 text-sm text-zinc-500">
            Enterprise cognitive orchestration & industrial intelligence core
          </div>
        </div>

        <GlobalCognitionGrid />

        <div className="grid grid-cols-2 gap-6">
          <CognitiveSignalPanel />

          <UnifiedCommandPanel />
        </div>

        <NeuralTopologyPanel />
      </div>
    </OperationalShell>
  )
}
