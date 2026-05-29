import { runtimeEventBus }
  from '@/runtime/events/runtime-event.bus'

export function emitInventoryEvent(
  type: string,
  payload: unknown,
) {
  runtimeEventBus.emit({
    id:
      Date.now().toString(),

    type,

    payload,

    createdAt:
      new Date().toISOString(),
  })
}
