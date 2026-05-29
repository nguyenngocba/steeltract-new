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
  useInventoryTransactions,
} from '../../hooks/useInventoryTransactions'

export function InventoryTransactionsPage() {

  const {
    data: logs = [],
    isLoading,
  } = useInventoryTransactions()

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

        {isLoading && (
          <div className="text-zinc-400">
            Loading transactions...
          </div>
        )}

        <div className="space-y-4">

          {logs.map((item: any) => (

            <div
              key={item.id}
              className="rounded-2xl border border-zinc-800 bg-black p-4"
            >

              <div className="flex items-center justify-between">

                <div>

                  <div className="font-bold text-white">
                    {item.remarks || '-'}
                  </div>

                  <div className="mt-1 text-xs text-zinc-500">
                    {item.type}
                  </div>

                  <div className="mt-1 text-xs text-zinc-600">
                    {item.transactionNo}
                  </div>

                </div>

                <div className="text-right">

                  <div className="text-lg font-bold text-cyan-400">
                    {item.direction}
                  </div>

                  <div className="mt-1 text-xs text-zinc-500">
                    {new Date(
                      item.createdAt,
                    ).toLocaleString()}
                  </div>

                </div>

              </div>

            </div>

          ))}

        </div>

      </RuntimePanel>

    </EnterpriseModulePage>
  )
}