export type DomainEvent = {
  id: string

  type: string

  payload: unknown

  createdAt: string
}
