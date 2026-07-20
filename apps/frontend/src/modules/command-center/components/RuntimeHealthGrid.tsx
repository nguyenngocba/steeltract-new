const services = [
  {
    service: 'Kho vật tư',
    health: 'ONLINE',
  },

  {
    service: 'Sản xuất',
    health: 'ONLINE',
  },

  {
    service: 'QC',
    health: 'WARNING',
  },

  {
    service: 'Analytics Engine',
    health: 'ONLINE',
  },

  {
    service: 'Kênh sự kiện',
    health: 'ONLINE',
  },

  {
    service: 'Điều xe',
    health: 'ONLINE',
  },
]

function getColor(status: string) {
  switch (status) {
    case 'ONLINE':
      return 'bg-emerald-500'

    case 'WARNING':
      return 'bg-orange-500'

    default:
      return 'bg-red-500'
  }
}

export function RuntimeHealthGrid() {
  return (
    <div className="grid grid-cols-3 gap-4">
      {services.map((service) => (
        <div
          key={service.service}
          className="
            rounded-2xl
            border
            border-zinc-800
            bg-zinc-900
            p-5
          "
        >
          <div className="text-sm text-zinc-500">
            {service.service}
          </div>

          <div className="mt-4 flex items-center gap-3">
            <div
              className={`
                h-3
                w-3
                rounded-full
                ${getColor(service.health)}
              `}
            />

            <div className="text-lg font-bold text-white">
              {service.health}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
