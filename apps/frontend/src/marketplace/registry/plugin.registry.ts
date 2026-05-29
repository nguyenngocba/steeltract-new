import { RuntimePlugin } from '../runtime/plugin.types'

class PluginRegistry {
  private plugins:
    RuntimePlugin[] = []

  register(
    plugin: RuntimePlugin,
  ) {
    this.plugins.push(plugin)
  }

  list() {
    return this.plugins
  }
}

export const pluginRegistry =
  new PluginRegistry()
