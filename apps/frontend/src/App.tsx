import {
  BrowserRouter,
  Routes,
  Route,
} from 'react-router-dom'

import { AppLayout } from './layouts/AppLayout'

import { DashboardPage } from './pages/dashboard/DashboardPage'
import { ProjectsPage } from './pages/projects/ProjectsPage'
import { InventoryPage } from './pages/inventory/InventoryPage'
import { SuppliersPage } from './pages/suppliers/SuppliersPage'
import { ReportsPage } from './pages/reports/ReportsPage'

function App() {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route
            path="/"
            element={<DashboardPage />}
          />

          <Route
            path="/projects"
            element={<ProjectsPage />}
          />

          <Route
            path="/inventory"
            element={<InventoryPage />}
          />

          <Route
            path="/suppliers"
            element={<SuppliersPage />}
          />

          <Route
            path="/reports"
            element={<ReportsPage />}
          />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  )
}

export default App
