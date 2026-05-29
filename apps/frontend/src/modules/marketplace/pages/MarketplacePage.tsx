import { OperationalShell } from '@/shared/layouts/OperationalShell'

import { MarketplaceRuntimeGrid } from '../components/MarketplaceRuntimeGrid'
import { PluginCatalogPanel } from '../components/PluginCatalogPanel'
import { RuntimeExtensionPanel } from '../components/RuntimeExtensionPanel'

export function MarketplacePage() {
  return (
    <OperationalShell>
      <div className="space-y-6 p-6">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-violet-400">
            Industrial Marketplace
          </div>

          <h1 className="mt-2 text-4xl font-black text-white">
            Runtime Extension Platform
          </h1>

          <div className="mt-2 text-sm text-zinc-500">
            Dynamic industrial runtime modules & operational plugins
          </div>
        </div>

        <MarketplaceRuntimeGrid />

        <div className="grid grid-cols-2 gap-6">
          <PluginCatalogPanel />

          <RuntimeExtensionPanel />
        </div>
      </div>
    </OperationalShell>
  )
}
