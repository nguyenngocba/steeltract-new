import { useQuery }
  from '@tanstack/react-query'

import { OperationalShell }
  from '@/shared/layouts/OperationalShell'

import { getProjects }
  from '../api/projects.api'

export function ProjectsPage() {
  const {
    data = [],
  } = useQuery({
    queryKey: ['projects'],

    queryFn:
      getProjects,
  })

  return (
    <OperationalShell>
      <div className="space-y-6 p-6">

        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-cyan-400">
            Project Runtime
          </div>

          <h1 className="mt-2 text-4xl font-black text-white">
            Industrial Projects Command Center
          </h1>
        </div>

        <div className="grid grid-cols-3 gap-6">

          {data.map((project: any) => (
            <div
              key={project.id}
              className="
                rounded-3xl
                border
                border-zinc-800
                bg-zinc-900
                p-6
              "
            >
              <div className="flex items-start justify-between">

                <div>

                  <div className="text-xs uppercase tracking-[0.2em] text-cyan-400">
                    {project.id}
                  </div>

                  <div className="mt-2 text-2xl font-black text-white">
                    {project.name}
                  </div>

                </div>

                <div
                  className={`
                    rounded-full
                    px-3
                    py-1
                    text-xs
                    font-medium

                    ${
                      project.status === 'ACTIVE'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-red-500/20 text-red-400'
                    }
                  `}
                >
                  {project.status}
                </div>

              </div>

              <div className="mt-6">

                <div className="flex items-center justify-between text-sm">

                  <span className="text-zinc-500">
                    Progress
                  </span>

                  <span className="text-white">
                    {project.progress}%
                  </span>

                </div>

                <div className="mt-2 h-3 overflow-hidden rounded-full bg-zinc-800">

                  <div
                    className="h-full rounded-full bg-cyan-500"
                    style={{
                      width:
                        `${project.progress}%`,
                    }}
                  />

                </div>

              </div>

              <div className="mt-6 grid grid-cols-2 gap-4">

                <div className="rounded-2xl bg-zinc-950 p-4">
                  <div className="text-xs text-zinc-500">
                    Steel Tonnage
                  </div>

                  <div className="mt-2 text-2xl font-black text-white">
                    {project.tonnage}T
                  </div>
                </div>

                <div className="rounded-2xl bg-zinc-950 p-4">
                  <div className="text-xs text-zinc-500">
                    Delivered
                  </div>

                  <div className="mt-2 text-2xl font-black text-emerald-400">
                    {project.delivered}T
                  </div>
                </div>

                <div className="rounded-2xl bg-zinc-950 p-4">
                  <div className="text-xs text-zinc-500">
                    Pending
                  </div>

                  <div className="mt-2 text-2xl font-black text-orange-400">
                    {project.pending}T
                  </div>
                </div>

                <div className="rounded-2xl bg-zinc-950 p-4">
                  <div className="text-xs text-zinc-500">
                    QC Issues
                  </div>

                  <div className="mt-2 text-2xl font-black text-red-400">
                    {project.qcIssues}
                  </div>
                </div>

              </div>

            </div>
          ))}

        </div>

      </div>
    </OperationalShell>
  )
}
