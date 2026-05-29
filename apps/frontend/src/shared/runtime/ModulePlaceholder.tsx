type Props = {
  title: string
}

export function ModulePlaceholder({
  title,
}: Props) {
  return (
    <div className="p-6">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
        <div className="text-sm text-zinc-500">
          Module Runtime
        </div>

        <div className="mt-3 text-2xl font-bold text-white">
          {title}
        </div>
      </div>
    </div>
  )
}
