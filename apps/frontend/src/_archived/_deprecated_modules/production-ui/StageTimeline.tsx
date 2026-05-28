import {
  Timeline,
} from '../../components/ui-system'
import {
  stageTone,
} from './production-utils'

import type {
  ProductionOrder,
} from './production.types'

interface StageTimelineProps {
  order?: ProductionOrder
}

export function StageTimeline({
  order,
}: StageTimelineProps) {
  return (
    <Timeline
      items={(order?.stages ?? []).map((stage) => ({
        id: stage.id,
        title: stage.name,
        description:
          stage.workCenter?.name ??
          stage.machine?.name ??
          stage.code,
        time: stage.completedAt
          ? new Date(stage.completedAt).toLocaleString()
          : stage.status,
        tone: stageTone(stage.status),
      }))}
    />
  )
}
