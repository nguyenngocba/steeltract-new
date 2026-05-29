import { OperationalShell } from '@/shared/layouts/OperationalShell'

import { KernelRuntimeGrid } from '../components/KernelRuntimeGrid'
import { SchedulerRuntimePanel } from '../components/SchedulerRuntimePanel'
import { ServiceRegistryPanel } from '../components/ServiceRegistryPanel'

export function KernelPage() {
  return (
    <OperationalShell>
      <div className="space-y-6 p-6">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-emerald-400">
            Industrial OS Kernel
          </div>

          <h1 className="mt-2 text-4xl font-black text-white">
            Runtime Kernel Engine
          </h1>

          <div className="mt-2 text-sm text-zinc-500">
            Industrial runtime orchestration & service mesh
          </div>
        </div>

        <KernelRuntimeGrid />

        <div className="grid grid-cols-2 gap-6">
          <ServiceRegistryPanel />

          <SchedulerRuntimePanel />
        </div>
      </div>
    </OperationalShell>
  )
}
