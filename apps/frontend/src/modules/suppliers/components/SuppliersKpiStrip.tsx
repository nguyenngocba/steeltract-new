const metrics = [

  {
    label: 'Tổng NCC',
    value: '84',
    color: 'text-cyan-400',
  },

  {
    label: 'Đang Hoạt Động',
    value: '71',
    color: 'text-emerald-400',
  },

  {
    label: 'Pending',
    value: '8',
    color: 'text-yellow-400',
  },

  {
    label: 'Blocked',
    value: '5',
    color: 'text-red-400',
  },
]

export function SuppliersKpiStrip() {

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
