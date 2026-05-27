import { useMachines } from '../hooks/useMachines'
import { useMaintenanceOrders } from '../hooks/useMaintenanceOrders'

import { MachineCard } from '../components/MachineCard'
import { MaintenanceOrderCard } from '../components/MaintenanceOrderCard'

export function CmmsPage() {

  const {
    data: machines,
  } = useMachines()

  const {
    data: orders,
  } = useMaintenanceOrders()

  return (
    <div className="flex h-full flex-col overflow-auto bg-zinc-950 p-6">

      {/* HEADER */}
      <div className="mb-6 flex items-center justify-between">

        <div>

          <h1 className="text-3xl font-bold text-white">
            CMMS Runtime
          </h1>

          <p className="mt-1 text-sm text-zinc-500">
            Maintenance & Machine Service Management
          </p>

        </div>

        <div className="flex gap-3">

          <button className="rounded-xl bg-cyan-600 px-5 py-3 text-sm font-medium text-white">
            Create Maintenance
          </button>

          <button className="rounded-xl bg-orange-600 px-5 py-3 text-sm font-medium text-white">
            Maintenance Schedule
          </button>

        </div>

      </div>

      {/* KPI */}
      <div className="mb-6 grid grid-cols-4 gap-4">

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">

          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Machines
          </p>

          <h2 className="mt-4 text-5xl font-bold text-cyan-400">
            24
          </h2>

        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">

          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Active Maintenance
          </p>

          <h2 className="mt-4 text-5xl font-bold text-orange-400">
            6
          </h2>

        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">

          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Critical Machines
          </p>

          <h2 className="mt-4 text-5xl font-bold text-red-400">
            2
          </h2>

        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">

          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Avg Health
          </p>

          <h2 className="mt-4 text-5xl font-bold text-emerald-400">
            87%
          </h2>

        </div>

      </div>

      {/* CONTENT */}
      <div className="grid grid-cols-2 gap-6">

        {/* MACHINES */}
        <div>

          <div className="mb-4">

            <h2 className="text-2xl font-bold text-white">
              Machines
            </h2>

          </div>

          <div className="space-y-4">

            {machines?.map((machine: any) => (
              <MachineCard
                key={machine.id}
                machine={machine}
              />
            ))}

          </div>

        </div>

        {/* WORK ORDERS */}
        <div>

          <div className="mb-4">

            <h2 className="text-2xl font-bold text-white">
              Maintenance Orders
            </h2>

          </div>

          <div className="space-y-4">

            {orders?.map((order: any) => (
              <MaintenanceOrderCard
                key={order.id}
                order={order}
              />
            ))}

          </div>

        </div>

      </div>

    </div>
  )
}
