import { LineChart } from '../../../shared/chart-runtime/line/LineChart'
import { RealtimeFeed } from '../../../shared/activity-runtime/feeds/RealtimeFeed'

export function DashboardWorkspace() {
  return (
    <div className="flex h-full flex-col overflow-auto bg-zinc-950 p-6">

      {/* HEADER */}
      <div className="mb-6">

        <h1 className="text-3xl font-bold text-white">
          Operational Dashboard
        </h1>

        <p className="mt-1 text-sm text-zinc-500">
          Smart Factory Command Center
        </p>

      </div>

      {/* KPI */}
      <div className="grid grid-cols-4 gap-4">

        {[
          {
            label: 'Inventory',
            value: '14,280',
          },
          {
            label: 'Yard Occupancy',
            value: '68%',
          },
          {
            label: 'Production',
            value: '1,280',
          },
          {
            label: 'Realtime Events',
            value: '284',
          },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"
          >

            <p className="text-xs uppercase tracking-wide text-zinc-500">
              {item.label}
            </p>

            <h2 className="mt-4 text-4xl font-bold text-white">
              {item.value}
            </h2>

          </div>
        ))}

      </div>

      {/* CONTENT */}
      <div className="mt-6 grid grid-cols-2 gap-6">

        <LineChart />

        <RealtimeFeed />

      </div>

    </div>
  )
}
