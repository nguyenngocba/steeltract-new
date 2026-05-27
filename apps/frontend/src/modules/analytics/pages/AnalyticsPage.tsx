import { InventoryTrendChart } from '../charts/InventoryTrendChart'
import { ProductionChart } from '../charts/ProductionChart'
import { YardOccupancyChart } from '../charts/YardOccupancyChart'

import { ExecutiveKpiWidget } from '../widgets/ExecutiveKpiWidget'

import { exportPdfReport } from '../reports/export-report'

export function AnalyticsPage() {
  return (
    <div className="flex h-full flex-col overflow-auto bg-zinc-950 p-6">

      {/* HEADER */}
      <div className="mb-6 flex items-center justify-between">

        <div>

          <h1 className="text-3xl font-bold text-white">
            Executive Analytics
          </h1>

          <p className="mt-1 text-sm text-zinc-500">
            Smart Factory Intelligence Center
          </p>

        </div>

        <div className="flex gap-3">

          <button
            onClick={exportPdfReport}
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white"
          >
            Export PDF
          </button>

          <button className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-medium text-white">
            Export Excel
          </button>

        </div>

      </div>

      {/* KPI */}
      <div className="grid grid-cols-4 gap-4">

        <ExecutiveKpiWidget
          label="Factory Revenue"
          value="28.4B"
          color="#38bdf8"
        />

        <ExecutiveKpiWidget
          label="Production Output"
          value="1,280"
          color="#22c55e"
        />

        <ExecutiveKpiWidget
          label="Yard Occupancy"
          value="68%"
          color="#f97316"
        />

        <ExecutiveKpiWidget
          label="Realtime Events"
          value="284"
          color="#ef4444"
        />

      </div>

      {/* CHARTS */}
      <div className="mt-6 grid grid-cols-2 gap-6">

        <InventoryTrendChart />

        <ProductionChart />

      </div>

      <div className="mt-6">

        <YardOccupancyChart />

      </div>

    </div>
  )
}
