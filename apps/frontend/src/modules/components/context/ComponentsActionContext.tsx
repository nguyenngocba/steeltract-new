import React, { createContext, useContext, useState, type ReactNode } from 'react'
import toast from 'react-hot-toast'
import { useComponents, useComponentProductionBoms, useCreateComponent } from '../hooks/queries/useComponents'
import { useProjects } from '@/modules/inventory/hooks/useProjects'
import { ManufacturingOrderModal } from '@/modules/production/components/ManufacturingOrderModal'
import { ProductionBomModal } from '@/modules/production/components/ProductionBomModal'

const inventoryInput =
  'h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:bg-[#08111f]'

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

  const loadDependencies = productionOpen || bomOpen
  const { data: productionBoms = [] } = useComponentProductionBoms(loadDependencies)
  const { data: componentLookup = [] } = useComponents(loadDependencies)

  const productionComponents = (componentLookup.length > 0 ? componentLookup : []).map((c: any) => ({
    id: c.id,
    code: c.code,
    name: c.name,
    project: c.project || 'Chưa gán',
    status: c.status || 'N/A',
  }))

  const [createForm, setCreateForm] = useState({
    name: '',
    type: 'Dầm (Beam)',
    profile: '',
    projectId: '',
    qty: '1',
    requiredBy: '',
    note: '',
  })

  function openCreateComponent() {
    setCreateOpen(true)
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
            type: 'Dầm (Beam)',
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div
            className="w-full rounded-2xl border border-white/10 bg-[#08111f]/95 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.35)] flex flex-col justify-between"
            style={{ maxWidth: '48rem' }}
          >
            <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-300">
                Tạo hồ sơ cấu kiện
              </h3>
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="rounded border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300 hover:text-white transition"
              >
                Đóng
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <div className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                  Thông tin kỹ thuật
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                  <input
                    value={createForm.name}
                    onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Tên cấu kiện *"
                    className={`${inventoryInput} xl:col-span-2`}
                  />
                  <select
                    value={createForm.type}
                    onChange={(e) => setCreateForm((f) => ({ ...f, type: e.target.value }))}
                    className={inventoryInput}
                  >
                    <option>Dầm (Beam)</option>
                    <option>Cột (Column)</option>
                    <option>Bản mã (Plate)</option>
                  </select>
                  <input
                    value={createForm.profile}
                    onChange={(e) => setCreateForm((f) => ({ ...f, profile: e.target.value }))}
                    placeholder="Profile / Kích thước"
                    className={inventoryInput}
                  />
                  <input
                    value="Mã cấu kiện tự động sinh"
                    readOnly
                    className={`${inventoryInput} text-slate-500`}
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                  Yêu cầu công trình
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                  <select
                    value={createForm.projectId}
                    onChange={(e) => setCreateForm((f) => ({ ...f, projectId: e.target.value }))}
                    className={inventoryInput}
                  >
                    <option value="">Công trình / Dự án *</option>
                    {projects.map((item: { id: string; code?: string; name: string }) => (
                      <option key={item.id} value={item.id}>
                        {item.code ?? item.name} - {item.name}
                      </option>
                    ))}
                  </select>
                  <input
                    value={createForm.qty}
                    onChange={(e) => setCreateForm((f) => ({ ...f, qty: e.target.value }))}
                    placeholder="Số lượng yêu cầu *"
                    className={inventoryInput}
                  />
                  <input
                    type="date"
                    value={createForm.requiredBy}
                    onChange={(e) => setCreateForm((f) => ({ ...f, requiredBy: e.target.value }))}
                    className={inventoryInput}
                  />
                  <input
                    value={createForm.note}
                    onChange={(e) => setCreateForm((f) => ({ ...f, note: e.target.value }))}
                    placeholder="Ghi chú"
                    className={inventoryInput}
                  />
                </div>
              </div>
            </div>
            <div className="mt-4 rounded-xl border border-cyan-900/40 bg-cyan-950/20 p-3 text-xs text-cyan-100">
              Hồ sơ mới ở trạng thái Draft. Số lượng là nhu cầu công trình, không tạo tồn kho, ComponentInstance hay lệnh sản xuất.
            </div>
            <div className="mt-4 flex justify-end gap-2 border-t border-white/10 pt-3">
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="rounded border border-slate-700 px-4 py-2 text-xs text-slate-300 hover:bg-white/5 transition"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={submitCreate}
                className="rounded bg-blue-600 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition"
              >
                Tạo hồ sơ
              </button>
            </div>
          </div>
        </div>
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
