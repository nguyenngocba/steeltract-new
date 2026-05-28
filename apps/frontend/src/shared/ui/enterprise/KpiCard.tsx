type Props = {

  title: string

  value: string

  trend?: string
}

export function KpiCard({
  title,
  value,
  trend,
}: Props) {

  return (

    <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">

      <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">
        {title}
      </div>

      <div className="mt-5 text-4xl font-black text-white">
        {value}
      </div>

      {trend && (

        <div className="mt-4 text-sm text-emerald-400">
          {trend}
        </div>

      )}

    </div>
  )
}
