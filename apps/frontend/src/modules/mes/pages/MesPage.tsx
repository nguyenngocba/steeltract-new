import { useWorkOrders } from '../hooks/useWorkOrders'

import { WorkOrderCard } from '../components/WorkOrderCard'

export function MesPage() {
  const {
    data,
  } = useWorkOrders()

  return (
    <div className="flex h-full flex-col overflow-auto bg-zinc-950 p-6">

      {/* HEADER */}
      <div className="mb-6 flex items-center justify-between">

        <div>

          <h1 className="text-3xl font-bold text-white">
            MES Runtime
          </h1>

          <p className="mt-1 text-sm text-zinc-500">
            Manufacturing Execution System
          </p>

        </div>

        <div className="flex gap-3">

          <button className="rounded-xl bg-cyan-600 px-5 py-3 text-sm font-medium text-white">
            Create Work Order
          </button>

          <button className="rounded-xl bg-orange-600 px-5 py-3 text-sm font-medium text-white">
            Scheduling
          </button>

        </div>

      </div>

      {/* KPI */}
      <div className="mb-6 grid grid-cols-4 gap-4">

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">

          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Active Orders
          </p>

          <h2 className="mt-4 text-5xl font-bold text-cyan-400">
            28
          </h2>

        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">

          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Running Machines
          </p>

          <h2 className="mt-4 text-5xl font-bold text-emerald-400">
            14
          </h2>

        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">

          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Delayed Tasks
          </p>

          <h2 className="mt-4 text-5xl font-bold text-red-400">
            3
          </h2>

        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">

          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Efficiency
          </p>

          <h2 className="mt-4 text-5xl font-bold text-orange-400">
            87%
          </h2>

        </div>

      </div>

      {/* WORK ORDERS */}
      <div className="grid grid-cols-2 gap-6">

        {data?.map((order: any) => (
          <WorkOrderCard
            key={order.id}
            order={order}
          />
        ))}

      </div>

    </div>
  )
}
