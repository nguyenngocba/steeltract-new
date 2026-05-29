const nodes = [
  'Inventory Alert',
  'Approval Flow',
  'Purchase Order',
  'Supplier',
  'Receiving',
  'Warehouse',
]

export function WorkflowTopology() {
  return (
    <div
      className="
        rounded-2xl
        border
        border-lime-500/20
        bg-zinc-900
        p-6
      "
    >
      <div>
        <div className="text-xs uppercase tracking-[0.2em] text-lime-400">
          Workflow Topology
        </div>

        <div className="mt-1 text-sm text-zinc-500">
          Operational orchestration flow
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-4">
        {nodes.map((node, index) => (
          <div
            key={node}
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
              {node}
            </div>

            {index !== nodes.length - 1 && (
              <div className="text-lime-400">
                →
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
