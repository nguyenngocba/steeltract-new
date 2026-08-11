import React, { createContext, useContext, useState, type ReactNode } from 'react'
import { Plus } from 'lucide-react'
import { ActionGuard } from '@/shared/permissions/PermissionGuard'

export interface QCActionContextType {
  openCreateInspection: () => void
  closeCreateInspection: () => void
  createDialogOpen: boolean
}

const QCActionContext = createContext<QCActionContextType | null>(null)

export function useQCActions(): QCActionContextType {
  const ctx = useContext(QCActionContext)
  if (!ctx) {
    return {
      openCreateInspection: () => {},
      closeCreateInspection: () => {},
      createDialogOpen: false,
    }
  }
  return ctx
}

export function QCActionProvider({ children }: { children: ReactNode }) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  const openCreateInspection = () => setCreateDialogOpen(true)
  const closeCreateInspection = () => setCreateDialogOpen(false)

  return (
    <QCActionContext.Provider
      value={{
        openCreateInspection,
        closeCreateInspection,
        createDialogOpen,
      }}
    >
      {children}
    </QCActionContext.Provider>
  )
}

export function QCGlobalActionBar() {
  const { openCreateInspection } = useQCActions()

  return (
    <ActionGuard permission="qc.inspect"><button
      type="button"
      onClick={openCreateInspection}
      className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500"
    >
      <Plus size={14} />
      <span>Tạo phiếu kiểm tra cấu kiện</span>
    </button></ActionGuard>
  )
}
