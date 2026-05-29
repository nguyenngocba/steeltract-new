const lakes = [
  'Inventory Events',
  'Production Telemetry',
  'QC Runtime Streams',
  'Workflow Events',
  'AI Runtime Logs',
]

export function DataLakePanel() {
  return (
    <div
      className="
        rounded-2xl
        border
        border-rose-500/20
        bg-zinc-900
        p-6
      "
    >
      <div>
        <div className="text-xs uppercase tracking-[0.2em] text-rose-400">
          Data Lake Storage
        </div>

        <div className="mt-1 text-sm text-zinc-500">
          Industrial telemetry persistence runtime
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {lakes.map((lake) => (
          <div
            key={lake}
            className="
              rounded-xl
              border
              border-zinc-800
              bg-zinc-950
              p-4
              text-sm
              text-white
            "
          >
            {lake}
          </div>
        ))}
      </div>
    </div>
  )
}
