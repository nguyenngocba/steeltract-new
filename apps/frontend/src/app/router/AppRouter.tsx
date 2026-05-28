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

/* YARD */
import {
  YardPage,
} from '../../modules/yard-module/pages/YardPage'

/* COMPONENTS */
import {
  ComponentsRuntimeGridPage,
} from '../../modules/components-module/pages/ComponentsRuntimeGridPage'

/* PRODUCTION */
import {
  ProductionRuntimeGridPage,
} from '../../modules/production-module/pages/ProductionRuntimeGridPage'

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

        {/* COMPONENTS */}
        <Route
          path="/components"
          element={
            <ModulePlaceholder
              title="COMPONENTS"
              subtitle="Quản lý cấu kiện / Component Runtime"
            />
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

        <Route
          path="/runtime/components-grid"
          element={
            <ComponentsRuntimeGridPage />
          }
        />

        <Route
          path="/runtime/production-grid"
          element={
            <ProductionRuntimeGridPage />
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