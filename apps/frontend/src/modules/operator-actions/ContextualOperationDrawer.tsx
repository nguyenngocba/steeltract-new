import {
  Activity,
  Boxes,
  BrainCircuit,
  GitBranch,
  Keyboard,
  ListChecks,
} from 'lucide-react'
import type {
  LucideIcon,
} from 'lucide-react'

import {
  DrawerShell,
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

interface ContextualOperationDrawerProps {
  open: boolean
  title: string
  subtitle?: string
  context?: OperatorActionContext
  domains?: OperatorActionDomain[]
  onClose: () => void
}

export function ContextualOperationDrawer({
  open,
  title,
  subtitle,
  context,
  domains,
  onClose,
}: ContextualOperationDrawerProps) {
  const actions = useOperatorActions({
    context,
    domains,
  })
  const panels: Array<{
    label: string
    value: string
    Icon: LucideIcon
  }> = [
    {
      label: 'Realtime',
      value: 'subscribed',
      Icon: Activity,
    },
    {
      label: 'Attachments',
      value: 'preview ready',
      Icon: Boxes,
    },
    {
      label: 'Related',
      value: 'trace graph',
      Icon: GitBranch,
    },
  ]

  return (
    <DrawerShell
      open={open}
      title={title}
      onClose={onClose}
    >
      <div className="space-y-4">
        {subtitle ? (
          <p className="text-sm text-zinc-400">
            {subtitle}
          </p>
        ) : null}

        <div className="grid grid-cols-3 gap-2">
          {panels.map(({ label, value, Icon }) => (
            <div
              key={label}
              className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-3"
            >
              <Icon className="h-4 w-4 text-cyan-300" />
              <p className="mt-2 text-xs text-zinc-500">
                {label}
              </p>
              <p className="mt-1 truncate text-xs font-medium text-white">
                {value}
              </p>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-white">
              Operational metrics
            </p>
            <StatusBadge tone="info">
              live
            </StatusBadge>
          </div>
          <div className="grid gap-2 text-xs text-zinc-400">
            <div className="flex justify-between">
              <span>Activity timeline</span>
              <span>event-backed</span>
            </div>
            <div className="flex justify-between">
              <span>Risk signal</span>
              <span>analytics-ready</span>
            </div>
            <div className="flex justify-between">
              <span>Attachment evidence</span>
              <span>linked by id</span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-cyan-500/25 bg-cyan-500/10 p-3 shadow-[0_0_26px_rgba(34,211,238,0.06)]">
          <div className="flex items-start gap-3">
            <BrainCircuit className="mt-0.5 h-4 w-4 text-cyan-300" />
            <div>
              <p className="text-sm font-medium text-white">
                Contextual recommendation
              </p>
              <p className="mt-1 text-xs leading-5 text-zinc-400">
                Review realtime activity, confirm attachment evidence,
                then run the enabled quick action chain for this entity.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            <ListChecks className="h-3.5 w-3.5 text-cyan-300" />
            action chain
          </div>
          {[
            'Inspect current state',
            'Attach evidence / timeline context',
            'Execute permitted action',
            'Verify realtime refresh',
          ].map((step, index) => (
            <div
              key={step}
              className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/70 px-3 py-2 text-xs"
            >
              <span className="text-zinc-300">{step}</span>
              <StatusBadge tone={index === 0 ? 'info' : 'neutral'}>
                {index + 1}
              </StatusBadge>
            </div>
          ))}
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Quick actions
            </p>
            <span className="inline-flex items-center gap-1 rounded border border-zinc-800 px-2 py-1 text-[11px] text-zinc-400">
              <Keyboard className="h-3 w-3" />
              shortcuts
            </span>
          </div>
          <OperatorActionMenu actions={actions} />
        </div>
      </div>
    </DrawerShell>
  )
}
