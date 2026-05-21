interface KpiCardProps {
  title: string
  value: string
}

export function KpiCard({
  title,
  value,
}: KpiCardProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
      <p className="text-zinc-400 text-sm">
        {title}
      </p>

      <h2 className="text-3xl font-bold mt-2 text-white">
        {value}
      </h2>
    </div>
  )
}
