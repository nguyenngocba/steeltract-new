export type OperationalDomain =
  | 'inventory'
  | 'project'
  | 'component'
  | 'task'
  | 'workflow'
  | 'attachment'
  | 'job'
  | 'outbox'
  | 'production'
  | 'qc'
  | 'yard'
  | 'analytics'
  | 'audit'
  | 'shipment'
  | 'machine'

export interface OperationalDomainEvent {
  event: string
  domain: OperationalDomain | string
  entityId?: string
  relatedIds: string[]
  changedFields: string[]
  occurredAt: string
}

export interface WorkspaceEventFilter {
  domains?: string[]
  eventNames?: string[]
  entityIds?: string[]
}
