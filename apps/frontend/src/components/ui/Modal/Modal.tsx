import type { ReactNode } from 'react'

import { ModalShell } from '../../ui-system'

interface ModalProps {
  open: boolean
  title: string
  children: ReactNode
  onClose: () => void
}

export function Modal({
  open,
  title,
  children,
  onClose,
}: ModalProps) {
  return (
    <ModalShell
      open={open}
      title={title}
      onClose={onClose}
    >
      {children}
    </ModalShell>
  )
}
