import { ReactNode, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

import { AppSidebar } from '@/app/shell/sidebar/AppSidebar'
import { AppTopbar } from '@/app/shell/topbar/AppTopbar'
import { ComponentsActionProvider } from '@/modules/components/context/ComponentsActionContext'
import { ProductionActionProvider } from '@/modules/production/context/ProductionActionContext'
import { PlanningActionProvider } from '@/modules/planning/context/PlanningActionContext'

type Props = {
  children: ReactNode
}

export function OperationalShell({
  children,
}: Props) {
  const location = useLocation()
  const isComponentsRoute = location.pathname.startsWith('/components')
  const isProductionRoute = location.pathname.startsWith('/production')
  const isPlanningRoute = location.pathname.startsWith('/planning')

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return window.localStorage.getItem('steeltrack-sidebar-collapsed') === 'true'
    } catch {
      return false
    }
  })

  useEffect(() => {
    window.localStorage.setItem('steeltrack-sidebar-collapsed', String(sidebarCollapsed))
  }, [sidebarCollapsed])

  const content = (
    <div className="flex h-screen overflow-hidden bg-black">
      <AppSidebar collapsed={sidebarCollapsed} onToggleCollapsed={() => setSidebarCollapsed((value) => !value)} />

      <main className="flex-1 overflow-auto">
        <AppTopbar />
        {children}
      </main>
    </div>
  )

  if (isComponentsRoute) {
    return <ComponentsActionProvider>{content}</ComponentsActionProvider>
  }

  if (isProductionRoute) {
    return <ProductionActionProvider>{content}</ProductionActionProvider>
  }

  if (isPlanningRoute) {
    return <PlanningActionProvider>{content}</PlanningActionProvider>
  }

  return content
}
