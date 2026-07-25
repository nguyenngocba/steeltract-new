import React, { createContext, useContext, useState, type ReactNode } from 'react'
import { Plus } from 'lucide-react'

export interface DispatchActionContextType {
  openCreateDispatch: () => void
  closeCreateDispatch: () => void
  createDialogOpen: boolean
}

const DispatchActionContext = createContext<DispatchActionContextType | null>(null)

export function useDispatchActions(): DispatchActionContextType {
  const ctx = useContext(DispatchActionContext)
  if (!ctx) {
    return {
      openCreateDispatch: () => {},
      closeCreateDispatch: () => {},
      createDialogOpen: false,
    }
  }
  return ctx
}

export function DispatchActionProvider({ children }: { children: ReactNode }) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  const openCreateDispatch = () => setCreateDialogOpen(true)
  const closeCreateDispatch = () => setCreateDialogOpen(false)

  return (
    <DispatchActionContext.Provider
      value={{
        openCreateDispatch,
        closeCreateDispatch,
        createDialogOpen,
      }}
    >
      {children}
    </DispatchActionContext.Provider>
  )
}

export function DispatchGlobalActionBar() {
  const { openCreateDispatch } = useDispatchActions()

  return (
    <button
      type="button"
      onClick={openCreateDispatch}
      className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500"
    >
      <Plus size={14} />
      <span>Tạo điều xe</span>
    </button>
  )
}
