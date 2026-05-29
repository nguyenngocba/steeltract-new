const sandboxes = [
  'Inventory Sandbox',
  'Production Sandbox',
  'Dispatch Sandbox',
  'Logistics Sandbox',
  'AI Optimization Sandbox',
]

export function VirtualSandboxPanel() {
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
          Virtual Sandbox
        </div>

        <div className="mt-1 text-sm text-zinc-500">
          Isolated operational simulation environments
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {sandboxes.map((sandbox) => (
          <div
            key={sandbox}
            className="
              rounded-xl
              border
              border-zinc-800
              bg-zinc-950
              p-4
              text-sm
              text-white
            "
          >
            {sandbox}
          </div>
        ))}
      </div>
    </div>
  )
}
