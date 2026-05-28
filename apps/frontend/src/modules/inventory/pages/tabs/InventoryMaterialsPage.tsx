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
  RuntimePanel,
} from '../../../../shared/ui/enterprise'

export function InventoryMaterialsPage() {

  return (

    <EnterpriseModulePage>

      <SectionHeader
        title="Materials Runtime"
        description="Realtime material management and warehouse visibility."
      />

      <EnterpriseTabBar
        tabs={inventoryTabs}
      />

      <RuntimePanel
        title="Materials Inventory"
      >

        <div className="overflow-hidden rounded-2xl border border-zinc-800">

          <table className="w-full text-sm">

            <thead className="bg-zinc-900">

              <tr>

                <th className="px-4 py-3 text-left">
                  Material
                </th>

                <th className="px-4 py-3 text-left">
                  Category
                </th>

                <th className="px-4 py-3 text-left">
                  Quantity
                </th>

                <th className="px-4 py-3 text-left">
                  Status
                </th>

              </tr>

            </thead>

            <tbody>

              <tr className="border-t border-zinc-800">

                <td className="px-4 py-4">
                  Steel Plate A36
                </td>

                <td className="px-4 py-4">
                  Steel
                </td>

                <td className="px-4 py-4">
                  1240
                </td>

                <td className="px-4 py-4 text-emerald-400">
                  In Stock
                </td>

              </tr>

              <tr className="border-t border-zinc-800">

                <td className="px-4 py-4">
                  Pipe DN200
                </td>

                <td className="px-4 py-4">
                  Pipe
                </td>

                <td className="px-4 py-4">
                  442
                </td>

                <td className="px-4 py-4 text-yellow-400">
                  Low Stock
                </td>

              </tr>

            </tbody>

          </table>

        </div>

      </RuntimePanel>

    </EnterpriseModulePage>
  )
}
