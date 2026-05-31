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
  SectionHeader,
  RuntimePanel,
} from '../../../../shared/ui/enterprise'

import {
  MaterialTable,
} from '../../components/material-table/MaterialTable'

import {
  MaterialDrawer,
} from '../../components/material-table/MaterialDrawer'

export function InventoryMaterialsPage() {

  const [open, setOpen] =
    useState(false)
  const [selectedMaterial, setSelectedMaterial] =
  useState<any | null>(null)

  return (

    <EnterpriseModulePage>

      <MaterialDrawer
        open={open}
        material={selectedMaterial}
        onClose={() => {

          setOpen(false)

          setSelectedMaterial(null)

        }}
      />

      <SectionHeader
        title="Materials Runtime"
        description="Realtime material management and warehouse visibility."
      />

      <EnterpriseTabBar
        tabs={inventoryTabs}
      />

      <div className="mb-4 flex justify-end">

        <button
          onClick={() => {

            setSelectedMaterial(null)

            setOpen(true)

          }}
          className="
            rounded-xl
            bg-cyan-500
            px-4
            py-3
            text-sm
            font-medium
            text-black
          "
        >
          Create Material
        </button>

      </div>

      <RuntimePanel
        title="Materials Inventory"
      >

        <MaterialTable
          onEdit={(item) => {

            setSelectedMaterial(item)

            setOpen(true)

          }}
        />

      </RuntimePanel>

    </EnterpriseModulePage>
  )
}