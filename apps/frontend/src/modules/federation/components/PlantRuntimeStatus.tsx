const plants = [
  {
    plant: 'HCM Plant',
    status: 'ONLINE',
  },

  {
    plant: 'Binh Duong Plant',
    status: 'ONLINE',
  },

  {
    plant: 'Vung Tau Plant',
    status: 'WARNING',
  },

  {
    plant: 'Warehouse Hub',
    status: 'ONLINE',
  },
]

function getColor(status: string) {
  return status === 'ONLINE'
    ? 'bg-emerald-500'
    : 'bg-orange-500'
}

export function PlantRuntimeStatus() {
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
          Plant Runtime Status
        </div>

        <div className="mt-1 text-sm text-zinc-500">
          Distributed operational health
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {plants.map((plant) => (
          <div
            key={plant.plant}
            className="
              flex
              items-center
              justify-between
              rounded-xl
              border
              border-zinc-800
              bg-zinc-950
              p-4
            "
          >
            <div className="text-sm text-white">
              {plant.plant}
            </div>

            <div
              className={`
                rounded-full
                px-3
                py-1
                text-xs
                text-white
                ${getColor(plant.status)}
              `}
            >
              {plant.status}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
