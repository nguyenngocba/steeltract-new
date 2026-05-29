import { useState } from 'react'

import { OperationalShell } from '@/shared/layouts/OperationalShell'
import { WarehouseHeatmap } from '../components/WarehouseHeatmap'
import { WarehouseZonesPanel } from '../components/WarehouseZonesPanel'
import { InventoryKpiGrid } from '../components/InventoryKpiGrid'
import { InventoryTable } from '../components/InventoryTable'
import { InventoryTelemetry } from '../components/InventoryTelemetry'
import { InventoryTelemetryChart } from '../components/InventoryTelemetryChart'
import { InventoryToolbar } from '../components/InventoryToolbar'
import { LowStockAlertPanel } from '../components/LowStockAlertPanel'
import { NewTransactionModal } from '../components/NewTransactionModal'
import { RealtimeTransactionFeed } from '../components/RealtimeTransactionFeed'
import { RuntimeEventPanel } from '../components/RuntimeEventPanel'
import { useInventorySocket } from '../hooks/useInventorySocket'
export function InventoryPage() {
  const [warehouse, setWarehouse] =
    useState('ALL')
    useInventorySocket()

  const [open, setOpen] =
    useState(false)

  return (
    <OperationalShell>
      <NewTransactionModal
        open={open}
        onClose={() => setOpen(false)}
      />

      <div className="space-y-6 p-6">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-cyan-400">
            Inventory Runtime
          </div>

          <h1 className="mt-2 text-4xl font-black text-white">
            Warehouse Operations
          </h1>
        </div>

        <InventoryKpiGrid />

        <InventoryToolbar
          warehouse={warehouse}
          onWarehouseChange={setWarehouse}
        />

        <div className="flex justify-end">
          <button
            onClick={() => setOpen(true)}
            className="
              rounded-xl
              bg-cyan-500
              px-4
              py-3
              text-sm
              font-medium
              text-black
            "
          >
            Create Transaction
          </button>
        </div>

        <InventoryTelemetry />

        <div className="grid grid-cols-2 gap-6">
          <InventoryTelemetryChart />

          <LowStockAlertPanel />
        </div>
          <div className="grid grid-cols-2 gap-6">
            <WarehouseZonesPanel />

            <WarehouseHeatmap />
          </div>
        <RealtimeTransactionFeed />
          <RuntimeEventPanel />
        <InventoryTable />
      </div>
    </OperationalShell>
  )
}
