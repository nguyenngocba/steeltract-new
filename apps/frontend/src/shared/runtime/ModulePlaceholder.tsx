export function ModulePlaceholder({
  title,
  subtitle,
}: any) {

  return (
    <div className="flex h-full items-center justify-center bg-zinc-950">

      <div className="text-center">

        <div className="text-5xl font-black tracking-wide text-cyan-400">
          {title}
        </div>

        <div className="mt-4 text-lg text-zinc-500">
          {subtitle}
        </div>

        <div className="mt-10 rounded-3xl border border-cyan-500/20 bg-cyan-500/5 px-8 py-6 text-sm text-cyan-300">

          Runtime Module Ready For Activation

        </div>

      </div>

    </div>
  )
}
