import { EnterpriseTabBar } from '../../../shared/runtime-tabs/EnterpriseTabBar'
import { inventoryTabs } from '../config/inventory-tabs'
import { InventoryGlobalActionBar } from './InventoryGlobalActionBar'

export function InventoryTabWorkspace() {
  return (
    <div className="mb-4 rounded-xl border border-white/10 bg-white/[0.055] p-1 shadow-[0_18px_44px_rgba(0,0,0,0.18)] backdrop-blur-xl">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0 flex-1 overflow-auto">
          <EnterpriseTabBar tabs={inventoryTabs} variant="embedded" />
        </div>
        <InventoryGlobalActionBar />
      </div>
    </div>
  )
}
