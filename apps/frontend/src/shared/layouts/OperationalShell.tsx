import { ReactNode } from 'react'

import { AppSidebar } from '@/app/shell/sidebar/AppSidebar'
import { AppTopbar } from '@/app/shell/topbar/AppTopbar'

type Props = {
  children: ReactNode
}

export function OperationalShell({
  children,
}: Props) {
  return (
    <div className="flex h-screen overflow-hidden bg-black">
      <AppSidebar />

      <main className="flex-1 overflow-auto">
        <AppTopbar />
        {children}
      </main>
    </div>
  )
}
