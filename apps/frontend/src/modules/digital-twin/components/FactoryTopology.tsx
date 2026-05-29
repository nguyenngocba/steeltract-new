const zones = [
  'Warehouse',
  'Production',
  'QC',
  'Yard',
  'Dispatch',
  'Projects',
]

export function FactoryTopology() {
  return (
    <div
      className="
        rounded-2xl
        border
        border-indigo-500/20
        bg-zinc-900
        p-6
      "
    >
      <div>
        <div className="text-xs uppercase tracking-[0.2em] text-indigo-400">
          Factory Topology
        </div>

        <div className="mt-1 text-sm text-zinc-500">
          Operational domain visualization
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4">
        {zones.map((zone) => (
          <div
            key={zone}
            className="
              flex
              h-32
              items-center
              justify-center
              rounded-2xl
              border
              border-zinc-800
              bg-zinc-950
              text-sm
              font-bold
              text-white
            "
          >
            {zone}
          </div>
        ))}
      </div>
    </div>
  )
}
