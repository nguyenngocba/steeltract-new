const commands = [
  'Show low stock risks',
  'Analyze production delays',
  'Predict supplier risks',
  'Show QC anomalies',
  'Optimize yard dispatch',
]

export function AiCommandPalette() {
  return (
    <div
      className="
        rounded-2xl
        border
        border-fuchsia-500/20
        bg-zinc-900
        p-6
      "
    >
      <div>
        <div className="text-xs uppercase tracking-[0.2em] text-fuchsia-400">
          AI Command Palette
        </div>

        <div className="mt-1 text-sm text-zinc-500">
          Runtime operational command interface
        </div>
      </div>

      <div className="mt-6 flex gap-3 overflow-x-auto">
        {commands.map((command) => (
          <button
            key={command}
            className="
              whitespace-nowrap
              rounded-xl
              border
              border-zinc-800
              bg-zinc-950
              px-4
              py-3
              text-sm
              text-white
              transition-all
              hover:border-fuchsia-500
            "
          >
            {command}
          </button>
        ))}
      </div>
    </div>
  )
}
