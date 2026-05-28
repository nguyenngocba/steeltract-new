const metrics = [

  {
    label: 'Tổng Công Trình',
    value: '24',
    color: 'text-cyan-400',
  },

  {
    label: 'Đang Thi Công',
    value: '12',
    color: 'text-emerald-400',
  },

  {
    label: 'Trễ Tiến Độ',
    value: '2',
    color: 'text-red-400',
  },

  {
    label: 'Hoàn Thành',
    value: '10',
    color: 'text-yellow-400',
  },
]

export function ProjectsKpiStrip() {

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
