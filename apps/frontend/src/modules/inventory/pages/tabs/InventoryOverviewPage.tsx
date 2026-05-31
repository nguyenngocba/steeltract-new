import {
  EnterpriseModulePage,
} from '../../../../shared/runtime-tabs/EnterpriseModulePage'

import {
  EnterpriseTabBar,
} from '../../../../shared/runtime-tabs/EnterpriseTabBar'

import {
  inventoryTabs,
} from '../../config/inventory-tabs'

import {
  RuntimePanel,
  SectionHeader,
} from '../../../../shared/ui/enterprise'

import {
  useInventoryItems,
} from '../../hooks/useInventoryItems'

export function InventoryOverviewPage() {

  const {
    data = [],
  } = useInventoryItems()

  const totalItems =
    data.length

  const totalQuantity =
    data.reduce(
      (sum: number, item: any) =>
        sum + (item.quantity || 0),
      0,
    )

  const lowStock =
    data.filter(
      (item: any) =>
        item.status === 'LOW_STOCK',
    ).length

  const critical =
    data.filter(
      (item: any) =>
        item.status === 'CRITICAL',
    ).length

  return (
    <EnterpriseModulePage>

      <SectionHeader
        title="Inventory Overview"
        description="Realtime warehouse visibility."
      />

      <EnterpriseTabBar
        tabs={inventoryTabs}
      />

      <div className="grid grid-cols-4 gap-6">

        <RuntimePanel title="Materials">
          <div className="text-4xl font-black text-white">
            {totalItems}
          </div>
        </RuntimePanel>

        <RuntimePanel title="Quantity">
          <div className="text-4xl font-black text-cyan-400">
            {totalQuantity}
          </div>
        </RuntimePanel>

        <RuntimePanel title="Low Stock">
          <div className="text-4xl font-black text-amber-400">
            {lowStock}
          </div>
        </RuntimePanel>

        <RuntimePanel title="Critical">
          <div className="text-4xl font-black text-red-400">
            {critical}
          </div>
        </RuntimePanel>

      </div>

    </EnterpriseModulePage>
  )
}
