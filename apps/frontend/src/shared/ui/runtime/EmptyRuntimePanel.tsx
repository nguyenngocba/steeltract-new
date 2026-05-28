type Props = {

  title: string

  description: string
}

export function EmptyRuntimePanel({
  title,
  description,
}: Props) {

  return (

    <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-10">

      <div className="text-2xl font-black text-white">
        {title}
      </div>

      <div className="mt-3 max-w-2xl text-sm text-zinc-500">
        {description}
      </div>

    </div>
  )
}
