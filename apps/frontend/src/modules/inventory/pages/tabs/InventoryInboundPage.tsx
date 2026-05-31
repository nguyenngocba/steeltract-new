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
  SectionHeader,
} from '../../../../shared/ui/enterprise'

import {
  InboundView,
} from '../../features/inbound/InboundView'

export function InventoryInboundPage() {

  return (

    <EnterpriseModulePage>

      <SectionHeader
        title="Inbound Runtime"
        description="Material receiving and warehouse intake operations."
      />

      <EnterpriseTabBar
        tabs={inventoryTabs}
      />

      <InboundView />

    </EnterpriseModulePage>

  )
}
