import type {
  ReactNode,
} from 'react'

import {
  WorkspaceShell,
} from '../modules/navigation'

interface AppLayoutProps {
  children: ReactNode
}

export function AppLayout({
  children,
}: AppLayoutProps) {
  return (
    <WorkspaceShell>
      {children}
    </WorkspaceShell>
  )
}
