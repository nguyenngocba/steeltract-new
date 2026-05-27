export function HeatmapChart() {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">

      <div className="mb-4 flex items-center justify-between">

        <h3 className="text-lg font-semibold text-white">
          Occupancy Heatmap
        </h3>

        <div className="flex gap-2 text-xs">

          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded bg-cyan-400" />
            <span className="text-zinc-400">
              Low
            </span>
          </div>

          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded bg-orange-400" />
            <span className="text-zinc-400">
              Medium
            </span>
          </div>

          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded bg-red-400" />
            <span className="text-zinc-400">
              High
            </span>
          </div>

        </div>

      </div>

      <div className="grid grid-cols-10 gap-1">

        {[...Array(100)].map((_, i) => (
          <div
            key={i}
            className={`h-8 rounded ${
              i % 3 === 0
                ? 'bg-red-500'
                : i % 2 === 0
                ? 'bg-orange-500'
                : 'bg-cyan-500'
            }`}
          />
        ))}

      </div>

    </div>
  )
}
