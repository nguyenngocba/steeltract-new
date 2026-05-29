import {
  SectionCard,
  StatusBadge,
  Timeline,
} from '../../components/ui-system'
import { severityTone } from './command-center-utils'

import type {
  CommandEvent,
} from './command-center.types'

interface RealtimeActivityStreamProps {
  events: CommandEvent[]
}

export function RealtimeActivityStream({
  events,
}: RealtimeActivityStreamProps) {
  return (
    <SectionCard
      title="Realtime activity stream"
      actions={
        <StatusBadge tone="success">
          live
        </StatusBadge>
      }
    >
      <Timeline
        items={events.slice(0, 12).map((event) => ({
          id: event.id,
          title: event.event,
          description: event.message,
          time: new Date(
            event.occurredAt,
          ).toLocaleTimeString(),
          tone: severityTone(event.severity),
        }))}
      />
    </SectionCard>
  )
}
