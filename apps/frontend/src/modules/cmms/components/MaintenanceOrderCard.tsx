type Props = {
  order: any
}

export function MaintenanceOrderCard({
  order,
}: Props) {
  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">

      <div className="flex items-center justify-between">

        <div>

          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Work Order
          </p>

          <h2 className="mt-2 text-2xl font-bold text-white">
            {order.workOrderCode}
          </h2>

        </div>

        <div
          className={`rounded-full px-4 py-2 text-xs font-medium ${
            order.priority === 'high'
              ? 'bg-red-500/20 text-red-400'
              : 'bg-orange-500/20 text-orange-400'
          }`}
        >
          {order.priority}
        </div>

      </div>

      <div className="mt-6 space-y-4">

        <div className="rounded-2xl bg-zinc-950 p-4">

          <p className="text-xs text-zinc-500">
            Machine
          </p>

          <h3 className="mt-2 text-lg font-semibold text-white">
            {order.machineCode}
          </h3>

        </div>

        <div className="rounded-2xl bg-zinc-950 p-4">

          <p className="text-xs text-zinc-500">
            Issue
          </p>

          <h3 className="mt-2 text-sm font-medium text-zinc-300">
            {order.issueDescription}
          </h3>

        </div>

      </div>

    </div>
  )
}
