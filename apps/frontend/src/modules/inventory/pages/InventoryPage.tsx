import {
  InventoryKpiStrip,
} from '../components/InventoryKpiStrip'

import {
  InventoryTable,
} from '../components/InventoryTable'

export function InventoryPage() {

  return (

    <div className="min-h-screen bg-black p-8 text-white">

      <div className="mb-8 flex items-center justify-between">

        <div>

          <h1 className="text-4xl font-black text-cyan-400">
            Kho Vật Tư
          </h1>

          <div className="mt-2 text-zinc-500">
            Enterprise Inventory Runtime
          </div>

        </div>

        <div className="flex gap-3">

          <button className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-5 py-3 text-sm font-bold text-cyan-300">
            Nhập Kho
          </button>

          <button className="rounded-xl border border-zinc-700 bg-zinc-900 px-5 py-3 text-sm font-bold text-white">
            Xuất Kho
          </button>

        </div>

      </div>

      <div className="space-y-8">

        <InventoryKpiStrip />

        <InventoryTable />

      </div>

    </div>
  )
}
