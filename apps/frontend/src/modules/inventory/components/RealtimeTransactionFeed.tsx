import { useInventoryTransactions } from '../hooks/useInventoryTransactions'

export function RealtimeTransactionFeed() {
  const {
    data,
    isLoading,
  } = useInventoryTransactions()

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
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-cyan-400">
            Realtime Feed
          </div>

          <div className="mt-1 text-sm text-zinc-500">
            Live inventory transaction events
          </div>
        </div>

        <div
          className="
            rounded-full
            bg-emerald-500/10
            px-3
            py-1
            text-xs
            text-emerald-400
          "
        >
          LIVE
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {isLoading && (
          <div className="text-sm text-zinc-500">
            Loading runtime events...
          </div>
        )}

        {data?.map((item: any) => (
          <div
            key={item.id}
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
                <div className="text-sm font-semibold text-cyan-400">
                  {item.type}
                </div>

                <div className="mt-1 text-sm text-white">
                  {item.remarks}
                </div>
              </div>

              <div className="text-xs text-zinc-500">
                {new Date(
                  item.createdAt,
                ).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
