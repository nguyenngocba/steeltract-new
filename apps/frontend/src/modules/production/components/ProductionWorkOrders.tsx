import { useProductionOrders } from '../hooks/useProductionCockpit'

function orderProgress(status: string) {
  switch (status) {
    case 'COMPLETED':
      return 100
    case 'IN_PROGRESS':
      return 55
    case 'DELAYED':
      return 35
    case 'PLANNED':
      return 10
    default:
      return 0
  }
}

export function ProductionWorkOrders() {
  const { data: orders = [] } =
    useProductionOrders()
  const visibleOrders =
    orders.slice(0, 6)

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
        {visibleOrders.map((order) => (
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
                  {order.orderNo}
                </div>

                <div className="mt-1 text-sm text-zinc-500">
                  {order.component?.code ?? order.title}
                </div>
              </div>

              <div className="text-sm text-orange-400">
                {orderProgress(order.status)}%
              </div>
            </div>

            <div className="mt-4 h-3 overflow-hidden rounded-full bg-zinc-800">
              <div
                style={{
                  width: `${orderProgress(order.status)}%`,
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
