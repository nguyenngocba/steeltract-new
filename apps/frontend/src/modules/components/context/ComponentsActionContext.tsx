import React, { createContext, useContext, useState, type ReactNode } from 'react'
import toast from 'react-hot-toast'
import { useComponents, useComponentProductionBoms, useCreateComponent } from '../hooks/queries/useComponents'
import { useProjects } from '@/modules/inventory/hooks/useProjects'
import { ManufacturingOrderModal } from '@/modules/production/components/ManufacturingOrderModal'
import { ProductionBomModal } from '@/modules/production/components/ProductionBomModal'
import { EnterpriseModalForm } from '@/shared/forms'
import {
  ComponentDefinitionRequirementForm,
  type ComponentDefinitionFormState,
} from '../components/ComponentDefinitionRequirementForm'

export interface ComponentsActionContextType {
  openCreateComponent: () => void
  openProductionOrder: (componentId?: string) => void
  openBomModal: (componentId?: string) => void
  closeAll: () => void
}

const ComponentsActionContext = createContext<ComponentsActionContextType | null>(null)

export function useComponentsActions(): ComponentsActionContextType {
  const ctx = useContext(ComponentsActionContext)
  if (!ctx) {
    return {
      openCreateComponent: () => {},
      openProductionOrder: () => {},
      openBomModal: () => {},
      closeAll: () => {},
    }
  }
  return ctx
}

export function ComponentsActionProvider({ children }: { children: ReactNode }) {
  const [createOpen, setCreateOpen] = useState(false)
  const [productionOpen, setProductionOpen] = useState(false)
  const [productionComponentId, setProductionComponentId] = useState('')
  const [bomOpen, setBomOpen] = useState(false)
  const [bomComponentId, setBomComponentId] = useState('')

  const createMutation = useCreateComponent()
  const { data: projects = [] } = useProjects()

  const loadDependencies = createOpen || productionOpen || bomOpen
  const { data: productionBoms = [] } = useComponentProductionBoms(loadDependencies)
  const { data: componentLookup = [] } = useComponents(loadDependencies)
  const productionComponents = (componentLookup.length > 0 ? componentLookup : []).map((c: any) => ({
    id: c.id,
    code: c.code,
    name: c.name,
    project: c.project || 'Chưa gán',
    status: c.status || 'N/A',
  }))

  const [createForm, setCreateForm] = useState<ComponentDefinitionFormState>({
    name: '',
    type: '',
    profile: '',
    projectId: '',
    qty: '1',
    requiredBy: '',
    note: '',
  })

  function openCreateComponent() {
    setCreateOpen(true)
  }

  function closeCreateComponent() {
    setCreateOpen(false)
    setCreateForm({
      name: '',
      type: '',
      profile: '',
      projectId: '',
      qty: '1',
      requiredBy: '',
      note: '',
    })
  }

  function openProductionOrder(componentId?: string) {
    setProductionComponentId(componentId ?? '')
    setProductionOpen(true)
  }

  function openBomModal(componentId?: string) {
    setBomComponentId(componentId ?? '')
    setBomOpen(true)
  }

  function closeAll() {
    setCreateOpen(false)
    setProductionOpen(false)
    setBomOpen(false)
    setProductionComponentId('')
    setBomComponentId('')
  }

  function submitCreate() {
    const requiredQuantity = Number(createForm.qty || 0)
    if (!createForm.name.trim()) {
      toast.error('Nhập tên cấu kiện')
      return
    }
    if (!createForm.projectId) {
      toast.error('Chọn công trình / dự án')
      return
    }
    if (!createForm.type.trim()) {
      toast.error('Chọn loại cấu kiện')
      return
    }
    if (!Number.isFinite(requiredQuantity) || requiredQuantity <= 0) {
      toast.error('Số lượng yêu cầu phải lớn hơn 0')
      return
    }

    createMutation.mutate(
      {
        name: createForm.name.trim(),
        componentType: createForm.type.trim(),
        profile: createForm.profile.trim() || undefined,
        projectId: createForm.projectId,
        requiredQuantity,
        requiredBy: createForm.requiredBy
          ? new Date(createForm.requiredBy).toISOString()
          : undefined,
        note: createForm.note.trim() || undefined,
      },
      {
        onSuccess: (result) => {
          setCreateOpen(false)
          setCreateForm({
            name: '',
            type: '',
            profile: '',
            projectId: '',
            qty: '1',
            requiredBy: '',
            note: '',
          })
          toast.success(
            `Đã tạo hồ sơ ${result.component.code} · Draft · yêu cầu ${requiredQuantity} cấu kiện`,
          )
        },
        onError: () => {
          toast.error('Không thể tạo cấu kiện')
        },
      },
    )
  }

  return (
    <ComponentsActionContext.Provider
      value={{
        openCreateComponent,
        openProductionOrder,
        openBomModal,
        closeAll,
      }}
    >
      {children}

      {/* CREATE COMPONENT MODAL */}
      {createOpen ? (
        <EnterpriseModalForm
          open
          title="Tạo hồ sơ cấu kiện"
          description="Tạo Component Definition ở trạng thái Draft và nhu cầu cấu kiện cho công trình."
          onClose={closeCreateComponent}
          onSubmit={(event) => { event.preventDefault(); submitCreate() }}
          submitLabel="Tạo hồ sơ"
          pendingLabel="Đang tạo hồ sơ..."
          pending={createMutation.isPending}
          maxWidthClass="max-w-5xl"
        >
          <ComponentDefinitionRequirementForm
            form={createForm}
            projects={projects as Array<{ id: string; code?: string; name: string }>}
            components={componentLookup as any[]}
            onChange={(patch) => setCreateForm((current) => ({ ...current, ...patch }))}
          />
        </EnterpriseModalForm>
      ) : null}

      {/* PRODUCTION ORDER MODAL */}
      {productionOpen ? (
        <ManufacturingOrderModal
          components={productionComponents}
          boms={productionBoms}
          initialComponentId={productionComponentId}
          onClose={() => {
            setProductionOpen(false)
            setProductionComponentId('')
          }}
        />
      ) : null}

      {/* PRODUCTION BOM MODAL */}
      {bomOpen ? (
        <ProductionBomModal
          components={productionComponents}
          initialComponentId={bomComponentId}
          onClose={() => {
            setBomOpen(false)
            setBomComponentId('')
          }}
        />
      ) : null}
    </ComponentsActionContext.Provider>
  )
}
