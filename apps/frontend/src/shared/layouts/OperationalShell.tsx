import { ReactNode } from 'react'

import { AppSidebar } from '@/app/shell/sidebar/AppSidebar'

type Props = {
  children: ReactNode
}

export function OperationalShell({
  children,
}: Props) {
  return (
    <div className="flex min-h-screen bg-black">
      <AppSidebar />

      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}