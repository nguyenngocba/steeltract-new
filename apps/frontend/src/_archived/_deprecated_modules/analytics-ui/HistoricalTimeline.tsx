import {
  SectionCard,
  Timeline,
} from '../../components/ui-system'

import type {
  AnalyticsSnapshot,
} from './analytics.types'

interface HistoricalTimelineProps {
  snapshots: AnalyticsSnapshot[]
}

export function HistoricalTimeline({
  snapshots,
}: HistoricalTimelineProps) {
  return (
    <SectionCard title="Historical timeline">
      <Timeline
        items={snapshots.map((snapshot) => ({
          id: snapshot.id,
          title: `${snapshot.domain} ${snapshot.snapshotType}`,
          description: `${snapshot.metricRecords?.length ?? 0} metrics, ${snapshot.alerts?.length ?? 0} alerts`,
          time: new Date(
            snapshot.createdAt,
          ).toLocaleString(),
          tone:
            (snapshot.alerts?.length ?? 0) > 0
              ? 'warning'
              : 'success',
        }))}
      />
    </SectionCard>
  )
}
