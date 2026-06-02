type Props = {

  title: string

  description?: string
}

export function SectionHeader({
  title,
  description,
}: Props) {

  return (

    <div className="mb-5">

      <h1 className="mt-1 text-4xl font-black tracking-tight text-white">
        {title}
      </h1>

      {description && (

        <div className="mt-2 max-w-3xl text-sm leading-6 text-zinc-500">

          {description}

        </div>

      )}

    </div>
  )
}
