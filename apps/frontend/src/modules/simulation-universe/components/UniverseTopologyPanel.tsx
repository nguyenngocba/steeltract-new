const runtimes = [
  'Inventory Runtime',
  'Production Runtime',
  'Workflow Runtime',
  'AI Copilot Runtime',
  'Autonomous Runtime',
]

export function UniverseTopologyPanel() {
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
        <div className="text-xs uppercase tracking-[0.2em] text-cyan-300">
          Simulation Universe Topology
        </div>

        <div className="mt-1 text-sm text-zinc-500">
          Connected industrial simulation runtimes
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-4">
        {runtimes.map((runtime, index) => (
          <div
            key={runtime}
            className="flex items-center gap-4"
          >
            <div
              className="
                rounded-2xl
                border
                border-zinc-800
                bg-zinc-950
                px-5
                py-4
                text-sm
                font-bold
                text-white
              "
            >
              {runtime}
            </div>

            {index !== runtimes.length - 1 && (
              <div className="text-cyan-300">
                ⇄
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
