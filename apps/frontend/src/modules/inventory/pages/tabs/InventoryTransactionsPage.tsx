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

const logs = [

  {
    type: 'INBOUND',
    material: 'Steel Beam',
    qty: '+120',
  },

  {
    type: 'OUTBOUND',
    material: 'Bolt M20',
    qty: '-40',
  },

  {
    type: 'TRANSFER',
    material: 'Pipe DN100',
    qty: '60',
  },
]

export function InventoryTransactionsPage() {

  return (

    <EnterpriseModulePage>

      <SectionHeader
        title="Inventory Transactions"
        description="Realtime stock movement and transaction telemetry."
      />

      <EnterpriseTabBar
        tabs={inventoryTabs}
      />

      <RuntimePanel
        title="Realtime Logs"
      >

        <div className="space-y-4">

          {logs.map((item) => (

            <div
              key={item.material}
              className="rounded-2xl border border-zinc-800 bg-black p-4"
            >

              <div className="flex items-center justify-between">

                <div>

                  <div className="font-bold text-white">
                    {item.material}
                  </div>

                  <div className="mt-1 text-xs text-zinc-500">
                    {item.type}
                  </div>

                </div>

                <div className="text-2xl font-black text-cyan-400">
                  {item.qty}
                </div>

              </div>

            </div>

          ))}

        </div>

      </RuntimePanel>

    </EnterpriseModulePage>
  )
}
