import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom'

import { LoginPage } from '../modules/auth/pages/LoginPage'

import { InventoryPage } from '../modules/inventory'
import { YardPage } from '../modules/yard'
import { ComponentsPage } from '../modules/components'

import { DashboardWorkspace } from '../modules/dashboard/workspace-ui/DashboardWorkspace'
import { UsersPage } from '../modules/users/pages/UsersPage'
import { RolesPage } from '../modules/roles/pages/RolesPage'
import { SettingsPage } from '../modules/settings/pages/SettingsPage'
import { AnalyticsPage } from '../modules/analytics/pages/AnalyticsPage'
import { NotificationsPage } from '../modules/notifications/pages/NotificationsPage'
import { AiAssistantPage } from '../modules/ai-assistant/pages/AiAssistantPage'
import { IotPage } from '../modules/iot/pages/IotPage'
import { MesPage } from '../modules/mes/pages/MesPage'
import { CmmsPage } from '../modules/cmms/pages/CmmsPage'
import { DigitalTwinPage } from '../modules/digital-twin/pages/DigitalTwinPage'
import { TrackingPage } from '../modules/tracking/pages/TrackingPage'
import { QcPage } from '../modules/qc/pages/QcPage'
import { HrmPage } from '../modules/hrm/pages/HrmPage'
import { ErpPage } from '../modules/erp/pages/ErpPage'
import { WorkflowPage } from '../modules/workflow/pages/WorkflowPage'
import { AiPage } from '../modules/ai/pages/AiPage'

import { MainLayout } from './layouts/MainLayout'

import { useAuthStore } from '../modules/auth/store/auth.store'

export function AppRouter() {
  const token =
    useAuthStore((s) => s.token)

  if (!token) {
    return <LoginPage />
  }

  return (
    <BrowserRouter>

      <Routes>

        <Route
          path="/"
          element={<MainLayout />}
        >

          <Route
            index
            element={<Navigate to="/dashboard" />}
          />

          <Route
            path="/dashboard"
            element={<DashboardWorkspace />}
          />

          <Route
            path="/inventory"
            element={<InventoryPage />}
          />

          <Route
            path="/yard"
            element={<YardPage />}
          />

          <Route
            path="/components"
            element={<ComponentsPage />}
          />

        </Route>

      </Routes>

    </BrowserRouter>
  )
}
