import {
  EmptyState,
  SectionCard,
  StatusBadge,
} from '../ui-system'

export function AiInsightSlotWidget() {
  return (
    <SectionCard
      title="AI Insight Slot"
      description="Prepared for anomaly and recommendation cards"
      actions={
        <StatusBadge tone="neutral">
          FUTURE
        </StatusBadge>
      }
    >
      <EmptyState
        title="AI insights not connected"
        description="Predictive alerts, procurement recommendations and workflow risk signals can render here once the analytics engine publishes scored insights."
      />
    </SectionCard>
  )
}
