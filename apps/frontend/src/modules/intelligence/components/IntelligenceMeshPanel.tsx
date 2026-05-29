import { intelligenceMesh } from '@/intelligence/mesh/intelligence.mesh'

export function IntelligenceMeshPanel() {
  const nodes =
    intelligenceMesh.topology()

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
        <div className="text-xs uppercase tracking-[0.2em] text-rose-400">
          Intelligence Mesh
        </div>

        <div className="mt-1 text-sm text-zinc-500">
          Connected industrial runtimes
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {nodes.map((node) => (
          <div
            key={node.runtime}
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
              {node.runtime}
            </div>

            <div
              className="
                rounded-full
                bg-emerald-500
                px-3
                py-1
                text-xs
                text-white
              "
            >
              {node.status}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
