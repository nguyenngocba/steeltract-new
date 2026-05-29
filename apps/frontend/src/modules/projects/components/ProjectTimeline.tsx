const projects = [
  {
    id: 'PJ-001',
    name: 'Factory Expansion',
    progress: 82,
  },

  {
    id: 'PJ-002',
    name: 'Warehouse Structure',
    progress: 48,
  },

  {
    id: 'PJ-003',
    name: 'Bridge Steel Package',
    progress: 22,
  },
]

export function ProjectTimeline() {
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
          Project Timeline
        </div>

        <div className="mt-1 text-sm text-zinc-500">
          Active project progress tracking
        </div>
      </div>

      <div className="mt-6 space-y-5">
        {projects.map((project) => (
          <div
            key={project.id}
            className="
              rounded-xl
              border
              border-zinc-800
              bg-zinc-950
              p-4
            "
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-white">
                  {project.id}
                </div>

                <div className="mt-1 text-sm text-zinc-500">
                  {project.name}
                </div>
              </div>

              <div className="text-sm text-violet-400">
                {project.progress}%
              </div>
            </div>

            <div className="mt-4 h-3 overflow-hidden rounded-full bg-zinc-800">
              <div
                style={{
                  width: `${project.progress}%`,
                }}
                className="
                  h-full
                  rounded-full
                  bg-violet-500
                "
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
