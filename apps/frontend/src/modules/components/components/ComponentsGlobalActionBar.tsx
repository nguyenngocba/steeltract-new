import { Plus } from 'lucide-react'
import { useComponentsActions } from '../context/ComponentsActionContext'
import { ActionGuard } from '@/shared/permissions/PermissionGuard'

export interface ComponentsGlobalActionBarProps {
  onCreateComponent?: () => void
  onCreateProductionOrder?: () => void
  onCreateBom?: () => void
}

export function ComponentsGlobalActionBar({
  onCreateComponent,
  onCreateProductionOrder,
  onCreateBom,
}: ComponentsGlobalActionBarProps) {
  const actions = useComponentsActions()

  const handleCreateComponent = onCreateComponent ?? actions.openCreateComponent
  const handleCreateProductionOrder = onCreateProductionOrder ?? (() => actions.openProductionOrder())
  const handleCreateBom = onCreateBom ?? (() => actions.openBomModal())

  return (
    <div className="flex shrink-0 items-center gap-2 text-xs font-semibold">
      <ActionGuard permission="components.create"><button
        type="button"
        onClick={handleCreateComponent}
        className="flex h-10 items-center gap-1.5 rounded-lg border border-blue-400/30 bg-blue-600 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500"
      >
        <Plus size={15} />
        + Cấu kiện
      </button></ActionGuard>

      <ActionGuard permission="production.create"><button
        type="button"
        onClick={handleCreateProductionOrder}
        className="flex h-10 items-center gap-1.5 rounded-lg border border-emerald-400/30 bg-emerald-600/90 px-4 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-500"
      >
        <Plus size={15} />
        + Lệnh SX
      </button></ActionGuard>

      <ActionGuard permission="components.edit"><button
        type="button"
        onClick={handleCreateBom}
        className="flex h-10 items-center gap-1.5 rounded-lg border border-white/15 bg-slate-900/80 px-4 text-sm font-semibold text-slate-100 shadow-lg shadow-black/20 transition hover:border-white/25 hover:bg-slate-800"
      >
        <Plus size={15} />
        + BOM
      </button></ActionGuard>
    </div>
  )
}
