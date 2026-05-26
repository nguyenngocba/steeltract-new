import type {
  OperationalDomainEvent,
  WorkspaceEventFilter,
} from './domain-event.types'

export function getDomainFromEventName(eventName: string) {
  return eventName.split('.')[0] || 'unknown'
}

export function matchesWorkspaceEvent(
  event: OperationalDomainEvent,
  filter?: WorkspaceEventFilter,
) {
  if (!filter) {
    return true
  }

  if (
    filter.domains?.length &&
    !filter.domains.includes(event.domain)
  ) {
    return false
  }

  if (
    filter.eventNames?.length &&
    !filter.eventNames.includes(event.event)
  ) {
    return false
  }

  if (filter.entityIds?.length) {
    const ids = [
      event.entityId,
      ...event.relatedIds,
    ].filter(Boolean)

    return filter.entityIds.some((id) =>
      ids.includes(id),
    )
  }

  return true
}
