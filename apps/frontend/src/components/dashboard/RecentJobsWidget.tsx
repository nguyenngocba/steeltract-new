import {
  EmptyState,
  SectionCard,
} from '../ui-system'
import {
  BackgroundTaskStatus,
} from '../../lib/jobs'

import type {
  BackgroundJob,
} from '../../lib/jobs'

interface RecentJobsWidgetProps {
  jobs: BackgroundJob[]
}

export function RecentJobsWidget({
  jobs,
}: RecentJobsWidgetProps) {
  return (
    <SectionCard
      title="Background Tasks"
      description="Scheduler, outbox, OCR and workflow jobs"
    >
      {jobs.length === 0 ? (
        <EmptyState
          title="No recent background jobs"
          description="Scheduled jobs will appear here when OCR, workflow timeout, notification or retry work is queued."
        />
      ) : (
        <div className="space-y-3">
          {jobs.slice(0, 5).map((job) => (
            <BackgroundTaskStatus
              key={job.id}
              job={job}
            />
          ))}
        </div>
      )}
    </SectionCard>
  )
}
