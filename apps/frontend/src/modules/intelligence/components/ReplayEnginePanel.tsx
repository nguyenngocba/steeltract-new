const replays = [
  {
    runtime: 'Inventory Runtime',
    replay: '12h replay available',
  },

  {
    runtime: 'Production Runtime',
    replay: '24h replay available',
  },

  {
    runtime: 'QC Runtime',
    replay: '8h replay available',
  },

  {
    runtime: 'Dispatch Runtime',
    replay: '48h replay available',
  },
]

export function ReplayEnginePanel() {
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
        <div className="text-xs uppercase tracking-[0.2em] text-rose-400">
          Historical Replay Engine
        </div>

        <div className="mt-1 text-sm text-zinc-500">
          Operational event replay & telemetry reconstruction
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        {replays.map((replay) => (
          <div
            key={replay.runtime}
            className="
              rounded-xl
              border
              border-zinc-800
              bg-zinc-950
              p-4
            "
          >
            <div className="text-sm font-bold text-white">
              {replay.runtime}
            </div>

            <div className="mt-2 text-sm text-zinc-500">
              {replay.replay}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
