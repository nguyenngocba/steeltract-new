import { useState } from 'react'

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
useCategories,
} from '../../hooks/useCategories'

import {
useUnits,
} from '../../hooks/useUnits'

import {
useZones,
} from '../../hooks/useZones'

import {
useMaterialTypes,
} from '../../hooks/useMaterialTypes'

import {
AddCategoryModal,
} from '../../components/AddCategoryModal'

import {
  AddMaterialTypeModal,
} from '../../components/AddMaterialTypeModal'

export function InventoryMasterDataPage() {

const [openAddCategory, setOpenAddCategory] =
useState(false)

const [
  openAddMaterialType,
  setOpenAddMaterialType,
] = useState(false)

const {
data: categories = [],
} = useCategories()

const {
data: units = [],
} = useUnits()

const {
data: zones = [],
} = useZones()

const {
data: materialTypes = [],
} = useMaterialTypes()

return (

<EnterpriseModulePage>

  <AddCategoryModal
    open={openAddCategory}
    onClose={() =>
      setOpenAddCategory(false)
    }
  />
  <AddMaterialTypeModal
    open={openAddMaterialType}
    onClose={() =>
      setOpenAddMaterialType(false)
    }
  />

  <SectionHeader
    title="Inventory Master Data"
    description="Categories, Material Types, Units and Warehouse Zones"
  />

  <EnterpriseTabBar
    tabs={inventoryTabs}
  />

  <div
    className="
      grid
      grid-cols-1
      lg:grid-cols-4
      gap-6
    "
  >

    <RuntimePanel
      title="Categories"
    >
      <div className="mb-4 flex justify-end">

        <button
          onClick={() =>
            setOpenAddCategory(true)
          }
          className="
            rounded-xl
            bg-cyan-500
            px-3
            py-2
            text-xs
            font-semibold
            text-black
          "
        >
          + Add
        </button>

      </div>

      <div className="space-y-2">

        {categories.length === 0 && (

          <div className="text-zinc-500">
            No categories
          </div>

        )}

        {categories.map(
          (item: any) => (

            <div
              key={item.id}
              className="
                rounded-xl
                border
                border-zinc-800
                bg-black
                p-3
              "
            >
              <div className="font-semibold text-white">
                {item.name}
              </div>

              <div className="text-xs text-zinc-500">
                {item.code}
              </div>
            </div>
          ),
        )}

      </div>

    </RuntimePanel>

    <RuntimePanel
      title="Material Types"
    >

      <div className="mb-4 flex justify-end">

        <button
          onClick={() =>
            setOpenAddMaterialType(true)
          }
          className="
            rounded-xl
            bg-cyan-500
            px-3
            py-2
            text-xs
            font-semibold
            text-black
          "
        >
          + Add
        </button>

      </div>

      <div className="space-y-2">

        {materialTypes.length === 0 && (

          <div className="text-zinc-500">
            No material types
          </div>

        )}

        {materialTypes.map(
          (item: any) => (

            <div
              key={item.id}
              className="
                rounded-xl
                border
                border-zinc-800
                bg-black
                p-3
              "
            >

              <div className="font-semibold text-white">
                {item.name}
              </div>

              <div className="text-xs text-zinc-500">
                {item.code}
              </div>

              <div className="text-xs text-cyan-400">
                {item.category?.name}
              </div>

            </div>
          ),
        )}

      </div>

    </RuntimePanel>

    <RuntimePanel
      title="Units"
    >

      <div className="space-y-2">

        {units.length === 0 && (

          <div className="text-zinc-500">
            No units
          </div>

        )}

        {units.map(
          (item: any) => (

            <div
              key={item.id}
              className="
                rounded-xl
                border
                border-zinc-800
                bg-black
                p-3
              "
            >
              <div className="font-semibold text-white">
                {item.code}
              </div>

              <div className="text-xs text-zinc-500">
                {item.name}
              </div>
            </div>
          ),
        )}

      </div>

    </RuntimePanel>

    <RuntimePanel
      title="Zones"
    >

      <div className="space-y-2">

        {zones.length === 0 && (

          <div className="text-zinc-500">
            No zones
          </div>

        )}

        {zones.map(
          (item: any) => (

            <div
              key={item.id}
              className="
                rounded-xl
                border
                border-zinc-800
                bg-black
                p-3
              "
            >
              <div className="font-semibold text-white">
                {item.name}
              </div>

              <div className="text-xs text-zinc-500">
                {item.code}
              </div>
            </div>
          ),
        )}

      </div>

    </RuntimePanel>

  </div>

</EnterpriseModulePage>

)
}
