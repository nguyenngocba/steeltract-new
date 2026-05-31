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
  OutboundWizard,
} from '../../features/outbound/OutboundWizard'

export function InventoryOutboundPage() {

  return (

    <EnterpriseModulePage>

      <SectionHeader
        title="Outbound Runtime"
        description="Material issue and dispatch operations."
      />

      <EnterpriseTabBar
        tabs={inventoryTabs}
      />

      <OutboundWizard />

    </EnterpriseModulePage>
  )
}