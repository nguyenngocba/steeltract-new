import {
  Route,
  Routes,
} from 'react-router-dom'

import {
  EnterpriseRuntimeLayout,
} from '../../shared/layout/runtime/EnterpriseRuntimeLayout'

import {
  PermissionGuard,
} from '../../shared/auth/PermissionGuard'

import {
  ModulePlaceholder,
} from '../../shared/runtime/ModulePlaceholder'

/* INVENTORY */
import {
  InventoryPage,
} from '../../modules/inventory/pages/InventoryPage'

import {
  InventoryMaterialsPage,
} from '../../modules/inventory/pages/tabs/InventoryMaterialsPage'

import {
  InventoryTransactionsPage,
} from '../../modules/inventory/pages/tabs/InventoryTransactionsPage'

import {
  InventoryRuntimeGridPage,
} from '../../modules/inventory/pages/InventoryRuntimeGridPage'



import {
  YardPage,
} from '../../modules/yard/pages/YardPage'


/* COMPONENTS */


/* PRODUCTION */




import {
  ProjectsPage,
} from '../../modules/projects/pages/ProjectsPage'

import {
  SuppliersPage,
} from '../../modules/suppliers/pages/SuppliersPage'

import {
  MasterDataPage,
} from '../../modules/master-data/pages/MasterDataPage'

import {
  SettingsPage,
} from '../../modules/settings/pages/SettingsPage'




import {
  ComponentsPage,
} from '../../modules/components/pages/ComponentsPage'

import {
} from '../../modules/yard/pages/YardPage'


export function AppRouter() {

  return (

    <Routes>

      <Route
        element={
          <EnterpriseRuntimeLayout />
        }
      >

        {/* HOME */}
        <Route
          path="/"
          element={
            <InventoryPage />
          }
        />

        {/* INVENTORY */}
        <Route
          path="/inventory"
          element={
            <InventoryPage />
          }
        />

        <Route
          path="/inventory/materials"
          element={
            <InventoryMaterialsPage />
          }
        />

        <Route
          path="/inventory/transactions"
          element={
            <InventoryTransactionsPage />
          }
        />

        {/* YARD */}
        <Route
          path="/yard"
          element={
            <YardPage />
          }
        />

        {

/* COMPONENTS */}
        <Route
          path="/components"
          element={
            <ComponentsPage />
          }
        />

        {/* PRODUCTION */}
        <Route
          path="/production/orders"
          element={
            <ModulePlaceholder
              title="PRODUCTION"
              subtitle="Runtime sản xuất / Production Runtime"
            />
          }
        />

        {/* QC */}
        <Route
          path="/qc/incoming"
          element={
            <ModulePlaceholder
              title="QC"
              subtitle="Quality Control Runtime"
            />
          }
        />

        {/* ADVANCED RUNTIME */}
        <Route
          path="/runtime/inventory-grid"
          element={
            <InventoryRuntimeGridPage />
          }
        />

        {/* ADMIN */}
        <Route
          path="/admin/users"
          element={
            <PermissionGuard>

              <ModulePlaceholder
                title="ADMIN"
                subtitle="System Administration Runtime"
              />

            </PermissionGuard>
          }
        />

      </Route>

    </Routes>
  )
}