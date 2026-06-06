import { ReactNode, useEffect, useState } from 'react'

import { AppSidebar } from '@/app/shell/sidebar/AppSidebar'
import { AppTopbar } from '@/app/shell/topbar/AppTopbar'

type Props = {
  children: ReactNode
}

export function OperationalShell({
  children,
}: Props) {
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

  return (
    <div className="flex h-screen overflow-hidden bg-black">
      <AppSidebar collapsed={sidebarCollapsed} onToggleCollapsed={() => setSidebarCollapsed((value) => !value)} />

      <main className="flex-1 overflow-auto">
        <AppTopbar />
        {children}
      </main>
    </div>
  )
}
