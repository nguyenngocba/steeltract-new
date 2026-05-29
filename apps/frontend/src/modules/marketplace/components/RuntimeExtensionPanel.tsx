const extensions = [
  {
    extension:
      'AI Procurement Runtime',
  },

  {
    extension:
      'Realtime Crane Telemetry',
  },

  {
    extension:
      'Supplier Federation Sync',
  },

  {
    extension:
      'Advanced QC Intelligence',
  },
]

export function RuntimeExtensionPanel() {
  return (
    <div
      className="
        rounded-2xl
        border
        border-zinc-800
        bg-zinc-900
        p-6
      "
    >
      <div>
        <div className="text-xs uppercase tracking-[0.2em] text-violet-400">
          Runtime Extensions
        </div>

        <div className="mt-1 text-sm text-zinc-500">
          Available industrial runtime packages
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {extensions.map((item) => (
          <div
            key={item.extension}
            className="
              flex
              items-center
              justify-between
              rounded-xl
              border
              border-zinc-800
              bg-zinc-950
              p-4
            "
          >
            <div className="text-sm text-white">
              {item.extension}
            </div>

            <button
              className="
                rounded-xl
                bg-violet-500
                px-4
                py-2
                text-xs
                font-bold
                text-white
              "
            >
              Install
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
