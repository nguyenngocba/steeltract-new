import {
  SectionCard,
  StatusBadge,
} from '../../components/ui-system'

interface LiveQcPulseProps {
  passRate?: number
  openIssues?: number
  openNcrs?: number
}

export function LiveQcPulse({
  passRate = 0,
  openIssues = 0,
  openNcrs = 0,
}: LiveQcPulseProps) {
  return (
    <SectionCard
      title="QC pulse"
      actions={
        <StatusBadge
          tone={passRate < 85 ? 'danger' : 'success'}
        >
          {passRate < 85 ? 'risk' : 'healthy'}
        </StatusBadge>
      }
    >
      <div className="grid grid-cols-3 gap-3 text-sm">
        <div className="rounded-lg bg-zinc-950/60 p-3">
          <p className="text-zinc-500">
            Pass rate
          </p>
          <p className="mt-1 text-2xl font-semibold text-white">
            {passRate}%
          </p>
        </div>
        <div className="rounded-lg bg-zinc-950/60 p-3">
          <p className="text-zinc-500">
            Issues
          </p>
          <p className="mt-1 text-2xl font-semibold text-white">
            {openIssues}
          </p>
        </div>
        <div className="rounded-lg bg-zinc-950/60 p-3">
          <p className="text-zinc-500">
            NCR
          </p>
          <p className="mt-1 text-2xl font-semibold text-white">
            {openNcrs}
          </p>
        </div>
      </div>
    </SectionCard>
  )
}
