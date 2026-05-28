type Props = {
  slot: any
}

export function SlotRenderer2D({
  slot,
}: Props) {
  return (
    <div
      className={`relative h-24 rounded-xl border transition hover:scale-105 ${
        slot.occupancy > 80
          ? 'border-red-500 bg-red-500/20'
          : slot.occupancy > 50
          ? 'border-orange-500 bg-orange-500/20'
          : slot.occupancy > 20
          ? 'border-cyan-500 bg-cyan-500/20'
          : 'border-zinc-700 bg-zinc-900'
      }`}
    >

      <div className="flex items-center justify-between p-2">

        <span className="font-bold text-white">
          {slot.id}
        </span>

        <span className="rounded-full bg-zinc-800 px-2 py-1 text-[10px] text-zinc-300">
          T{slot.level}
        </span>

      </div>

      <div className="px-2">

        <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-800">

          <div
            className={`h-full ${
              slot.occupancy > 80
                ? 'bg-red-400'
                : slot.occupancy > 50
                ? 'bg-orange-400'
                : 'bg-cyan-400'
            }`}
            style={{
              width: `${slot.occupancy}%`,
            }}
          />

        </div>

        <div className="mt-3 text-xs text-zinc-300">
          {slot.material}
        </div>

        <div className="mt-1 text-[10px] text-zinc-500">
          {slot.quantity} items
        </div>

      </div>

      {/* STACK LEVELS */}
      <div className="absolute bottom-2 right-2 flex gap-1">

        {[1,2,3,4,5].map((lv) => (
          <div
            key={lv}
            className={`h-2 w-4 rounded-full ${
              lv <= slot.level
                ? 'bg-blue-400'
                : 'bg-zinc-700'
            }`}
          />
        ))}

      </div>

    </div>
  )
}
