import {
  Navigate,
  Route,
  Routes,
} from 'react-router-dom'

import { DashboardPage } from '@/modules/dashboard/pages/DashboardPage'
import { InventoryOverviewPage } from '@/modules/inventory/pages/tabs/InventoryOverviewPage'
import { InventoryMaterialsPage } from '@/modules/inventory/pages/tabs/InventoryMaterialsPage'
import { InventoryLocationsPage } from '@/modules/inventory/pages/tabs/InventoryLocationsPage'
import { InventoryTransactionsPage } from '@/modules/inventory/pages/tabs/InventoryTransactionsPage'
import { MaterialDetailPage } from '@/modules/inventory/pages/MaterialDetailPage'
import { ProductionPage } from '@/modules/production/pages/ProductionPage'
import { QcPage } from '@/modules/qc/pages/QcPage'
import { ProjectsPage } from '@/modules/projects/pages/ProjectsPage'
import { ProcurementPage } from '@/modules/procurement/pages/ProcurementPage'
import { AnalyticsPage } from '@/modules/analytics/pages/AnalyticsPage'
import { CommandCenterPage } from '@/modules/command-center/pages/CommandCenterPage'
import { DigitalTwinPage } from '@/modules/digital-twin/pages/DigitalTwinPage'
import { CopilotPage } from '@/modules/copilot/pages/CopilotPage'
import { WorkflowPage } from '@/modules/workflow/pages/WorkflowPage'
import { FederationPage } from '@/modules/federation/pages/FederationPage'
import { KernelPage } from '@/modules/kernel/pages/KernelPage'
import { MarketplacePage } from '@/modules/marketplace/pages/MarketplacePage'
import { IntelligencePage } from '@/modules/intelligence/pages/IntelligencePage'
import { AutonomousPage } from '@/modules/autonomous/pages/AutonomousPage'
import { SimulationUniversePage } from '@/modules/simulation-universe/pages/SimulationUniversePage'
import { NexusPage } from '@/modules/nexus/pages/NexusPage'
import { MaterialMovementsPage } from '@/modules/material-movements/pages/MaterialMovementsPage'
import { YardPage } from '@/modules/yard/pages/YardPage'
import { SuppliersPage } from '@/modules/suppliers/pages/SuppliersPage'
import { InventoryInboundPage } from '@/modules/inventory/pages/tabs/InventoryInboundPage'
import {
  InventoryOutboundPage,
} from '@/modules/inventory/pages/tabs/InventoryOutboundPage'
import {
  InventoryMasterDataPage,
} from '@/modules/inventory/pages/tabs/InventoryMasterDataPage'
import {
  InventoryAuditPage,
} from '@/modules/inventory/pages/tabs/InventoryAuditPage'
import {
  InventoryTransferPage,
} from '@/modules/inventory/pages/tabs/InventoryTransferPage'
import {
  InventoryStockTakePage,
} from '@/modules/inventory/pages/tabs/InventoryStockTakePage'
import {
  InventoryAdjustmentsPage,
} from '@/modules/inventory/pages/tabs/InventoryAdjustmentsPage'
import {
  InventoryAlertsPage,
} from '@/modules/inventory/pages/tabs/InventoryAlertsPage'
import { ComponentsPage } from '@/modules/components/pages/ComponentsPage'
import { ComponentsProductionPage } from '@/modules/components/pages/tabs/ComponentsProductionPage'
import { ComponentsStockPage } from '@/modules/components/pages/tabs/ComponentsStockPage'
import { ComponentsMaterialStockPage } from '@/modules/components/pages/tabs/ComponentsMaterialStockPage'
import { ComponentsTransfersPage } from '@/modules/components/pages/tabs/ComponentsTransfersPage'
import { ComponentsInternalQcPage } from '@/modules/components/pages/tabs/ComponentsInternalQcPage'
import { ComponentsHistoryPage } from '@/modules/components/pages/tabs/ComponentsHistoryPage'
import { SettingsPage } from '@/modules/settings/pages/SettingsPage'
import { UsersPage } from '@/modules/users/pages/UsersPage'
import { RolesPage } from '@/modules/roles/pages/RolesPage'
import { SystemLogsWorkspace } from '@/modules/system-logs/workspaces/SystemLogsWorkspace'

export function AppRouter() {
  return (
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
      <Route path="/production/material-issues" element={<ProductionPage />} />
      <Route path="/production/logs" element={<ProductionPage />} />

      <Route
        path="/qc"
        element={<QcPage />}
      />

      <Route
        path="/projects"
        element={<ProjectsPage />}
      />

      <Route
        path="/procurement"
        element={<ProcurementPage />}
      />

      <Route
        path="/yard"
        element={<YardPage />}
      />

      <Route
        path="/suppliers"
        element={<SuppliersPage />}
      />

      <Route
        path="/components"
        element={<ComponentsPage />}
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
  )
}
