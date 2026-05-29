export type RuntimeModule = {
  id: string

  name: string

  version: string

  status: 'ONLINE' | 'OFFLINE'
}

class RuntimeRegistry {
  private modules:
    RuntimeModule[] = []

  register(
    module: RuntimeModule,
  ) {
    this.modules.push(module)
  }

  list() {
    return this.modules
  }
}

export const runtimeRegistry =
  new RuntimeRegistry()
