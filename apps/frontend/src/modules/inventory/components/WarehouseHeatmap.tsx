const slots = Array.from({
  length: 48,
}).map((_, index) => {
  const value =
    Math.floor(
      Math.random() * 100,
    )

  return {
    id: index,
    value,
  }
})

function getColor(value: number) {
  if (value >= 80) {
    return 'bg-red-500'
  }

  if (value >= 60) {
    return 'bg-orange-500'
  }

  if (value >= 40) {
    return 'bg-emerald-500'
  }

  return 'bg-cyan-500'
}

export function WarehouseHeatmap() {
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
        <div className="text-xs uppercase tracking-[0.2em] text-cyan-400">
          Warehouse Heatmap
        </div>

        <div className="mt-1 text-sm text-zinc-500">
          Real-time slot occupancy visualization
        </div>
      </div>

      <div className="mt-6 grid grid-cols-8 gap-3">
        {slots.map((slot) => (
          <div
            key={slot.id}
            className={`
              flex
              aspect-square
              items-center
              justify-center
              rounded-xl
              text-xs
              font-bold
              text-white
              ${getColor(slot.value)}
            `}
          >
            {slot.value}%
          </div>
        ))}
      </div>
    </div>
  )
}
