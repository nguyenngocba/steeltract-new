import { yardSlots } from '../../mock-data/yard-slots'
import { SlotRenderer2D } from '../../digital-renderers/2d/SlotRenderer2D'

export function Yard2DMap() {
  return (
    <div className="h-full overflow-auto rounded-2xl border border-zinc-800 bg-zinc-950 p-4">

      <div className="mb-6 flex items-center justify-between">

        <div>

          <h2 className="text-2xl font-bold text-white">
            Yard 2D Digital Twin
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            Smart factory yard visualization
          </p>

        </div>

        <div className="flex gap-2">

          <button className="rounded-xl bg-zinc-800 px-4 py-2 text-sm text-white">
            Heatmap
          </button>

          <button className="rounded-xl bg-zinc-800 px-4 py-2 text-sm text-white">
            Occupancy
          </button>

          <button className="rounded-xl bg-zinc-800 px-4 py-2 text-sm text-white">
            Fullscreen
          </button>

        </div>

      </div>

      <div className="grid grid-cols-5 gap-4">

        {yardSlots.map((slot) => (
          <SlotRenderer2D
            key={slot.id}
            slot={slot}
          />
        ))}

      </div>

    </div>
  )
}
