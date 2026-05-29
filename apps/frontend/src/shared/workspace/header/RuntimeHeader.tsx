export function RuntimeHeader() {
  return (
    <div className="flex h-full items-center justify-between border-b border-zinc-800 bg-zinc-950 px-6">
      <div>
        <div className="text-xs uppercase tracking-[0.3em] text-cyan-400">
          SteelTrack
        </div>

        <div className="mt-1 text-sm text-zinc-400">
          Industrial Operations Runtime
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="h-2 w-2 rounded-full bg-emerald-400" />

        <div className="text-sm text-zinc-400">
          Runtime Online
        </div>
      </div>
    </div>
  )
}
