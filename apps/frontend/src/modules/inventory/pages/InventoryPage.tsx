import {
  KpiCard,
} from '../../../shared/ui/enterprise/KpiCard'

import {
  RuntimePanel,
} from '../../../shared/ui/enterprise/RuntimePanel'

import {
  SectionHeader,
} from '../../../shared/ui/enterprise/SectionHeader'

export function InventoryPage() {

  return (

    <div className="space-y-8 p-8">

      <SectionHeader
        title="Inventory Runtime"
        description="Realtime warehouse management, stock analytics, material flow and logistics telemetry."
      />

      <div className="grid gap-6 xl:grid-cols-4">

        <KpiCard
          title="Total Materials"
          value="12,450"
          trend="+4.2%"
        />

        <KpiCard
          title="Inbound Today"
          value="248"
          trend="+12%"
        />

        <KpiCard
          title="Outbound Today"
          value="173"
          trend="+7%"
        />

        <KpiCard
          title="Warehouse Usage"
          value="84%"
          trend="+2%"
        />

      </div>

      <div className="grid gap-6 xl:grid-cols-3">

        <RuntimePanel
          title="Material Flow"
          className="xl:col-span-2"
        >

          <div className="h-[420px] rounded-2xl bg-black" />

        </RuntimePanel>

        <RuntimePanel
          title="Realtime Alerts"
        >

          <div className="space-y-4">

            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
              Rack B12 overload detected
            </div>

            <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4 text-sm text-yellow-300">
              Material aging threshold warning
            </div>

            <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4 text-sm text-cyan-300">
              Dock telemetry synchronized
            </div>

          </div>

        </RuntimePanel>

      </div>

    </div>
  )
}
