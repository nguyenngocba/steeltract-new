type Props = {
  order: any
}

export function WorkOrderCard({
  order,
}: Props) {
  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">

      <div className="flex items-start justify-between">

        <div>

          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Work Order
          </p>

          <h2 className="mt-2 text-2xl font-bold text-white">
            {order.orderCode}
          </h2>

        </div>

        <div
          className={`rounded-full px-4 py-2 text-xs font-medium ${
            order.status === 'running'
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'bg-orange-500/20 text-orange-400'
          }`}
        >
          {order.status}
        </div>

      </div>

      <div className="mt-6 space-y-4">

        <div className="rounded-2xl bg-zinc-950 p-4">

          <p className="text-xs text-zinc-500">
            Project
          </p>

          <h3 className="mt-2 text-lg font-semibold text-white">
            {order.projectName}
          </h3>

        </div>

        <div className="grid grid-cols-2 gap-4">

          <div className="rounded-2xl bg-zinc-950 p-4">

            <p className="text-xs text-zinc-500">
              Component
            </p>

            <h3 className="mt-2 text-xl font-bold text-cyan-400">
              {order.componentCode}
            </h3>

          </div>

          <div className="rounded-2xl bg-zinc-950 p-4">

            <p className="text-xs text-zinc-500">
              Quantity
            </p>

            <h3 className="mt-2 text-xl font-bold text-orange-400">
              {order.quantity}
            </h3>

          </div>

        </div>

        <div>

          <div className="mb-2 flex items-center justify-between">

            <span className="text-xs text-zinc-500">
              Progress
            </span>

            <span className="text-xs text-zinc-400">
              {order.progress}%
            </span>

          </div>

          <div className="h-3 overflow-hidden rounded-full bg-zinc-800">

            <div
              className="h-full bg-cyan-400"
              style={{
                width: `${order.progress}%`,
              }}
            />

          </div>

        </div>

      </div>

    </div>
  )
}
