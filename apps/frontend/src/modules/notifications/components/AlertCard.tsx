type Props = {
  alert: any
}

export function AlertCard({
  alert,
}: Props) {
  const colors = {
    warning:
      'border-orange-500/40 bg-orange-500/10 text-orange-400',

    danger:
      'border-red-500/40 bg-red-500/10 text-red-400',

    success:
      'border-emerald-500/40 bg-emerald-500/10 text-emerald-400',

    info:
      'border-cyan-500/40 bg-cyan-500/10 text-cyan-400',
  }

  return (
    <div
      className={`rounded-3xl border p-5 ${
        colors[
          alert.type as keyof typeof colors
        ]
      }`}
    >

      <div className="flex items-start justify-between">

        <div>

          <h3 className="text-lg font-bold">
            {alert.title}
          </h3>

          <p className="mt-2 text-sm opacity-80">
            {alert.description}
          </p>

        </div>

        <div className="rounded-full bg-zinc-900/40 px-3 py-1 text-xs">
          {alert.module}
        </div>

      </div>

      <div className="mt-4 flex items-center justify-between">

        <span className="text-xs opacity-70">
          {alert.time}
        </span>

        <button className="rounded-xl bg-zinc-950/40 px-4 py-2 text-xs font-medium">
          Chi tiết
        </button>

      </div>

    </div>
  )
}
