import {
  ProjectsKpiStrip,
} from '../components/ProjectsKpiStrip'

import {
  ProjectsTable,
} from '../components/ProjectsTable'

export function ProjectsPage() {

  return (

    <div className="min-h-screen bg-black p-8 text-white">

      <div className="mb-8 flex items-center justify-between">

        <div>

          <h1 className="text-4xl font-black text-cyan-400">
            Công Trình
          </h1>

          <div className="mt-2 text-zinc-500">
            Project Runtime Management
          </div>

        </div>

      </div>

      <div className="space-y-8">

        <ProjectsKpiStrip />

        <ProjectsTable />

      </div>

    </div>
  )
}
