type SuppliersKpiStripProps = {
  total: number
  withEmail: number
  withPhone: number
  newlyAdded: number
}

export function SuppliersKpiStrip({
  total,
  withEmail,
  withPhone,
  newlyAdded,
}: SuppliersKpiStripProps) {
  const metrics = [
    {
      label: 'Tổng NCC',
      value: total.toLocaleString(),
      color: 'text-cyan-400',
    },
    {
      label: 'Có email',
      value: withEmail.toLocaleString(),
      color: 'text-emerald-400',
    },
    {
      label: 'Có điện thoại',
      value: withPhone.toLocaleString(),
      color: 'text-blue-400',
    },
    {
      label: 'Mới 30 ngày',
      value: newlyAdded.toLocaleString(),
      color: 'text-amber-400',
    },
  ]

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
