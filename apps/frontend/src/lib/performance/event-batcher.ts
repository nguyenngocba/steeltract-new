export class EventBatcher<T> {
  private queue: T[] = []
  private timeoutId?: number
  private readonly flushDelayMs: number
  private readonly onFlush: (items: T[]) => void

  constructor(
    flushDelayMs: number,
    onFlush: (items: T[]) => void,
  ) {
    this.flushDelayMs = flushDelayMs
    this.onFlush = onFlush
  }

  push(item: T) {
    this.queue.push(item)

    if (this.timeoutId) {
      return
    }

    this.timeoutId = window.setTimeout(
      () => this.flush(),
      this.flushDelayMs,
    )
  }

  flush() {
    if (this.timeoutId) {
      window.clearTimeout(this.timeoutId)
      this.timeoutId = undefined
    }

    if (this.queue.length === 0) {
      return
    }

    const items = this.queue
    this.queue = []
    this.onFlush(items)
  }

  clear() {
    if (this.timeoutId) {
      window.clearTimeout(this.timeoutId)
      this.timeoutId = undefined
    }

    this.queue = []
  }
}
