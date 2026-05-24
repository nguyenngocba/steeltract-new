import {
  Timeline,
} from '../../components/ui-system'

import type {
  SimulationStatus,
} from './simulation.types'

interface RealtimeScenarioTimelineProps {
  status?: SimulationStatus
}

export function RealtimeScenarioTimeline({
  status,
}: RealtimeScenarioTimelineProps) {
  return (
    <Timeline
      items={[
        {
          id: 'bootstrap',
          title: status?.bootstrapped
            ? 'Demo ecosystem ready'
            : 'Waiting for bootstrap',
          description:
            'Seed suppliers, inventory, production, QC, yard and analytics.',
          tone: status?.bootstrapped
            ? 'success'
            : 'neutral',
        },
        {
          id: 'scenario',
          title:
            status?.scenarioId ??
            'No active scenario',
          description:
            status?.lastEvent ??
            'Run a scenario to emit live domain events.',
          tone: status?.running
            ? 'info'
            : 'neutral',
        },
      ]}
    />
  )
}
