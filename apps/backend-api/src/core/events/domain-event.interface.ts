export interface DomainEvent<
  TName extends string = string,
  TPayload = unknown,
> {
  name: TName;
  payload: TPayload;
  occurredAt: Date;
  metadata?: DomainEventMetadata;
}

export interface DomainEventMetadata {
  eventId?: string;
  correlationId?: string;
  causationId?: string;
  module?: string;
  persistToOutbox?: boolean;
  idempotencyKey?: string;
  outboxDelaySeconds?: number;
  outboxMaxRetries?: number;
}
