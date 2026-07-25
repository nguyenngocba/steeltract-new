import React, { createContext, useContext, useState, type ReactNode } from 'react'
import { Plus } from 'lucide-react'
import { SupplierFormModal } from '../components/SupplierFormModal'
import {
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
} from '../hooks/useSuppliersQuery'
import type { Supplier, SupplierPayload } from '../api/suppliers.api'

export interface SuppliersActionContextType {
  openCreateSupplier: () => void
  openEditSupplier: (supplier: Supplier) => void
  closeAll: () => void
}

const SuppliersActionContext = createContext<SuppliersActionContextType | null>(null)

export function useSuppliersActions(): SuppliersActionContextType {
  const ctx = useContext(SuppliersActionContext)
  if (!ctx) {
    return {
      openCreateSupplier: () => {},
      openEditSupplier: () => {},
      closeAll: () => {},
    }
  }
  return ctx
}

export function SuppliersActionProvider({ children }: { children: ReactNode }) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)

  const createMutation = useCreateSupplierMutation()
  const updateMutation = useUpdateSupplierMutation()

  const openCreateSupplier = () => {
    setEditingSupplier(null)
    setModalOpen(true)
  }

  const openEditSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier)
    setModalOpen(true)
  }

  const closeAll = () => {
    setModalOpen(false)
    setEditingSupplier(null)
  }

  const handleSubmit = async (payload: SupplierPayload) => {
    if (editingSupplier) {
      await updateMutation.mutateAsync({ id: editingSupplier.id, payload })
    } else {
      await createMutation.mutateAsync(payload)
    }
    closeAll()
  }

  return (
    <SuppliersActionContext.Provider
      value={{
        openCreateSupplier,
        openEditSupplier,
        closeAll,
      }}
    >
      {children}

      <SupplierFormModal
        open={modalOpen}
        editing={editingSupplier}
        onClose={closeAll}
        onSubmit={handleSubmit}
        loading={createMutation.isPending || updateMutation.isPending}
      />
    </SuppliersActionContext.Provider>
  )
}

export function SuppliersGlobalActionBar() {
  const { openCreateSupplier } = useSuppliersActions()
  return (
    <button
      type="button"
      onClick={openCreateSupplier}
      className="h-8 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 flex items-center gap-1.5"
    >
      <Plus size={14} />
      <span>+ Thêm nhà cung cấp</span>
    </button>
  )
}
