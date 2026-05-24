import { DomainEvent } from './domain-event.interface';

export type DomainEventHandler<
  TPayload = unknown,
  TName extends string = string,
> = (event: DomainEvent<TName, TPayload>) => void | Promise<void>;

export interface EventHandler<
  TPayload = unknown,
  TName extends string = string,
> {
  handle(event: DomainEvent<TName, TPayload>): void | Promise<void>;
}
