import { Plus } from 'lucide-react'
import { ActionGuard } from '@/shared/permissions/PermissionGuard'
import { useProjectsActions } from '../context/ProjectsActionContext'

export interface ProjectsGlobalActionBarProps {
  onCreateProject?: () => void
}

export function ProjectsGlobalActionBar({
  onCreateProject,
}: ProjectsGlobalActionBarProps = {}) {
  const actions = useProjectsActions()
  const handleCreateProject = onCreateProject ?? (() => actions.openCreateProject())

  return (
    <div className="flex shrink-0 items-center gap-2 text-xs font-semibold">
      <ActionGuard permission="projects.create"><button
        type="button"
        onClick={handleCreateProject}
        className="flex h-10 items-center gap-1.5 rounded-lg border border-blue-400/30 bg-blue-600 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500"
      >
        <Plus size={15} />
        + Thêm công trình
      </button></ActionGuard>
    </div>
  )
}
