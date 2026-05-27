export function RealtimeTransactions() {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">

      <div className="mb-4 flex items-center justify-between">

        <h3 className="text-lg font-semibold text-white">
          Giao dịch realtime
        </h3>

        <div className="flex items-center gap-2">

          <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />

          <span className="text-xs text-zinc-400">
            LIVE
          </span>

        </div>

      </div>

      <div className="space-y-3">

        {[1,2,3,4,5].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950 p-3"
          >

            <div>

              <p className="text-sm font-medium text-white">
                Xuất kho Beam H400
              </p>

              <p className="mt-1 text-xs text-zinc-500">
                Kho A → Xưởng gia công
              </p>

            </div>

            <span className="text-xs text-cyan-400">
              2s ago
            </span>

          </div>
        ))}

      </div>

    </div>
  )
}
