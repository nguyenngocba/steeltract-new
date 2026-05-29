const items = [
  'Inventory Feed',
  'Production Queue',
  'QC Alerts',
  'Realtime Events',
]

export function RuntimeDock() {
  return (
    <div className="flex h-full gap-3 overflow-x-auto bg-zinc-950 p-4">
      {items.map((item) => (
        <div
          key={item}
          className="
            min-w-[240px]
            rounded-2xl
            border
            border-zinc-800
            bg-zinc-900
            p-4
          "
        >
          <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">
            Runtime
          </div>

          <div className="mt-3 text-sm font-medium text-white">
            {item}
          </div>
        </div>
      ))}
    </div>
  )
}
