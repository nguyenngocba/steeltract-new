import {
  ActivityFeed,
  EmptyState,
  SectionCard,
} from '../ui-system'
import {
  formatDateTime,
} from './dashboard-utils'

import type {
  DashboardActivity,
} from '../../services/api/dashboard.api'

interface RealtimeActivityWidgetProps {
  activities: DashboardActivity[]
}

export function RealtimeActivityWidget({
  activities,
}: RealtimeActivityWidgetProps) {
  return (
    <SectionCard
      title="Realtime Activity"
      description="ActivityLog stream invalidated by domain events"
    >
      {activities.length === 0 ? (
        <EmptyState
          title="No recent activity"
          description="Audit events will appear here as ERP modules create activity logs."
        />
      ) : (
        <ActivityFeed
          items={activities.map((activity) => ({
            id: activity.id,
            title: activity.action,
            description: activity.entity,
            time: formatDateTime(activity.createdAt),
            tone: 'info',
          }))}
        />
      )}
    </SectionCard>
  )
}
