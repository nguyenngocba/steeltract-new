import {
  Suspense,
  lazy,
} from 'react'
import {
  Routes,
  Route,
} from 'react-router-dom'

import { AppLayout } from './layouts/AppLayout'
import { AuthProvider } from './providers/AuthProvider'
import { ProtectedRoute } from './routes/ProtectedRoute'

const DashboardPage = lazy(() =>
  import('./pages/dashboard/DashboardPage').then(
    (module) => ({
      default: module.DashboardPage,
    }),
  ),
)
const ProjectsPage = lazy(() =>
  import('./pages/projects/ProjectsPage').then(
    (module) => ({
      default: module.ProjectsPage,
    }),
  ),
)
const InventoryPage = lazy(() =>
  import('./pages/inventory/InventoryPage').then(
    (module) => ({
      default: module.InventoryPage,
    }),
  ),
)
const SuppliersPage = lazy(() =>
  import('./pages/suppliers/SuppliersPage').then(
    (module) => ({
      default: module.SuppliersPage,
    }),
  ),
)
const ReportsPage = lazy(() =>
  import('./pages/reports/ReportsPage').then(
    (module) => ({
      default: module.ReportsPage,
    }),
  ),
)
const LoginPage = lazy(() =>
  import('./pages/login/LoginPage').then(
    (module) => ({
      default: module.LoginPage,
    }),
  ),
)
const ComponentsPage = lazy(() =>
  import('./pages/components/ComponentsPage').then(
    (module) => ({
      default: module.ComponentsPage,
    }),
  ),
)
const ComponentDetailPage = lazy(() =>
  import(
    './pages/component-detail/ComponentDetailPage'
  ).then((module) => ({
    default: module.ComponentDetailPage,
  })),
)
const TransactionsPage = lazy(() =>
  import(
    './pages/transactions/TransactionsPage'
  ).then((module) => ({
    default: module.TransactionsPage,
  })),
)
const YardMapPage = lazy(() =>
  import('./pages/yard-map/YardMapPage').then(
    (module) => ({
      default: module.YardMapPage,
    }),
  ),
)
const ProjectDetailPage = lazy(() =>
  import(
    './pages/project-detail/ProjectDetailPage'
  ).then((module) => ({
    default: module.ProjectDetailPage,
  })),
)
const ProjectFloorMapPage = lazy(() =>
  import(
    './pages/project-detail/ProjectFloorMapPage'
  ).then((module) => ({
    default: module.ProjectFloorMapPage,
  })),
)
const SchedulePage = lazy(() =>
  import('./pages/schedule/SchedulePage').then(
    (module) => ({
      default: module.SchedulePage,
    }),
  ),
)
const QrScanPage = lazy(() =>
  import('./pages/qr-scan/QrScanPage').then(
    (module) => ({
      default: module.QrScanPage,
    }),
  ),
)
const TasksPage = lazy(() =>
  import('./pages/tasks/TasksPage').then(
    (module) => ({
      default: module.TasksPage,
    }),
  ),
)
const AttendancePage = lazy(() =>
  import(
    './pages/attendance/AttendancePage'
  ).then((module) => ({
    default: module.AttendancePage,
  })),
)
const ExecutiveDashboardPage = lazy(() =>
  import(
    './pages/executive/ExecutiveDashboardPage'
  ).then((module) => ({
    default: module.ExecutiveDashboardPage,
  })),
)
const ProcurementPage = lazy(() =>
  import(
    './pages/procurement/ProcurementPage'
  ).then((module) => ({
    default: module.ProcurementPage,
  })),
)
const OcrPage = lazy(() =>
  import('./pages/ocr/OcrPage').then(
    (module) => ({
      default: module.OcrPage,
    }),
  ),
)
const BoqPage = lazy(() =>
  import('./pages/boq/BoqPage').then(
    (module) => ({
      default: module.BoqPage,
    }),
  ),
)
const AnomaliesPage = lazy(() =>
  import(
    './pages/anomalies/AnomaliesPage'
  ).then((module) => ({
    default: module.AnomaliesPage,
  })),
)
const EquipmentPage = lazy(() =>
  import(
    './pages/equipment/EquipmentPage'
  ).then((module) => ({
    default: module.EquipmentPage,
  })),
)
const WorkersPage = lazy(() =>
  import('./pages/workers/WorkersPage').then(
    (module) => ({
      default: module.WorkersPage,
    }),
  ),
)
const ZonesPage = lazy(() =>
  import('./pages/zones/ZonesPage').then(
    (module) => ({
      default: module.ZonesPage,
    }),
  ),
)
const SiteLogsPage = lazy(() =>
  import(
    './pages/site-logs/SiteLogsPage'
  ).then((module) => ({
    default: module.SiteLogsPage,
  })),
)
const SafetyPage = lazy(() =>
  import('./pages/safety/SafetyPage').then(
    (module) => ({
      default: module.SafetyPage,
    }),
  ),
)
const VehiclesPage = lazy(() =>
  import('./pages/vehicles/VehiclesPage').then(
    (module) => ({
      default: module.VehiclesPage,
    }),
  ),
)
const MaterialRequestsPage = lazy(() =>
  import(
    './pages/material-requests/MaterialRequestsPage'
  ).then((module) => ({
    default: module.MaterialRequestsPage,
  })),
)
const ApprovalsPage = lazy(() =>
  import(
    './pages/approvals/ApprovalsPage'
  ).then((module) => ({
    default: module.ApprovalsPage,
  })),
)
const PurchaseOrdersPage = lazy(() =>
  import(
    './pages/purchase-orders/PurchaseOrdersPage'
  ).then((module) => ({
    default: module.PurchaseOrdersPage,
  })),
)
const AnalyticsPage = lazy(() =>
  import(
    './pages/analytics/AnalyticsPage'
  ).then((module) => ({
    default: module.AnalyticsPage,
  })),
)
const WarehouseOperationsPage = lazy(() =>
  import('./pages/operations').then((module) => ({
    default: module.WarehouseOperationsPage,
  })),
)
const ProductionOperationsPage = lazy(() =>
  import('./pages/operations').then((module) => ({
    default: module.ProductionOperationsPage,
  })),
)
const QcOperationsPage = lazy(() =>
  import('./pages/operations').then((module) => ({
    default: module.QcOperationsPage,
  })),
)
const YardOperationsPage = lazy(() =>
  import('./pages/operations').then((module) => ({
    default: module.YardOperationsPage,
  })),
)
const ProjectOperationsPage = lazy(() =>
  import('./pages/operations').then((module) => ({
    default: module.ProjectOperationsPage,
  })),
)
const SupplierManagementPage = lazy(() =>
  import('./pages/operations').then((module) => ({
    default: module.SupplierManagementPage,
  })),
)
const ProcurementOperationsPage = lazy(() =>
  import('./pages/operations').then((module) => ({
    default: module.ProcurementOperationsPage,
  })),
)
const WorkflowOperationsPage = lazy(() =>
  import('./pages/operations').then((module) => ({
    default: module.WorkflowOperationsPage,
  })),
)
const AdministrationOperationsPage = lazy(() =>
  import('./pages/operations').then((module) => ({
    default: module.AdministrationOperationsPage,
  })),
)

function RouteLoading() {
  return (
    <div className="flex min-h-64 items-center justify-center text-sm text-zinc-400">
      Loading workspace...
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<RouteLoading />}>
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
                    path="/operations/projects"
                    element={
                      <ProjectOperationsPage />
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
                    path="/operations/procurement"
                    element={
                      <ProcurementOperationsPage />
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
                    path="/operations/workflow"
                    element={
                      <WorkflowOperationsPage />
                    }
                  />
                  <Route
                    path="/inventory"
                    element={
                      <InventoryPage />
                    }
                  />
                  <Route
                    path="/operations/inventory"
                    element={
                      <InventoryPage />
                    }
                  />
                  <Route
                    path="/operations/warehouse"
                    element={
                      <WarehouseOperationsPage />
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
                    path="/operations/production"
                    element={
                      <ProductionOperationsPage />
                    }
                  />
                  <Route
                    path="/operations/qc"
                    element={
                      <QcOperationsPage />
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
                    path="/operations/yard"
                    element={
                      <YardOperationsPage />
                    }
                  />

                  <Route
                    path="/suppliers"
                    element={
                      <SuppliersPage />
                    }
                  />
                  <Route
                    path="/operations/suppliers"
                    element={
                      <SupplierManagementPage />
                    }
                  />
                  <Route
                    path="/operations/administration"
                    element={
                      <AdministrationOperationsPage />
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
      </Suspense>
    </AuthProvider>
  )
}

export default App
