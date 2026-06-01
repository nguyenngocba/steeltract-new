import {
  EnterpriseModulePage,
} from '../../../../shared/runtime-tabs/EnterpriseModulePage'
import {
  EnterpriseTabBar,
} from '../../../../shared/runtime-tabs/EnterpriseTabBar'
import {
  RuntimePanel,
  SectionHeader,
} from '../../../../shared/ui/enterprise'
import {
  inventoryTabs,
} from '../../config/inventory-tabs'
import {
  useInventoryAudit,
} from '../../hooks/useInventoryAudit'

export function InventoryAuditPage() {
  const {
    data = [],
    isLoading,
  } = useInventoryAudit()

  return (
    <EnterpriseModulePage>
      <SectionHeader
        title="Inventory Audit"
        description="Current stock, average cost, inventory value and last movement per material."
      />

      <EnterpriseTabBar tabs={inventoryTabs} />

      <RuntimePanel title="Inventory Audit Table">
        <div className="overflow-hidden rounded-2xl border border-zinc-800">
          <table className="w-full">
            <thead className="bg-zinc-950">
              <tr>
                <th className="px-4 py-3 text-left text-xs uppercase text-zinc-500">
                  Material Code
                </th>
                <th className="px-4 py-3 text-left text-xs uppercase text-zinc-500">
                  Material Name
                </th>
                <th className="px-4 py-3 text-left text-xs uppercase text-zinc-500">
                  Current Stock
                </th>
                <th className="px-4 py-3 text-left text-xs uppercase text-zinc-500">
                  Average Cost
                </th>
                <th className="px-4 py-3 text-left text-xs uppercase text-zinc-500">
                  Inventory Value
                </th>
                <th className="px-4 py-3 text-left text-xs uppercase text-zinc-500">
                  Last Movement Date
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-6 text-center text-zinc-400"
                  >
                    Loading audit data...
                  </td>
                </tr>
              )}

              {!isLoading &&
                data.map((row: any) => (
                  <tr
                    key={row.materialId}
                    className="border-t border-zinc-800 hover:bg-zinc-900/40"
                  >
                    <td className="px-4 py-3 text-cyan-400">
                      {row.materialCode}
                    </td>
                    <td className="px-4 py-3 text-white">
                      {row.materialName}
                    </td>
                    <td className="px-4 py-3 text-zinc-200">
                      {Number(
                        row.currentStock ?? 0,
                      ).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-zinc-200">
                      {Number(
                        row.averageCost ?? 0,
                      ).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-zinc-200">
                      {Number(
                        row.inventoryValue ?? 0,
                      ).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-zinc-400">
                      {row.lastMovementDate
                        ? new Date(
                            row.lastMovementDate,
                          ).toLocaleString()
                        : '-'}
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
