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
        title="Transaction History"
      >

        {isLoading && (
          <div className="text-zinc-400">
            Loading transactions...
          </div>
        )}

        <div className="overflow-hidden rounded-3xl border border-zinc-800">

          <table className="w-full">

            <thead className="bg-zinc-950">

              <tr>

                <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-zinc-500">
                  Transaction No
                </th>

                <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-zinc-500">
                  Type
                </th>

                <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-zinc-500">
                  Direction
                </th>

                <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-zinc-500">
                  Material
                </th>

                <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-zinc-500">
                  Date
                </th>

              </tr>

            </thead>

            <tbody>

              {logs.map((item: any) => (

                <tr
                  key={item.id}
                  className="border-t border-zinc-800 hover:bg-zinc-900"
                >

                  <td className="px-4 py-4 text-cyan-400">
                    {item.transactionNo}
                  </td>

                  <td className="px-4 py-4 text-white">
                    {item.type}
                  </td>

                  <td className="px-4 py-4">

                    <span
                      className={
                        item.direction === 'OUT'
                          ? 'text-red-400'
                          : 'text-emerald-400'
                      }
                    >
                      {item.direction}
                    </span>

                  </td>

                  <td className="px-4 py-4 text-zinc-300">
                    {item.remarks}
                  </td>

                  <td className="px-4 py-4 text-zinc-500">
                    {new Date(
                      item.createdAt,
                    ).toLocaleString()}
                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      </RuntimePanel>

    </EnterpriseModulePage>

  )
}