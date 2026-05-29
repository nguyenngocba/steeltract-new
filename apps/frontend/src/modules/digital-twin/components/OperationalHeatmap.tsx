const rows = 8
const cols = 24

const cells = Array.from({
  length: rows * cols,
}).map(() => {
  const value =
    Math.floor(
      Math.random() * 100,
    )

  return value
})

function getColor(value: number) {
  if (value > 80) {
    return 'bg-red-500'
  }

  if (value > 50) {
    return 'bg-orange-500'
  }

  if (value > 25) {
    return 'bg-cyan-500'
  }

  return 'bg-zinc-800'
}

export function OperationalHeatmap() {
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
        <div className="text-xs uppercase tracking-[0.2em] text-indigo-400">
          Operational Heatmap
        </div>

        <div className="mt-1 text-sm text-zinc-500">
          Runtime operational intensity
        </div>
      </div>

      <div
        className="
          mt-8
          grid
          grid-cols-24
          gap-1
        "
      >
        {cells.map((value, index) => (
          <div
            key={index}
            className={`
              aspect-square
              rounded
              ${getColor(value)}
            `}
          />
        ))}
      </div>
    </div>
  )
}
