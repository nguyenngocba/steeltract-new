import {
  Routes,
  Route,
} from 'react-router-dom'

import { EnterpriseRuntimeLayout }
from '../../shared/layout/runtime/EnterpriseRuntimeLayout'

import { ExecutiveCommandCenterPage }
from '../../modules/executive-module/pages/ExecutiveCommandCenterPage'

import { InventoryPage }
from '../../modules/inventory/pages/InventoryPage'

import { YardPage }
from '../../modules/yard-module/pages/YardPage'

/* COMPONENTS */
import { ComponentsLayout }
from '../../modules/components-module/layout/ComponentsLayout'

import { ComponentsOverviewPage }
from '../../modules/components-module/pages/ComponentsOverviewPage'

import { FabricationPage }
from '../../modules/components-module/pages/FabricationPage'

import { WeldingPage }
from '../../modules/components-module/pages/WeldingPage'

import { PaintingPage }
from '../../modules/components-module/pages/PaintingPage'

import { AssemblyPage }
from '../../modules/components-module/pages/AssemblyPage'

import { ShippingPage }
from '../../modules/components-module/pages/ShippingPage'

import { ComponentQcPage }
from '../../modules/components-module/pages/ComponentQcPage'

/* PRODUCTION */
import { ProductionLayout }
from '../../modules/production-module/layout/ProductionLayout'

import { ProductionOverviewPage }
from '../../modules/production-module/pages/ProductionOverviewPage'

import { WorkOrdersPage }
from '../../modules/production-module/pages/WorkOrdersPage'

import { MachinesPage }
from '../../modules/production-module/pages/MachinesPage'

import { OperatorsPage }
from '../../modules/production-module/pages/OperatorsPage'

import { SchedulesPage }
from '../../modules/production-module/pages/SchedulesPage'

import { TelemetryPage }
from '../../modules/production-module/pages/TelemetryPage'

/* QC */
import { QcLayout }
from '../../modules/qc-module/layout/QcLayout'

import { IncomingQcPage }
from '../../modules/qc-module/pages/IncomingQcPage'

import { WeldingQcPage }
from '../../modules/qc-module/pages/WeldingQcPage'

import { PaintingQcPage }
from '../../modules/qc-module/pages/PaintingQcPage'

import { NcrPage }
from '../../modules/qc-module/pages/NcrPage'

import { DefectsPage }
from '../../modules/qc-module/pages/DefectsPage'

import { QcApprovalsPage }
from '../../modules/qc-module/pages/QcApprovalsPage'

/* LOGISTICS */
import { LogisticsLayout }
from '../../modules/logistics-module/layout/LogisticsLayout'

import { LogisticsOverviewPage }
from '../../modules/logistics-module/pages/LogisticsOverviewPage'

import { ShipmentsPage }
from '../../modules/logistics-module/pages/ShipmentsPage'

import { TruckRuntimePage }
from '../../modules/logistics-module/pages/TruckRuntimePage'

import { DispatchPage }
from '../../modules/logistics-module/pages/DispatchPage'

import { FleetTrackingPage }
from '../../modules/logistics-module/pages/FleetTrackingPage'

import { PlanningPage }
from '../../modules/logistics-module/pages/PlanningPage'

import { DigitalTwinPage }
from '../../modules/digital-twin-module/pages/DigitalTwinPage'


        {/* ADMIN */}
        <Route
          path="/admin/users"
          element={
            <AdminLayout />
          }
        >

          <Route
            index
            element={
              <UsersPage />
            }
          />

          <Route
            path="/admin/roles"
            element={
              <RolesPage />
            }
          />

          <Route
            path="/admin/audit"
            element={
              <AuditLogsPage />
            }
          />

          <Route
            path="/admin/settings"
            element={
              <SystemSettingsPage />
            }
          />

          <Route
            path="/admin/monitoring"
            element={
              <MonitoringPage />
            }
          />

        </Route>

      </Route>

        {/* PRODUCTION */}
        <Route
          path="/production/orders"
          element={
            <ProductionLayout />
          }
        >

          <Route
            index
            element={
              <ProductionOverviewPage />
            }
          />

          <Route
            path="/production/work-orders"
            element={
              <WorkOrdersPage />
            }
          />

          <Route
            path="/production/machines"
            element={
              <MachinesPage />
            }
          />

          <Route
            path="/production/operators"
            element={
              <OperatorsPage />
            }
          />

          <Route
            path="/production/schedules"
            element={
              <SchedulesPage />
            }
          />

          <Route
            path="/production/telemetry"
            element={
              <TelemetryPage />
            }
          />

        </Route>

        {/* YARD */}
        <Route
          path="/yard"
          element={
            <YardPage />
          }
        />

        {/* QC */}
        <Route
          path="/qc/incoming"
          element={
            <QcLayout />
          }
        >

          <Route
            index
            element={
              <IncomingQcPage />
            }
          />

          <Route
            path="/qc/welding"
            element={
              <WeldingQcPage />
            }
          />

          <Route
            path="/qc/painting"
            element={
              <PaintingQcPage />
            }
          />

          <Route
            path="/qc/ncr"
            element={
              <NcrPage />
            }
          />

          <Route
            path="/qc/defects"
            element={
              <DefectsPage />
            }
          />

          <Route
            path="/qc/approvals"
            element={
              <QcApprovalsPage />
            }
          />

        </Route>

        {/* LOGISTICS */}
        <Route
          path="/logistics"
          element={
            <LogisticsLayout />
          }
        >

          <Route
            index
            element={
              <LogisticsOverviewPage />
            }
          />

          <Route
            path="shipments"
            element={
              <ShipmentsPage />
            }
          />

          <Route
            path="trucks"
            element={
              <TruckRuntimePage />
            }
          />

          <Route
            path="dispatch"
            element={
              <DispatchPage />
            }
          />

          <Route
            path="fleet"
            element={
              <FleetTrackingPage />
            }
          />

          <Route
            path="planning"
            element={
              <PlanningPage />
            }
          />

        </Route>


        {/* DIGITAL TWIN */}
        <Route
          path="/digital-twin"
          element={
            <DigitalTwinPage />
          }
        />

        {
        {/* ADMIN */}
        <Route
          path="/admin/users"
          element={
            <AdminLayout />
          }
        >

          <Route
            index
            element={
              <UsersPage />
            }
          />

          <Route
            path="/admin/roles"
            element={
              <RolesPage />
            }
          />

          <Route
            path="/admin/audit"
            element={
              <AuditLogsPage />
            }
          />

          <Route
            path="/admin/settings"
            element={
              <SystemSettingsPage />
            }
          />

          <Route
            path="/admin/monitoring"
            element={
              <MonitoringPage />
            }
          />

        </Route>

      </Route>

    </Routes>
  )
}
