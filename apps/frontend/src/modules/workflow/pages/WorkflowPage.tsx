import { OperationalShell } from '@/shared/layouts/OperationalShell'

import { AutomationRuntimePanel } from '../components/AutomationRuntimePanel'
import { ExecutionTimeline } from '../components/ExecutionTimeline'
import { TriggerRuntimePanel } from '../components/TriggerRuntimePanel'
import { WorkflowTopology } from '../components/WorkflowTopology'

export function WorkflowPage() {
  return (
    <OperationalShell>
      <div className="space-y-6 p-6">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-lime-400">
            Workflow Runtime
          </div>

          <h1 className="mt-2 text-4xl font-black text-white">
            Industrial Workflow Automation
          </h1>

          <div className="mt-2 text-sm text-zinc-500">
            Operational orchestration & automation runtime
          </div>
        </div>

        <WorkflowTopology />

        <div className="grid grid-cols-2 gap-6">
          <TriggerRuntimePanel />

          <AutomationRuntimePanel />
        </div>

        <ExecutionTimeline />
      </div>
    </OperationalShell>
  )
}
