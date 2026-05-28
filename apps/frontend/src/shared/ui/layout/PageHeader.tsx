type Props = {
  title: string
  subtitle?: string
}

export function PageHeader({
  title,
  subtitle,
}: Props) {

  return (

    <div className="mb-6">

      <h1 className="text-4xl font-black tracking-tight text-cyan-400">
        {title}
      </h1>

      {subtitle && (
        <p className="mt-2 text-zinc-400">
          {subtitle}
        </p>
      )}

    </div>
  )
}
