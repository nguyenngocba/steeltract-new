import {
  Routes,
  Route,
} from 'react-router-dom'

import { AppLayout } from './layouts/AppLayout'

import { DashboardPage } from './pages/dashboard/DashboardPage'
import { ProjectsPage } from './pages/projects/ProjectsPage'
import { InventoryPage } from './pages/inventory/InventoryPage'
import { SuppliersPage } from './pages/suppliers/SuppliersPage'
import { ReportsPage } from './pages/reports/ReportsPage'
import { LoginPage } from './pages/login/LoginPage'
import { ComponentsPage } from './pages/components/ComponentsPage'
import { ComponentDetailPage } from './pages/component-detail/ComponentDetailPage'
import { TransactionsPage } from './pages/transactions/TransactionsPage'
import { YardMapPage } from './pages/yard-map/YardMapPage'
import { AuthProvider } from './providers/AuthProvider'
import { ProtectedRoute } from './routes/ProtectedRoute'
import { ProjectDetailPage } from './pages/project-detail/ProjectDetailPage'
import { ProjectFloorMapPage } from './pages/project-detail/ProjectFloorMapPage'
import { SchedulePage } from './pages/schedule/SchedulePage'
import { QrScanPage } from './pages/qr-scan/QrScanPage'
import { TasksPage } from './pages/tasks/TasksPage'
import { AttendancePage } from './pages/attendance/AttendancePage'
import { ExecutiveDashboardPage } from './pages/executive/ExecutiveDashboardPage'
import { ProcurementPage } from './pages/procurement/ProcurementPage'
import { OcrPage } from './pages/ocr/OcrPage'
import { BoqPage } from './pages/boq/BoqPage'
import { AnomaliesPage } from './pages/anomalies/AnomaliesPage'
import { EquipmentPage } from './pages/equipment/EquipmentPage'
import { WorkersPage } from './pages/workers/WorkersPage'
import { ZonesPage } from './pages/zones/ZonesPage'
import { SiteLogsPage } from './pages/site-logs/SiteLogsPage'
import { SafetyPage } from './pages/safety/SafetyPage'
import { VehiclesPage } from './pages/vehicles/VehiclesPage'
import { MaterialRequestsPage } from './pages/material-requests/MaterialRequestsPage'
import { ApprovalsPage } from './pages/approvals/ApprovalsPage'
import { PurchaseOrdersPage } from './pages/purchase-orders/PurchaseOrdersPage'
import { AnalyticsPage } from './pages/analytics/AnalyticsPage'

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Login */}
        <Route
          path="/login"
          element={<LoginPage />}
        />

        {/* Protected App */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Routes>
                  <Route
                    path="/"
                    element={
                      <DashboardPage />
                    }
                  />

                  <Route
                    path="/projects"
                    element={
                      <ProjectsPage />
                    }
                  />

                  <Route
                    path="/projects/:id"
                    element={
                      <ProjectDetailPage />
                    }
                  />

                  <Route
                    path="/projects/:id/floor-map"
                    element={
                      <ProjectFloorMapPage />
                    }
                  />
                  <Route
                    path="/zones"
                    element={<ZonesPage />}
                  />
                  <Route
                    path="/qr-scan"
                    element={<QrScanPage />}
                  />

                  <Route
                    path="/attendance"
                    element={<AttendancePage />}
                  />

                  <Route
                    path="/tasks"
                    element={<TasksPage />}
                  />
                  
                  <Route
                    path="/executive"
                    element={
                      <ExecutiveDashboardPage />
                    }
                  />
                  <Route
                    path="/purchase-orders"
                    element={
                      <PurchaseOrdersPage />
                    }
                  />
                  <Route
                    path="/procurement"
                    element={
                      <ProcurementPage />
                    }
                  />
                <Route
                  path="/vehicles"
                  element={
                    <VehiclesPage />
                  }
                />
                <Route
                  path="/analytics"
                  element={
                    <AnalyticsPage />
                  }
                />
                <Route
                  path="/material-requests"
                  element={
                    <MaterialRequestsPage />
                  }
                />
                  <Route
                    path="/schedule"
                    element={<SchedulePage />}
                  />
                  <Route
                    path="/site-logs"
                    element={
                      <SiteLogsPage />
                    }
                  />
                  <Route
                    path="/approvals"
                    element={
                      <ApprovalsPage />
                    }
                  />
                  <Route
                    path="/inventory"
                    element={
                      <InventoryPage />
                    }
                  />

                  <Route
                    path="/ocr"
                    element={<OcrPage />}
                  />
                  <Route
                    path="/boq"
                    element={<BoqPage />}
                  />
                  <Route
                    path="/equipment"
                    element={
                      <EquipmentPage />
                    }
                  />
                  <Route
                    path="/anomalies"
                    element={
                      <AnomaliesPage />
                    }
                  />
                  <Route
                    path="/workers"
                    element={
                      <WorkersPage />
                    }
                  />
                  <Route
                    path="/safety"
                    element={
                      <SafetyPage />
                    }
                  />
                  <Route
                    path="/components"
                    element={
                      <ComponentsPage />
                    }
                  />

                  <Route
                    path="/components/:id"
                    element={
                      <ComponentDetailPage />
                    }
                  />

                  <Route
                    path="/transactions"
                    element={
                      <TransactionsPage />
                    }
                  />
                  <Route
                    path="/yard-map"
                    element={<YardMapPage />}
                  />

                  <Route
                    path="/suppliers"
                    element={
                      <SuppliersPage />
                    }
                  />

                  <Route
                    path="/reports"
                    element={
                      <ReportsPage />
                    }
                  />
                </Routes>
              </AppLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  )
}

export default App