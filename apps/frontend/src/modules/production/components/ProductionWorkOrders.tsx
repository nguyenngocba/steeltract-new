const orders = [
  {
    id: 'WO-2026-001',
    component: 'Steel Column C1',
    progress: 82,
  },

  {
    id: 'WO-2026-002',
    component: 'Beam H400',
    progress: 46,
  },

  {
    id: 'WO-2026-003',
    component: 'Plate Assembly',
    progress: 12,
  },
]

export function ProductionWorkOrders() {
  return (
    <div
      className="
        rounded-2xl
        border
        border-zinc-800
        bg-zinc-900
        p-6
      "
    >
      <div>
        <div className="text-xs uppercase tracking-[0.2em] text-orange-400">
          Work Orders
        </div>

        <div className="mt-1 text-sm text-zinc-500">
          Active production orders
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {orders.map((order) => (
          <div
            key={order.id}
            className="
              rounded-xl
              border
              border-zinc-800
              bg-zinc-950
              p-4
            "
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-white">
                  {order.id}
                </div>

                <div className="mt-1 text-sm text-zinc-500">
                  {order.component}
                </div>
              </div>

              <div className="text-sm text-orange-400">
                {order.progress}%
              </div>
            </div>

            <div className="mt-4 h-3 overflow-hidden rounded-full bg-zinc-800">
              <div
                style={{
                  width: `${order.progress}%`,
                }}
                className="
                  h-full
                  rounded-full
                  bg-orange-500
                "
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
