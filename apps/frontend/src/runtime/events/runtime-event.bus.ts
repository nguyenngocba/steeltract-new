import { RuntimeEvent }
  from './event.types'

type Listener = (
  event: RuntimeEvent,
) => void

class RuntimeEventBus {
  private listeners:
    Listener[] = []

  emit(event: RuntimeEvent) {
    console.log(
      '[Runtime Event]',
      event,
    )

    this.listeners.forEach(
      (listener) =>
        listener(event),
    )
  }

  subscribe(
    listener: Listener,
  ) {
    this.listeners.push(
      listener,
    )

    return () => {
      this.listeners =
        this.listeners.filter(
          (l) =>
            l !== listener,
        )
    }
  }
}

export const runtimeEventBus =
  new RuntimeEventBus()
