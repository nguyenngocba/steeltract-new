import { useInventoryItems } from '../hooks/useInventoryItems'

export function LowStockAlertPanel() {
  const {
    data,
  } = useInventoryItems()

  const lowStock =
    data?.filter(
      (item: any) =>
        item.quantity <= 25,
    ) ?? []

  return (
    <div
      className="
        rounded-2xl
        border
        border-red-500/20
        bg-red-500/5
        p-6
      "
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-red-400">
            Alert Runtime
          </div>

          <div className="mt-1 text-sm text-zinc-400">
            Low stock operational alerts
          </div>
        </div>

        <div
          className="
            rounded-full
            bg-red-500/10
            px-3
            py-1
            text-xs
            text-red-400
          "
        >
          {lowStock.length} Alerts
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {lowStock.map((item: any) => (
          <div
            key={item.id}
            className="
              rounded-xl
              border
              border-red-500/20
              bg-zinc-950
              p-4
            "
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-white">
                  {item.name}
                </div>

                <div className="mt-1 text-xs text-zinc-500">
                  {item.code}
                </div>
              </div>

              <div className="text-sm font-bold text-red-400">
                {item.quantity}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
