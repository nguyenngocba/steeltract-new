type RuntimeTask = {
  id: string

  name: string

  interval: number

  execute: () => void
}

class RuntimeScheduler {
  private tasks:
    RuntimeTask[] = []

  register(task: RuntimeTask) {
    this.tasks.push(task)

    setInterval(() => {
      task.execute()
    }, task.interval)
  }

  list() {
    return this.tasks
  }
}

export const runtimeScheduler =
  new RuntimeScheduler()
