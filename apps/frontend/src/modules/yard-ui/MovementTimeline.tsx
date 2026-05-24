import {
  SectionCard,
  Timeline,
} from '../../components/ui-system'

import type {
  YardMovement,
} from './yard.types'

interface MovementTimelineProps {
  movements: YardMovement[]
}

export function MovementTimeline({
  movements,
}: MovementTimelineProps) {
  return (
    <SectionCard title="Movement timeline">
      <Timeline
        items={movements.map((movement) => ({
          id: movement.id,
          title: `${movement.type} ${movement.itemCode}`,
          description:
            movement.reason ??
            `${movement.fromSlot?.code ?? 'yard'} -> ${
              movement.toSlot?.code ?? 'yard'
            }`,
          time: new Date(
            movement.createdAt,
          ).toLocaleString(),
          tone:
            movement.type === 'REMOVE'
              ? 'warning'
              : movement.type === 'MOVE'
                ? 'info'
                : 'success',
        }))}
      />
    </SectionCard>
  )
}
