import {
  RadioTower,
} from 'lucide-react'

import {
  EmptyState,
  SectionCard,
  StatusBadge,
} from '../../../components/ui-system'

import type {
  OperationalDomainEvent,
} from '../events/domain-event.types'

function eventTone(event: OperationalDomainEvent) {
  if (
    event.event.includes('failed') ||
    event.event.includes('delayed') ||
    event.event.includes('alert')
  ) {
    return 'danger' as const
  }

  if (
    event.event.includes('completed') ||
    event.event.includes('approved') ||
    event.event.includes('imported')
  ) {
    return 'success' as const
  }

  if (
    event.event.includes('updated') ||
    event.event.includes('moved') ||
    event.event.includes('scanned')
  ) {
    return 'info' as const
  }

  return 'neutral' as const
}

export function WorkspaceEventSurface({
  title = 'Workspace event stream',
  events,
}: {
  title?: string
  events: OperationalDomainEvent[]
}) {
  return (
    <SectionCard
      title={title}
      description="Domain events feeding telemetry, side panels and workspace synchronization."
    >
      {events.length === 0 ? (
        <EmptyState
          title="No live events yet"
          description="Realtime domain events will appear here when the workspace receives updates."
        />
      ) : (
        <div className="space-y-2">
          {events.map((event) => (
            <div
              key={`${event.event}:${event.entityId}:${event.occurredAt}`}
              className="rounded-lg border border-zinc-800 bg-zinc-950/75 p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-2">
                  <RadioTower className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">
                      {event.event}
                    </p>
                    <p className="mt-1 truncate text-xs text-zinc-500">
                      {event.entityId ?? event.domain} /{' '}
                      {event.occurredAt}
                    </p>
                  </div>
                </div>
                <StatusBadge tone={eventTone(event)}>
                  {event.domain}
                </StatusBadge>
              </div>
              {event.changedFields.length > 0 ? (
                <p className="mt-2 text-xs text-zinc-500">
                  changed: {event.changedFields.join(', ')}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  )
}
