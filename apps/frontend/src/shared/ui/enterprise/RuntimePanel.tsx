type Props = {

  title?: string

  children:
    React.ReactNode

  className?: string
}

export function RuntimePanel({
  title,
  children,
  className = '',
}: Props) {

  return (

    <div
      className={`rounded-3xl border border-zinc-800 bg-zinc-950/80 backdrop-blur ${className}`}
    >

      {title && (

        <div className="border-b border-zinc-800 px-6 py-4">

          <div className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-400">

            {title}

          </div>

        </div>

      )}

      <div className="p-6">

        {children}

      </div>

    </div>
  )
}
