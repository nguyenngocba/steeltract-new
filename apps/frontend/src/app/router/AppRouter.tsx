import { Routes, Route }
from 'react-router-dom'

import { InventoryPage }
from '../../modules/inventory/pages/InventoryPage'

import { ComponentsPage }
from '../../modules/components-module/pages/ComponentsPage'

import { YardPage }
from '../../modules/yard-module/pages/YardPage'

export function AppRouter() {

  return (

    <Routes>

      <Route
        path="/"
        element={<InventoryPage />}
      />

      <Route
        path="/inventory"
        element={<InventoryPage />}
      />

      <Route
        path="/components"
        element={<ComponentsPage />}
      />

      <Route
        path="/yard"
        element={<YardPage />}
      />

    </Routes>
  )
}