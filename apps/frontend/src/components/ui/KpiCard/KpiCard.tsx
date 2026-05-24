interface KpiCardProps {
  title: string
  value: string
  icon?: React.ReactNode
}

export function KpiCard({
  title,
  value,
  icon,
}: KpiCardProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-zinc-400 text-sm">
          {title}
        </p>

        {icon}
      </div>

      <h2 className="text-3xl font-bold mt-2 text-white">
        {value}
      </h2>
    </div>
  )
}
