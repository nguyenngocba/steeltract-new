const metrics = [

  {
    label: 'Tổng Vật Tư',
    value: '12,480',
    color: 'text-cyan-400',
  },

  {
    label: 'Sắp Hết',
    value: '24',
    color: 'text-yellow-400',
  },

  {
    label: 'Chờ Nhập',
    value: '18',
    color: 'text-orange-400',
  },

  {
    label: 'Lỗi / Hold',
    value: '6',
    color: 'text-red-400',
  },
]

export function InventoryKpiStrip() {

  return (

    <div className="grid grid-cols-4 gap-5">

      {metrics.map((item) => (

        <div
          key={item.label}
          className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5"
        >

          <div className="text-sm text-zinc-500">
            {item.label}
          </div>

          <div className={`mt-3 text-4xl font-black ${item.color}`}>
            {item.value}
          </div>

        </div>

      ))}

    </div>
  )
}
