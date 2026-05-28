type Props = {
  title: string
  value: string
  subtitle?: string
}

export function StatCard({
  title,
  value,
  subtitle,
}: Props) {

  return (

    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">

      <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">
        {title}
      </div>

      <div className="mt-3 text-3xl font-black text-white">
        {value}
      </div>

      {subtitle && (
        <div className="mt-2 text-sm text-zinc-400">
          {subtitle}
        </div>
      )}

    </div>
  )
}
