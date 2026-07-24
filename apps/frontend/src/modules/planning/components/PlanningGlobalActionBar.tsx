import { Plus } from 'lucide-react'
import { usePlanningActions } from '../context/PlanningActionContext'

export interface PlanningGlobalActionBarProps {
  onCreatePlan?: () => void
}

export function PlanningGlobalActionBar({
  onCreatePlan,
}: PlanningGlobalActionBarProps = {}) {
  const actions = usePlanningActions()

  const handleCreatePlan = onCreatePlan ?? (() => actions.openCreatePlan())

  return (
    <div className="flex shrink-0 items-center gap-2 text-xs font-semibold">
      <button
        type="button"
        onClick={handleCreatePlan}
        className="flex h-10 items-center gap-1.5 rounded-lg border border-blue-400/30 bg-blue-600/90 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500"
      >
        <Plus size={15} />
        + Lập kế hoạch mới
      </button>
    </div>
  )
}
