import React, { createContext, useContext, useState, type ReactNode } from 'react'
import { ManufacturingOrderModal } from '../components/ManufacturingOrderModal'
import { ProductionBomModal } from '../components/ProductionBomModal'
import { useProductionBoms, useProductionComponents } from '../hooks/useProductionCockpit'

export interface ProductionActionContextType {
  openCreateOrder: () => void
  openCreateBom: () => void
  closeAll: () => void
}

const ProductionActionContext = createContext<ProductionActionContextType | null>(null)

export function useProductionActions(): ProductionActionContextType {
  const ctx = useContext(ProductionActionContext)
  if (!ctx) {
    return {
      openCreateOrder: () => {},
      openCreateBom: () => {},
      closeAll: () => {},
    }
  }
  return ctx
}

export function ProductionActionProvider({ children }: { children: ReactNode }) {
  const [createOrderOpen, setCreateOrderOpen] = useState(false)
  const [createBomOpen, setCreateBomOpen] = useState(false)

  const loadDependencies = createOrderOpen || createBomOpen
  const { data: boms = [] } = useProductionBoms(loadDependencies)
  const { data: components = [] } = useProductionComponents(loadDependencies)

  function openCreateOrder() {
    setCreateOrderOpen(true)
  }

  function openCreateBom() {
    setCreateBomOpen(true)
  }

  function closeAll() {
    setCreateOrderOpen(false)
    setCreateBomOpen(false)
  }

  return (
    <ProductionActionContext.Provider
      value={{
        openCreateOrder,
        openCreateBom,
        closeAll,
      }}
    >
      {children}

      {createOrderOpen ? (
        <ManufacturingOrderModal
          components={components}
          boms={boms}
          onClose={() => setCreateOrderOpen(false)}
        />
      ) : null}

      {createBomOpen ? (
        <ProductionBomModal
          components={components}
          onClose={() => setCreateBomOpen(false)}
        />
      ) : null}
    </ProductionActionContext.Provider>
  )
}
