import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'

import { EnterpriseModulePage } from '../../../../shared/runtime-tabs/EnterpriseModulePage'
import { EnterpriseTabBar } from '../../../../shared/runtime-tabs/EnterpriseTabBar'
import { useProjects } from '../../../inventory/hooks/useProjects'
import { ManufacturingOrderModal } from '../../../production/components/ManufacturingOrderModal'
import { ProductionBomModal } from '../../../production/components/ProductionBomModal'
import { useProductionBoms } from '../../../production/hooks/useProductionCockpit'
import { componentsTabs } from '../../config/components-tabs'
import {
  useComponents,
  useCreateComponent,
  useDeleteComponent,
  useProductionOrders,
} from '../../hooks/queries/useComponents'
import { ComponentsFilterBar, ComponentsKpiCard, ComponentsPanel, ComponentsSelect } from './ComponentsCockpitShared'

type ComponentRow = {
  id: string
  code: string
  name: string
  type: string
  profile: string
  project: string
  location: string
  status: 'Tồn kho' | 'Đang SX' | 'Đã QC' | 'Chờ QC' | 'Không đạt'
  qty: number
  qc: number
  createdAt: string
}

type ComponentMetadata = {
  type?: string
  profile?: string
  quantity?: number
  qcQuantity?: number
}

export function ComponentsListPage() {
  const { data: componentRecords = [], isLoading } = useComponents()
  const { data: productionOrders = [] } = useProductionOrders()
  const { data: projects = [] } = useProjects()
  const { data: productionBoms = [] } = useProductionBoms()
  const createComponent = useCreateComponent()
  const deleteComponent = useDeleteComponent()
  const [project, setProject] = useState('')
  const [status, setStatus] = useState('')
  const [type, setType] = useState('')
  const [location, setLocation] = useState('')
  const [query, setQuery] = useState('')

  const [createOpen, setCreateOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [productionOpen, setProductionOpen] = useState(false)
  const [productionComponentId, setProductionComponentId] = useState('')
  const [bomOpen, setBomOpen] = useState(false)
  const [bomComponentId, setBomComponentId] = useState('')
  const [selected, setSelected] = useState<ComponentRow | null>(null)

  const [createForm, setCreateForm] = useState({
    name: '',
    type: 'Dầm (Beam)',
    profile: '',
    projectId: '',
    qty: '1',
    location: 'Kho cấu kiện',
  })
  function closeCreateModal() {
    setCreateOpen(false)
    setCreateForm({
      name: '',
      type: 'Dầm (Beam)',
      profile: '',
      projectId: '',
      qty: '1',
      location: 'Kho cấu kiện',
    })
  }

  function closeProductionModal() {
    setProductionOpen(false)
    setProductionComponentId('')
  }

  const rows = useMemo<ComponentRow[]>(() => {
    return componentRecords.map((record) => {
      let metadata: ComponentMetadata = {}

      try {
        metadata = record.description ? JSON.parse(record.description) : {}
      } catch {
        metadata = {}
      }

      const statusMap: Record<string, ComponentRow['status']> = {
        STOCK: 'Tồn kho',
        CUTTING: 'Đang SX',
        WELDING: 'Đang SX',
        PAINTING: 'Đang SX',
        READY: 'Đã QC',
        SHIPPED: 'Tồn kho',
        DELIVERED: 'Tồn kho',
        INSTALLED: 'Tồn kho',
      }

      return {
        id: record.id,
        code: record.code,
        name: record.name,
        type: metadata.type ?? 'Cấu kiện thép',
        profile: metadata.profile ?? 'N/A',
        project: record.project?.code ?? record.project?.name ?? 'Chưa gán dự án',
        location: [record.floor, record.zone, record.position].filter(Boolean).join(' / ') || 'Kho cấu kiện',
        status: statusMap[record.status] ?? 'Tồn kho',
        qty: metadata.quantity ?? 1,
        qc: metadata.qcQuantity ?? (record.status === 'READY' ? metadata.quantity ?? 1 : 0),
        createdAt: record.createdAt
          ? new Date(record.createdAt).toLocaleDateString('vi-VN')
          : '-',
      }
    })
  }, [componentRecords])

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      if (project && row.project !== project) return false
      if (status && row.status !== status) return false
      if (type && row.type !== type) return false
      if (location && row.location !== location) return false
      if (query && !`${row.code} ${row.name}`.toLowerCase().includes(query.toLowerCase())) return false
      return true
    })
  }, [rows, project, status, type, location, query])

  function openDetail(row: ComponentRow) {
    setSelected(row)
    setDetailOpen(true)
  }

  function openProductionFor(row?: ComponentRow) {
    const target = row ?? selected
    setDetailOpen(false)
    setProductionComponentId(target?.id ?? '')
    setProductionOpen(true)
  }

  function openBomFor(row?: ComponentRow) {
    const target = row ?? selected
    setDetailOpen(false)
    setBomComponentId(target?.id ?? '')
    setBomOpen(true)
  }

  async function submitCreate() {
    const code = `CPL-${Date.now().toString().slice(-8)}`
    const metadata: ComponentMetadata = {
      type: createForm.type,
      profile: createForm.profile || 'N/A',
      quantity: Number(createForm.qty || 0),
      qcQuantity: 0,
    }

    try {
      await createComponent.mutateAsync({
        code,
        name: createForm.name || 'COMPONENT',
        description: JSON.stringify(metadata),
        status: 'STOCK',
        projectId: createForm.projectId || undefined,
        floor: 'Kho cấu kiện',
      })
      toast.success(`Đã tạo cấu kiện ${code}`)
    } catch {
      toast.error('Không thể tạo cấu kiện')
      return
    }

    closeCreateModal()
  }

  async function handleDelete(row: ComponentRow) {
    if (!window.confirm(`Xóa cấu kiện ${row.code}?`)) return

    try {
      await deleteComponent.mutateAsync(row.id)
      toast.success(`Đã xóa cấu kiện ${row.code}`)
      if (selected?.id === row.id) {
        setSelected(null)
        setDetailOpen(false)
      }
    } catch {
      toast.error('Không thể xóa cấu kiện')
    }
  }

  const recentOrders = productionOrders.slice(0, 4)
  const productionComponents = componentRecords.map((record) => ({
    id: record.id,
    code: record.code,
    name: record.name,
    projectId: record.projectId,
    project: record.project,
  }))
  const selectedBoms = selected
    ? productionBoms.filter((bom) => bom.productCode === selected.code && bom.status !== 'ARCHIVED')
    : []

  return (
    <EnterpriseModulePage>
      <EnterpriseTabBar tabs={componentsTabs} />

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-6">
          <ComponentsKpiCard title="Tổng số cấu kiện" value={rows.length.toLocaleString('vi-VN')} sub="+8,6% so với tháng trước" />
          <ComponentsKpiCard title="Đang sản xuất" value={rows.filter((x) => x.status === 'Đang SX').length.toLocaleString('vi-VN')} />
          <ComponentsKpiCard title="Đã QC" value={rows.filter((x) => x.status === 'Đã QC').length.toLocaleString('vi-VN')} />
          <ComponentsKpiCard title="Chờ QC" value={rows.filter((x) => x.status === 'Chờ QC').length.toLocaleString('vi-VN')} />
          <ComponentsKpiCard title="Tồn kho cấu kiện" value={rows.filter((x) => x.status === 'Tồn kho').length.toLocaleString('vi-VN')} />
          <ComponentsKpiCard title="Lệnh SX mới" value={productionOrders.length.toLocaleString('vi-VN')} />
        </div>

        <ComponentsFilterBar>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm theo mã, tên, profile, dự án, vị trí..."
            className="h-10 rounded-lg border border-slate-700 bg-[#050d18] px-3 text-sm text-slate-100 xl:col-span-4"
          />
          <ComponentsSelect value={project} onChange={setProject} className="xl:col-span-2">
            <option value="">Dự án</option>
            <option value="PO-2506-014">PO-2506-014</option>
            <option value="PO-2506-015">PO-2506-015</option>
          </ComponentsSelect>
          <ComponentsSelect value={status} onChange={setStatus} className="xl:col-span-2">
            <option value="">Trạng thái</option>
            <option value="Tồn kho">Tồn kho</option>
            <option value="Đang SX">Đang SX</option>
            <option value="Đã QC">Đã QC</option>
            <option value="Chờ QC">Chờ QC</option>
            <option value="Không đạt">Không đạt</option>
          </ComponentsSelect>
          <ComponentsSelect value={type} onChange={setType} className="xl:col-span-2">
            <option value="">Loại cấu kiện</option>
            <option value="Dầm (Beam)">Dầm (Beam)</option>
            <option value="Cột (Column)">Cột (Column)</option>
            <option value="Bản mã (Plate)">Bản mã (Plate)</option>
          </ComponentsSelect>
          <ComponentsSelect value={location} onChange={setLocation} className="xl:col-span-2">
            <option value="">Vị trí</option>
            <option value="Kho cấu kiện">Kho cấu kiện</option>
            <option value="Workshop A">Workshop A</option>
            <option value="QC nội bộ">QC nội bộ</option>
          </ComponentsSelect>
        </ComponentsFilterBar>

        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setCreateOpen(true)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white">
            + Tạo cấu kiện
          </button>
          <button onClick={() => openProductionFor()} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white">
            + Tạo lệnh sản xuất
          </button>
          <button onClick={() => openBomFor()} className="rounded-lg border border-cyan-700 px-4 py-2 text-sm font-medium text-cyan-200">
            + Tạo Production BOM
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <div className="xl:col-span-9">
            <ComponentsPanel title={`Danh sách cấu kiện (${filtered.length})`}>
              <div className="overflow-auto">
                <table className="w-full min-w-[1080px] text-sm">
                  <thead className="text-xs uppercase text-slate-400">
                    <tr>
                      {['Mã cấu kiện', 'Tên cấu kiện', 'Profile/Kích thước', 'Loại', 'Dự án', 'Vị trí hiện tại', 'Trạng thái', 'SL', 'Đã QC', 'Ngày tạo', 'Thao tác'].map((h) => (
                        <th key={h} className="px-2 py-2 text-left font-medium">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={11} className="px-2 py-6 text-center text-slate-400">
                          Đang tải dữ liệu cấu kiện...
                        </td>
                      </tr>
                    ) : filtered.map((row) => (
                      <tr
                        key={row.code}
                        onClick={() => openDetail(row)}
                        className="cursor-pointer border-t border-slate-800/80 text-slate-200 hover:bg-slate-900/40"
                      >
                        <td className="px-2 py-2 text-cyan-300">{row.code}</td>
                        <td className="px-2 py-2">{row.name}</td>
                        <td className="px-2 py-2">{row.profile}</td>
                        <td className="px-2 py-2">{row.type}</td>
                        <td className="px-2 py-2">{row.project}</td>
                        <td className="px-2 py-2">{row.location}</td>
                        <td className="px-2 py-2">{row.status}</td>
                        <td className="px-2 py-2">{row.qty.toLocaleString('vi-VN')}</td>
                        <td className="px-2 py-2">{row.qc.toLocaleString('vi-VN')}</td>
                        <td className="px-2 py-2">{row.createdAt}</td>
                        <td className="px-2 py-2">
                          <button
                            onClick={(event) => {
                              event.stopPropagation()
                              void handleDelete(row)
                            }}
                            className="rounded border border-red-700/50 px-2 py-1 text-xs text-red-300 hover:bg-red-950/40"
                          >
                            Xóa
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 text-xs text-slate-400">Hiển thị 1 - {filtered.length} của {filtered.length} kết quả</div>
            </ComponentsPanel>
          </div>

          <div className="space-y-4 xl:col-span-3">
            <ComponentsPanel title="Lệnh sản xuất mới tạo">
              {recentOrders.length === 0 ? (
                <div className="text-sm text-slate-400">Chưa có lệnh mới.</div>
              ) : (
                recentOrders.map((order) => (
                  <div key={order.orderNo} className="mb-3 rounded border border-slate-800 p-2 text-xs text-slate-300">
                    <div className="text-cyan-300">{order.orderNo}</div>
                    <div>{rows.find((row) => row.id === order.componentId)?.code ?? order.title} - SL: {order.quantity.toLocaleString('vi-VN')}</div>
                    <div>
                      Đích: {order.metadata?.destinationYard} / {order.metadata?.destinationZone} / {order.metadata?.destinationSlot} / {order.metadata?.destinationLevel}
                    </div>
                  </div>
                ))
              )}
            </ComponentsPanel>

            <ComponentsPanel title="Hoạt động gần đây" action="Xem tất cả">
              {['CPL-PLT-000457 đã QC đạt', 'CPL-BEAM-001256 nhập kho cấu kiện', 'Tạo mới cấu kiện CPL-BASE-000241'].map((line) => (
                <div key={line} className="mb-2 text-sm text-slate-300">
                  {line}
                </div>
              ))}
            </ComponentsPanel>
          </div>
        </div>
      </div>

      {createOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-3xl rounded-2xl border border-slate-700 bg-[#071323] p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Tạo cấu kiện mới</h3>
              <button onClick={closeCreateModal} className="text-slate-300">✕</button>
            </div>
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
              <input value={createForm.name} onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))} placeholder="Tên cấu kiện" className="h-10 rounded-lg border border-slate-700 bg-[#050d18] px-3 text-sm text-white xl:col-span-2" />
              <select value={createForm.type} onChange={(e) => setCreateForm((f) => ({ ...f, type: e.target.value }))} className="h-10 rounded-lg border border-slate-700 bg-[#050d18] px-3 text-sm text-white">
                <option>Dầm (Beam)</option>
                <option>Cột (Column)</option>
                <option>Bản mã (Plate)</option>
              </select>
              <input value={createForm.profile} onChange={(e) => setCreateForm((f) => ({ ...f, profile: e.target.value }))} placeholder="Profile/Kích thước" className="h-10 rounded-lg border border-slate-700 bg-[#050d18] px-3 text-sm text-white" />
              <select value={createForm.projectId} onChange={(e) => setCreateForm((f) => ({ ...f, projectId: e.target.value }))} className="h-10 rounded-lg border border-slate-700 bg-[#050d18] px-3 text-sm text-white">
                <option value="">Chọn dự án</option>
                {projects.map((item: { id: string; code?: string; name: string }) => (
                  <option key={item.id} value={item.id}>{item.code ?? item.name} - {item.name}</option>
                ))}
              </select>
              <input value={createForm.qty} onChange={(e) => setCreateForm((f) => ({ ...f, qty: e.target.value }))} placeholder="Số lượng" className="h-10 rounded-lg border border-slate-700 bg-[#050d18] px-3 text-sm text-white" />
            </div>
            <div className="mt-4 rounded-xl border border-cyan-900/60 bg-cyan-950/10 p-3 text-xs text-cyan-100">
              Vật tư không khai báo tại đây. Sau khi tạo cấu kiện, tạo Production BOM riêng để quản lý định mức và routing sản xuất.
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={closeCreateModal} className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200">Hủy</button>
              <button onClick={submitCreate} className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white">Lưu cấu kiện</button>
            </div>
          </div>
        </div>
      ) : null}

      {productionOpen ? <ManufacturingOrderModal components={productionComponents} boms={productionBoms} initialComponentId={productionComponentId} onClose={closeProductionModal} /> : null}
      {bomOpen ? <ProductionBomModal components={productionComponents} initialComponentId={bomComponentId} onClose={() => { setBomOpen(false); setBomComponentId('') }} /> : null}

      {detailOpen && selected ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-5xl rounded-2xl border border-slate-700 bg-[#071323] p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-white">{selected.name}</h3>
                <div className="text-sm text-slate-400">{selected.code} · {selected.profile} · {selected.project}</div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => openBomFor(selected)} className="rounded-lg border border-cyan-700 px-3 py-2 text-sm text-cyan-100">Tạo BOM</button>
                <button onClick={() => openProductionFor(selected)} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm text-white">Sản xuất</button>
                <button onClick={() => void handleDelete(selected)} className="rounded-lg border border-red-800 px-3 py-2 text-sm text-red-300">Xóa</button>
                <button onClick={() => setDetailOpen(false)} className="text-slate-300">✕</button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              <div className="rounded-xl border border-slate-800 bg-[#050d18] p-4">
                <div className="text-xs text-slate-400">Trạng thái</div>
                <div className="mt-1 text-lg font-semibold text-white">{selected.status}</div>
              </div>
              <div className="rounded-xl border border-slate-800 bg-[#050d18] p-4">
                <div className="text-xs text-slate-400">Số lượng hiện tại</div>
                <div className="mt-1 text-lg font-semibold text-white">{selected.qty.toLocaleString('vi-VN')} kiện</div>
              </div>
              <div className="rounded-xl border border-slate-800 bg-[#050d18] p-4">
                <div className="text-xs text-slate-400">Vị trí hiện tại</div>
                <div className="mt-1 text-lg font-semibold text-white">{selected.location}</div>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-slate-800 bg-[#050d18] p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-white">Production BOM liên kết</div>
                  <div className="mt-1 text-xs text-slate-500">Định mức vật tư và routing dùng khi phát hành lệnh sản xuất.</div>
                </div>
                <button onClick={() => openBomFor(selected)} className="rounded-lg border border-cyan-800 px-3 py-2 text-xs text-cyan-200">+ Tạo BOM</button>
              </div>
              <table className="w-full text-sm">
                <thead className="text-xs uppercase text-slate-400">
                  <tr>
                    <th className="px-2 py-2 text-left">Mã BOM</th>
                    <th className="px-2 py-2 text-left">Phiên bản</th>
                    <th className="px-2 py-2 text-left">Vật tư</th>
                    <th className="px-2 py-2 text-left">Routing</th>
                    <th className="px-2 py-2 text-left">KL ước tính</th>
                    <th className="px-2 py-2 text-left">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedBoms.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-2 py-5 text-center text-slate-500">Chưa có Production BOM. Tạo BOM trước khi phát hành lệnh sản xuất.</td>
                    </tr>
                  ) : selectedBoms.map((bom) => (
                    <tr key={bom.id} className="border-t border-slate-800 text-slate-200">
                      <td className="px-2 py-2 text-cyan-300">{bom.bomNo}</td>
                      <td className="px-2 py-2">{bom.version}</td>
                      <td className="px-2 py-2">{bom.items.length}</td>
                      <td className="px-2 py-2">{bom.routingSteps.length} bước</td>
                      <td className="px-2 py-2">{bom.estimatedWeight.toLocaleString('vi-VN')} kg</td>
                      <td className="px-2 py-2"><span className="rounded bg-emerald-950 px-2 py-1 text-xs text-emerald-300">{bom.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </EnterpriseModulePage>
  )
}
