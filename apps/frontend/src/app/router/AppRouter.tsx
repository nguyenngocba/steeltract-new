import {
  lazy,
  Suspense,
} from 'react'
import {
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom'

import { useAuthStore } from '@/store/auth.store'
import { ModuleLoadingState } from '@/shared/ui/modules'

const lazyNamed = <T extends Record<string, any>, K extends keyof T>(
  loader: () => Promise<T>,
  exportName: K,
) => lazy(() => loader().then((module) => ({ default: module[exportName] })))

const LoginPage = lazyNamed(() => import('@/modules/auth/pages/LoginPage'), 'LoginPage')
const DashboardPage = lazyNamed(() => import('@/modules/dashboard/pages/DashboardPage'), 'DashboardPage')
const InventoryOverviewPage = lazyNamed(() => import('@/modules/inventory/pages/tabs/InventoryOverviewPage'), 'InventoryOverviewPage')
const InventoryMaterialsPage = lazyNamed(() => import('@/modules/inventory/pages/tabs/InventoryMaterialsPage'), 'InventoryMaterialsPage')
const InventoryLocationsPage = lazyNamed(() => import('@/modules/inventory/pages/tabs/InventoryLocationsPage'), 'InventoryLocationsPage')
const InventoryTransactionsPage = lazyNamed(() => import('@/modules/inventory/pages/tabs/InventoryTransactionsPage'), 'InventoryTransactionsPage')
const InventoryReturnRequestsPage = lazyNamed(() => import('@/modules/inventory/pages/tabs/InventoryReturnRequestsPage'), 'InventoryReturnRequestsPage')
const MaterialDetailPage = lazyNamed(() => import('@/modules/inventory/pages/MaterialDetailPage'), 'MaterialDetailPage')
const ProductionPage = lazyNamed(() => import('@/modules/production/pages/ProductionPage'), 'ProductionPage')
const QcPage = lazyNamed(() => import('@/modules/qc/pages/QcPage'), 'QcPage')
const ProjectsPage = lazyNamed(() => import('@/modules/projects/pages/ProjectsPage'), 'ProjectsPage')
const ProcurementPage = lazyNamed(() => import('@/modules/procurement/pages/ProcurementPage'), 'ProcurementPage')
const AnalyticsPage = lazyNamed(() => import('@/modules/analytics/pages/AnalyticsPage'), 'AnalyticsPage')
const CommandCenterPage = lazyNamed(() => import('@/modules/command-center/pages/CommandCenterPage'), 'CommandCenterPage')
const DigitalTwinPage = lazyNamed(() => import('@/modules/digital-twin/pages/DigitalTwinPage'), 'DigitalTwinPage')
const CopilotPage = lazyNamed(() => import('@/modules/copilot/pages/CopilotPage'), 'CopilotPage')
const WorkflowPage = lazyNamed(() => import('@/modules/workflow/pages/WorkflowPage'), 'WorkflowPage')
const FederationPage = lazyNamed(() => import('@/modules/federation/pages/FederationPage'), 'FederationPage')
const KernelPage = lazyNamed(() => import('@/modules/kernel/pages/KernelPage'), 'KernelPage')
const MarketplacePage = lazyNamed(() => import('@/modules/marketplace/pages/MarketplacePage'), 'MarketplacePage')
const IntelligencePage = lazyNamed(() => import('@/modules/intelligence/pages/IntelligencePage'), 'IntelligencePage')
const AutonomousPage = lazyNamed(() => import('@/modules/autonomous/pages/AutonomousPage'), 'AutonomousPage')
const SimulationUniversePage = lazyNamed(() => import('@/modules/simulation-universe/pages/SimulationUniversePage'), 'SimulationUniversePage')
const NexusPage = lazyNamed(() => import('@/modules/nexus/pages/NexusPage'), 'NexusPage')
const MaterialMovementsPage = lazyNamed(() => import('@/modules/material-movements/pages/MaterialMovementsPage'), 'MaterialMovementsPage')
const YardPage = lazyNamed(() => import('@/modules/yard/pages/YardPage'), 'YardPage')
const SuppliersPage = lazyNamed(() => import('@/modules/suppliers/pages/SuppliersPage'), 'SuppliersPage')
const InventoryInboundPage = lazyNamed(() => import('@/modules/inventory/pages/tabs/InventoryInboundPage'), 'InventoryInboundPage')
const InventoryOutboundPage = lazyNamed(() => import('@/modules/inventory/pages/tabs/InventoryOutboundPage'), 'InventoryOutboundPage')
const InventoryMasterDataPage = lazyNamed(() => import('@/modules/inventory/pages/tabs/InventoryMasterDataPage'), 'InventoryMasterDataPage')
const InventoryAuditPage = lazyNamed(() => import('@/modules/inventory/pages/tabs/InventoryAuditPage'), 'InventoryAuditPage')
const InventoryTransferPage = lazyNamed(() => import('@/modules/inventory/pages/tabs/InventoryTransferPage'), 'InventoryTransferPage')
const InventoryStockTakePage = lazyNamed(() => import('@/modules/inventory/pages/tabs/InventoryStockTakePage'), 'InventoryStockTakePage')
const InventoryAdjustmentsPage = lazyNamed(() => import('@/modules/inventory/pages/tabs/InventoryAdjustmentsPage'), 'InventoryAdjustmentsPage')
const InventoryAlertsPage = lazyNamed(() => import('@/modules/inventory/pages/tabs/InventoryAlertsPage'), 'InventoryAlertsPage')
const ComponentsPage = lazyNamed(() => import('@/modules/components/pages/ComponentsPage'), 'ComponentsPage')
const ComponentsListPage = lazyNamed(() => import('@/modules/components/pages/tabs/ComponentsListPage'), 'ComponentsListPage')
const ComponentsProductionPage = lazyNamed(() => import('@/modules/components/pages/tabs/ComponentsProductionPage'), 'ComponentsProductionPage')
const ComponentsStockPage = lazyNamed(() => import('@/modules/components/pages/tabs/ComponentsStockPage'), 'ComponentsStockPage')
const ComponentsMaterialStockPage = lazyNamed(() => import('@/modules/components/pages/tabs/ComponentsMaterialStockPage'), 'ComponentsMaterialStockPage')
const ComponentsTransfersPage = lazyNamed(() => import('@/modules/components/pages/tabs/ComponentsTransfersPage'), 'ComponentsTransfersPage')
const ComponentsInternalQcPage = lazyNamed(() => import('@/modules/components/pages/tabs/ComponentsInternalQcPage'), 'ComponentsInternalQcPage')
const ComponentsHistoryPage = lazyNamed(() => import('@/modules/components/pages/tabs/ComponentsHistoryPage'), 'ComponentsHistoryPage')
const SettingsPage = lazyNamed(() => import('@/modules/settings/pages/SettingsPage'), 'SettingsPage')
const UsersPage = lazyNamed(() => import('@/modules/users/pages/UsersPage'), 'UsersPage')
const RolesPage = lazyNamed(() => import('@/modules/roles/pages/RolesPage'), 'RolesPage')
const SystemLogsWorkspace = lazyNamed(() => import('@/modules/system-logs/workspaces/SystemLogsWorkspace'), 'SystemLogsWorkspace')
const LogisticsPage = lazyNamed(() => import('@/modules/logistics/pages/LogisticsPage'), 'LogisticsPage')
const NotificationsPage = lazyNamed(() => import('@/modules/notifications/pages/NotificationsPage'), 'NotificationsPage')

export function AppRouter() {
  const accessToken = useAuthStore((state) => state.accessToken)
  const location = useLocation()

  if (location.pathname === '/login') {
    return (
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route
            path="/login"
            element={
              accessToken ? (
                <Navigate to="/" replace />
              ) : (
                <LoginPage />
              )
            }
          />
        </Routes>
      </Suspense>
    )
  }

  if (!accessToken) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname,
        }}
      />
    )
  }

  return (
    <Suspense fallback={<RouteFallback />}>
    <Routes>
      <Route
        path="/"
        element={<DashboardPage />}
      />

      <Route
        path="/inventory"
        element={<InventoryOverviewPage />}
      />

      <Route
        path="/notifications"
        element={<NotificationsPage />}
      />

      <Route
        path="/inventory/materials"
        element={
          <InventoryMaterialsPage />
        }
      />

      <Route
        path="/inventory/materials/:id"
        element={<MaterialDetailPage />}
      />

      <Route
        path="/inventory/locations"
        element={
          <InventoryLocationsPage />
        }
      />

      <Route
        path="/inventory/inbound"
        element={
          <InventoryInboundPage />
        }
      />

      <Route
        path="/inventory/transactions"
        element={
          <InventoryTransactionsPage />
        }
      />

      <Route
        path="/inventory/returns"
        element={
          <InventoryReturnRequestsPage />
        }
      />

      <Route
        path="/inventory/outbound"
        element={
          <InventoryOutboundPage />
        }
      />

      <Route
        path="/inventory/transfer"
        element={
          <InventoryTransferPage />
        }
      />

      <Route
        path="/inventory/stock-take"
        element={
          <InventoryStockTakePage />
        }
      />

      <Route
        path="/inventory/adjustments"
        element={
          <InventoryAdjustmentsPage />
        }
      />

      <Route
        path="/inventory/alerts"
        element={
          <InventoryAlertsPage />
        }
      />

      <Route
        path="/inventory/master-data"
        element={
          <InventoryMasterDataPage />
        }
      />

      <Route
        path="/inventory/audit"
        element={
          <InventoryAuditPage />
        }
      />

      <Route
        path="/production"
        element={<ProductionPage />}
      />

      <Route path="/production/boms" element={<ProductionPage />} />
      <Route path="/production/orders" element={<ProductionPage />} />
      <Route path="/production/execution" element={<ProductionPage />} />
      <Route path="/production/reservations" element={<ProductionPage />} />
      <Route path="/production/warehouse" element={<ProductionPage />} />
      <Route path="/production/planning" element={<ProductionPage />} />
      <Route path="/production/material-ledger" element={<ProductionPage />} />
      <Route path="/production/material-issues" element={<ProductionPage />} />
      <Route path="/production/consumptions" element={<ProductionPage />} />
      <Route path="/production/incidents" element={<ProductionPage />} />
      <Route path="/production/logs" element={<ProductionPage />} />
      <Route path="/production/reports" element={<ProductionPage />} />

      <Route
        path="/qc"
        element={<QcPage />}
      />
      <Route path="/qc/inbound" element={<QcPage />} />
      <Route path="/qc/production" element={<QcPage />} />
      <Route path="/qc/final" element={<QcPage />} />
      <Route path="/qc/plan" element={<QcPage />} />
      <Route path="/qc/standards" element={<QcPage />} />
      <Route path="/qc/ncr" element={<QcPage />} />
      <Route path="/qc/capa" element={<QcPage />} />
      <Route path="/qc/calibration" element={<QcPage />} />
      <Route path="/qc/logs" element={<QcPage />} />
      <Route path="/qc/dashboard" element={<QcPage />} />
      <Route path="/qc/reports" element={<QcPage />} />

      <Route
        path="/projects"
        element={<ProjectsPage />}
      />
      <Route path="/projects/list" element={<ProjectsPage />} />
      <Route path="/projects/templates" element={<ProjectsPage />} />
      <Route path="/projects/progress" element={<ProjectsPage />} />
      <Route path="/projects/components" element={<ProjectsPage />} />
      <Route path="/projects/materials" element={<ProjectsPage />} />
      <Route path="/projects/costs" element={<ProjectsPage />} />
      <Route path="/projects/documents" element={<ProjectsPage />} />
      <Route path="/projects/logs" element={<ProjectsPage />} />
      <Route path="/projects/reports" element={<ProjectsPage />} />

      <Route
        path="/procurement"
        element={<ProcurementPage />}
      />

      <Route
        path="/yard"
        element={<YardPage />}
      />
      <Route path="/yard/map-2d" element={<YardPage />} />
      <Route path="/yard/map-3d" element={<YardPage />} />
      <Route path="/yard/locations" element={<YardPage />} />
      <Route path="/yard/components" element={<YardPage />} />
      <Route path="/yard/dispatch" element={<YardPage />} />
      <Route path="/yard/tracking" element={<YardPage />} />
      <Route path="/yard/heatmap" element={<YardPage />} />
      <Route path="/yard/timeline" element={<YardPage />} />
      <Route path="/yard/history" element={<YardPage />} />

      <Route
        path="/logistics"
        element={<LogisticsPage />}
      />

      <Route path="/logistics/planning" element={<LogisticsPage />} />
      <Route path="/logistics/vehicles" element={<LogisticsPage />} />
      <Route path="/logistics/dispatch" element={<LogisticsPage />} />
      <Route path="/logistics/tracking" element={<LogisticsPage />} />
      <Route path="/logistics/history" element={<LogisticsPage />} />
      <Route path="/logistics/logs" element={<LogisticsPage />} />
      <Route path="/logistics/reports" element={<LogisticsPage />} />

      <Route
        path="/suppliers"
        element={<SuppliersPage />}
      />
      <Route path="/suppliers/list" element={<SuppliersPage />} />
      <Route path="/suppliers/quotes" element={<SuppliersPage />} />
      <Route path="/suppliers/purchase-orders" element={<SuppliersPage />} />
      <Route path="/suppliers/deliveries" element={<SuppliersPage />} />
      <Route path="/suppliers/quality" element={<SuppliersPage />} />
      <Route path="/suppliers/payables" element={<SuppliersPage />} />
      <Route path="/suppliers/logs" element={<SuppliersPage />} />
      <Route path="/suppliers/reports" element={<SuppliersPage />} />

      <Route
        path="/components"
        element={<ComponentsPage />}
      />

      <Route
        path="/components/list"
        element={<ComponentsListPage />}
      />

      <Route
        path="/components/production"
        element={<ComponentsProductionPage />}
      />

      <Route
        path="/components/stock"
        element={<ComponentsStockPage />}
      />

      <Route
        path="/components/material-stock"
        element={<ComponentsMaterialStockPage />}
      />

      <Route
        path="/components/transfers"
        element={<ComponentsTransfersPage />}
      />

      <Route
        path="/components/qc"
        element={<ComponentsInternalQcPage />}
      />

      <Route
        path="/components/history"
        element={<ComponentsHistoryPage />}
      />

      <Route
        path="/components/reports"
        element={<ComponentsHistoryPage />}
      />

      <Route
        path="/analytics"
        element={<AnalyticsPage />}
      />

      <Route
        path="/command-center"
        element={<CommandCenterPage />}
      />

      <Route
        path="/digital-twin"
        element={<DigitalTwinPage />}
      />

      <Route
        path="/copilot"
        element={<CopilotPage />}
      />

      <Route
        path="/workflow"
        element={<WorkflowPage />}
      />

      <Route
        path="/federation"
        element={<FederationPage />}
      />

      <Route
        path="/kernel"
        element={<KernelPage />}
      />

      <Route
        path="/marketplace"
        element={<MarketplacePage />}
      />

      <Route
        path="/intelligence"
        element={<IntelligencePage />}
      />

      <Route
        path="/autonomous"
        element={<AutonomousPage />}
      />

      <Route
        path="/simulation-universe"
        element={<SimulationUniversePage />}
      />

      <Route
        path="/nexus"
        element={<NexusPage />}
      />
      
      <Route
        path="/material-movements"
        element={
          <MaterialMovementsPage />
        }
      />

      <Route
        path="/settings"
        element={<SettingsPage />}
      />

      <Route
        path="/users"
        element={<UsersPage />}
      />

      <Route
        path="/roles"
        element={<RolesPage />}
      />

      <Route
        path="/system-logs"
        element={<SystemLogsWorkspace />}
      />

      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />
    </Routes>
    </Suspense>
  )
}

function RouteFallback() {
  return (
    <div className="min-h-screen bg-[#07111f] p-6 text-slate-100">
      <ModuleLoadingState label="Đang tải module..." variant="analytics" />
    </div>
  )
}
