const operations = [
  {
    metric: 'Global Inventory',
    value: '42,882',
  },

  {
    metric: 'Production Runtime',
    value: '94%',
  },

  {
    metric: 'Cross-Site Dispatch',
    value: '182',
  },

  {
    metric: 'Realtime Federation',
    value: 'ACTIVE',
  },
]

export function GlobalOperationsGrid() {
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
        <div className="text-xs uppercase tracking-[0.2em] text-sky-400">
          Global Operations
        </div>

        <div className="mt-1 text-sm text-zinc-500">
          Enterprise operational federation
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        {operations.map((operation) => (
          <div
            key={operation.metric}
            className="
              rounded-xl
              border
              border-zinc-800
              bg-zinc-950
              p-4
            "
          >
            <div className="text-sm text-zinc-500">
              {operation.metric}
            </div>

            <div className="mt-2 text-2xl font-black text-white">
              {operation.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
