import {
  RuntimeLineChart,
} from '../../../shared/runtime/RuntimeLineChart'

import {
  InventoryAnalyticsChart,
} from '../../../shared/runtime/InventoryAnalyticsChart'

export function AnalyticsDashboardPage() {

  return (
    <div className="space-y-6 bg-black p-6">

      {/* HEADER */}
      <div className="flex items-center justify-between">

        <div>

          <div className="text-sm uppercase tracking-[0.35em] text-cyan-500">
            Enterprise Analytics
          </div>

          <h1 className="mt-3 text-5xl font-black text-white">
            ANALYTICS RUNTIME
          </h1>

        </div>

        <div className="rounded-3xl border border-violet-500/20 bg-violet-500/10 px-6 py-5">

          <div className="text-xs uppercase tracking-[0.3em] text-violet-400">
            AI Analytics
          </div>

          <div className="mt-2 text-2xl font-black text-violet-400">
            ACTIVE
          </div>

        </div>

      </div>

      {/* KPI */}
      <div className="grid grid-cols-4 gap-6">

        {[
          {
            title: 'Efficiency',
            value: '93%',
            color: 'text-cyan-400',
          },

          {
            title: 'Forecast',
            value: '89%',
            color: 'text-violet-400',
          },

          {
            title: 'Inventory',
            value: '24K',
            color: 'text-orange-400',
          },

          {
            title: 'Realtime',
            value: 'LIVE',
            color: 'text-emerald-400',
          },
        ].map((item) => (

          <div
            key={item.title}
            className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6"
          >

            <div className="text-sm text-zinc-500">
              {item.title}
            </div>

            <div className={`mt-4 text-5xl font-black ${item.color}`}>

              {item.value}

            </div>

          </div>

        ))}

      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-2 gap-6">

        <RuntimeLineChart />

        <InventoryAnalyticsChart />

      </div>

    </div>
  )
}
