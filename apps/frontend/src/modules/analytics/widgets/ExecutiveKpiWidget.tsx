type Props = {
  label: string
  value: string
  color: string
}

export function ExecutiveKpiWidget({
  label,
  value,
  color,
}: Props) {
  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">

      <p className="text-xs uppercase tracking-wide text-zinc-500">
        {label}
      </p>

      <h2
        className="mt-4 text-5xl font-bold"
        style={{
          color,
        }}
      >
        {value}
      </h2>

    </div>
  )
}
