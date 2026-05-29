import {
  Zap,
} from 'lucide-react'

import {
  SectionCard,
  StatusBadge,
} from '../../components/ui-system'
import { OperatorActionMenu } from './OperatorActionMenu'
import {
  useOperatorActions,
} from './useOperatorActions'

import type {
  OperatorActionContext,
  OperatorActionDomain,
} from './operator-action.types'

interface OperatorQuickActionsPanelProps {
  context?: OperatorActionContext
  domains?: OperatorActionDomain[]
  title?: string
}

export function OperatorQuickActionsPanel({
  context,
  domains,
  title = 'Operator quick actions',
}: OperatorQuickActionsPanelProps) {
  const actions = useOperatorActions({
    context,
    domains,
  })
  const ready = actions.filter(
    (action) => !action.disabled,
  ).length

  return (
    <SectionCard
      title={title}
      description="RBAC-aware command shortcuts mapped to real mutation hooks where operational context is available."
      actions={
        <div className="flex flex-wrap gap-2">
          <StatusBadge tone="info">
            {ready} ready
          </StatusBadge>
          <StatusBadge tone="neutral">
            keyboard ready
          </StatusBadge>
        </div>
      }
    >
      <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-wide text-zinc-500">
        <Zap className="h-3.5 w-3.5 text-cyan-300" />
        cross-module actions
      </div>
      <OperatorActionMenu actions={actions} />
    </SectionCard>
  )
}
