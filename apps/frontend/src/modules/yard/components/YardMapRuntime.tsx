const slots = Array.from({
  length: 40,
}).map((_, index) => {
  const occupied =
    Math.random() > 0.35

  return {
    id: index + 1,
    occupied,
  }
})

export function YardMapRuntime() {
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
        <div className="text-xs uppercase tracking-[0.2em] text-amber-400">
          Yard Map Runtime
        </div>

        <div className="mt-1 text-sm text-zinc-500">
          Outdoor inventory allocation
        </div>
      </div>

      <div className="mt-6 grid grid-cols-5 gap-3">
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
              ${
                slot.occupied
                  ? 'bg-amber-500'
                  : 'bg-zinc-800'
              }
            `}
          >
            Y-{slot.id}
          </div>
        ))}
      </div>
    </div>
  )
}
