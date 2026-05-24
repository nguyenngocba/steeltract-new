import {
  EmptyState,
  SectionCard,
  StatusBadge,
} from '../ui-system'

export function AttendanceSummaryWidget() {
  return (
    <SectionCard
      title="Worker Attendance"
      description="Attendance summary integration point"
      actions={
        <StatusBadge tone="neutral">
          DATA SOURCE PENDING
        </StatusBadge>
      }
    >
      <EmptyState
        title="Attendance metrics not connected"
        description="This widget is ready for present, absent, late, and active crew metrics once the attendance summary API is available."
      />
    </SectionCard>
  )
}
