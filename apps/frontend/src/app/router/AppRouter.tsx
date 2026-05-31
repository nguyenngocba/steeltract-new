import {
  Navigate,
  Route,
  Routes,
} from 'react-router-dom'

import { DashboardPage } from '@/modules/dashboard/pages/DashboardPage'
import { InventoryPage } from '@/modules/inventory/pages/InventoryPage'
import { InventoryMaterialsPage } from '@/modules/inventory/pages/tabs/InventoryMaterialsPage'
import { InventoryTransactionsPage } from '@/modules/inventory/pages/tabs/InventoryTransactionsPage'
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
import { InventoryInboundPage } from '@/modules/inventory/pages/tabs/InventoryInboundPage'
import {
  InventoryOutboundPage,
} from '@/modules/inventory/pages/tabs/InventoryOutboundPage'
import {
  InventoryMasterDataPage,
} from '@/modules/inventory/pages/tabs/InventoryMasterDataPage'

export function AppRouter() {
  return (
    <Routes>
      <Route
        path="/"
        element={<DashboardPage />}
      />

      <Route
        path="/inventory"
        element={<InventoryPage />}
      />

      <Route
        path="/inventory/materials"
        element={
          <InventoryMaterialsPage />
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
        path="/inventory/master-data"
        element={
          <InventoryMasterDataPage />
        }
      />

      <Route
        path="/production"
        element={<ProductionPage />}
      />

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
        path="*"
        element={<Navigate to="/" replace />}
      />
    </Routes>
  )
}
