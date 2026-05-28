const slots = Array.from(
  {
    length: 24,
  },
  (_, index) => ({

    id: index + 1,

    occupied:
      Math.random() > 0.5,
  }),
)

export function YardGrid() {

  return (

    <div className="grid grid-cols-6 gap-4">

      {slots.map((slot) => (

        <div
          key={slot.id}
          className={`flex aspect-square items-center justify-center rounded-2xl border text-sm font-bold ${
            slot.occupied

              ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300'

              : 'border-zinc-800 bg-zinc-950 text-zinc-600'
          }`}
        >

          A-{slot.id}

        </div>

      ))}

    </div>
  )
}
