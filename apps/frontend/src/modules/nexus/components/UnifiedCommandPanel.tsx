const commands = [
  'Optimize enterprise logistics',
  'Rebalance production federation',
  'Predict procurement risks',
  'Analyze global telemetry anomalies',
  'Simulate autonomous dispatch workflows',
]

export function UnifiedCommandPanel() {
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
        <div className="text-xs uppercase tracking-[0.2em] text-pink-400">
          Unified Command Runtime
        </div>

        <div className="mt-1 text-sm text-zinc-500">
          Industrial command cognition layer
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {commands.map((command) => (
          <button
            key={command}
            className="
              flex
              w-full
              items-center
              justify-between
              rounded-xl
              border
              border-zinc-800
              bg-zinc-950
              p-4
              text-left
              transition-all
              hover:border-pink-500
            "
          >
            <div className="text-sm text-white">
              {command}
            </div>

            <div className="text-pink-400">
              →
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
