const plants = [
  'HCM Plant',
  'Binh Duong Plant',
  'Vung Tau Plant',
  'Warehouse Hub',
  'Yard Operations',
]

export function FederationTopology() {
  return (
    <div
      className="
        rounded-2xl
        border
        border-sky-500/20
        bg-zinc-900
        p-6
      "
    >
      <div>
        <div className="text-xs uppercase tracking-[0.2em] text-sky-400">
          Federation Topology
        </div>

        <div className="mt-1 text-sm text-zinc-500">
          Distributed industrial runtime federation
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-4">
        {plants.map((plant, index) => (
          <div
            key={plant}
            className="flex items-center gap-4"
          >
            <div
              className="
                rounded-2xl
                border
                border-zinc-800
                bg-zinc-950
                px-5
                py-4
                text-sm
                font-bold
                text-white
              "
            >
              {plant}
            </div>

            {index !== plants.length - 1 && (
              <div className="text-sky-400">
                ⇄
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
