import {
  SectionHeader,
} from '../../../shared/ui/enterprise/SectionHeader'

import {
  RuntimePanel,
} from '../../../shared/ui/enterprise/RuntimePanel'

import {
  KpiCard,
} from '../../../shared/ui/enterprise/KpiCard'

export function YardOverviewPage() {

  return (

    <div className="space-y-8 p-8">

      <SectionHeader
        title="Yard Runtime"
        description="Realtime steel yard operations, truck flow, crane telemetry and spatial analytics."
      />

      <div className="grid gap-6 xl:grid-cols-4">

        <KpiCard
          title="Yard Occupancy"
          value="81%"
          trend="+3%"
        />

        <KpiCard
          title="Inbound Trucks"
          value="48"
          trend="+9%"
        />

        <KpiCard
          title="Outbound Trucks"
          value="35"
          trend="+4%"
        />

        <KpiCard
          title="Cranes Active"
          value="6"
          trend="Realtime"
        />

      </div>

      <div className="grid gap-6 xl:grid-cols-3">

        <RuntimePanel
          title="Yard Heatmap"
          className="xl:col-span-2"
        >

          <div className="h-[500px] rounded-2xl bg-black" />

        </RuntimePanel>

        <RuntimePanel
          title="Live Yard Events"
        >

          <div className="space-y-4">

            <div className="rounded-2xl border border-zinc-800 bg-black p-4 text-sm text-zinc-300">
              Truck #TR-102 entered Gate A
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-black p-4 text-sm text-zinc-300">
              Crane C-03 assigned to Zone B
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-black p-4 text-sm text-zinc-300">
              Shipment batch synchronized
            </div>

          </div>

        </RuntimePanel>

      </div>

    </div>
  )
}
