type Props = {

  title: string

  description?: string
}

export function SectionHeader({
  title,
  description,
}: Props) {

  return (

    <div className="mb-8">

      <div className="text-xs uppercase tracking-[0.35em] text-cyan-400">
        STEELTRACK ENTERPRISE
      </div>

      <h1 className="mt-3 text-5xl font-black tracking-tight text-white">
        {title}
      </h1>

      {description && (

        <div className="mt-4 max-w-3xl text-sm leading-7 text-zinc-500">

          {description}

        </div>

      )}

    </div>
  )
}
