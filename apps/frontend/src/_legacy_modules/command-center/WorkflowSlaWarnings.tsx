import {
  SectionCard,
  StatusBadge,
} from '../../components/ui-system'

interface WorkflowSlaWarningsProps {
  overdue?: number
  active?: number
}

export function WorkflowSlaWarnings({
  overdue = 0,
  active = 0,
}: WorkflowSlaWarningsProps) {
  return (
    <SectionCard
      title="Workflow SLA"
      actions={
        <StatusBadge
          tone={overdue > 0 ? 'danger' : 'success'}
        >
          {overdue > 0 ? 'breach' : 'clear'}
        </StatusBadge>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-zinc-950/60 p-3">
          <p className="text-sm text-zinc-500">
            Active workflows
          </p>
          <p className="mt-1 text-2xl font-semibold text-white">
            {active}
          </p>
        </div>
        <div className="rounded-lg bg-zinc-950/60 p-3">
          <p className="text-sm text-zinc-500">
            Overdue
          </p>
          <p className="mt-1 text-2xl font-semibold text-white">
            {overdue}
          </p>
        </div>
      </div>
    </SectionCard>
  )
}
