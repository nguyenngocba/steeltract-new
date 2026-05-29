import { pluginRegistry } from '@/marketplace/registry/plugin.registry'

export function PluginCatalogPanel() {
  const plugins =
    pluginRegistry.list()

  return (
    <div
      className="
        rounded-2xl
        border
        border-zinc-800
        bg-zinc-900
        p-6
      "
    >
      <div>
        <div className="text-xs uppercase tracking-[0.2em] text-violet-400">
          Plugin Catalog
        </div>

        <div className="mt-1 text-sm text-zinc-500">
          Installed industrial runtime plugins
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {plugins.map((plugin) => (
          <div
            key={plugin.id}
            className="
              rounded-xl
              border
              border-zinc-800
              bg-zinc-950
              p-4
            "
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-bold text-white">
                  {plugin.name}
                </div>

                <div className="mt-1 text-xs text-zinc-500">
                  {plugin.description}
                </div>

                <div className="mt-2 text-xs text-zinc-600">
                  {plugin.version} • {plugin.author}
                </div>
              </div>

              <div
                className="
                  rounded-full
                  bg-emerald-500
                  px-3
                  py-1
                  text-xs
                  text-white
                "
              >
                {plugin.status}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
