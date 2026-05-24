import type { ReactNode } from 'react'

import { DrawerShell } from '../../ui-system'

interface DrawerProps {
  open: boolean
  title: string
  children: ReactNode
  onClose: () => void
}

export function Drawer({
  open,
  title,
  children,
  onClose,
}: DrawerProps) {
  return (
    <DrawerShell
      open={open}
      title={title}
      onClose={onClose}
    >
      {children}
    </DrawerShell>
  )
}
