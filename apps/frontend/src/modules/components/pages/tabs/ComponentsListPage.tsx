import { useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { useLocation } from 'react-router-dom'

import { EnterpriseModulePage } from '../../../../shared/runtime-tabs/EnterpriseModulePage'
import { useProjects } from '../../../inventory/hooks/useProjects'
import { ManufacturingOrderModal } from '../../../production/components/ManufacturingOrderModal'
import { ProductionBomModal } from '../../../production/components/ProductionBomModal'
import { useProductionBoms } from '../../../production/hooks/useProductionCockpit'
import type { ComponentCostingWarning } from '../../api/contracts/components.contract'
import {
  useComponents,
  useComponentCostingBreakdown,
  useComponentCosting,
  useCreateComponent,
  useDeleteComponent,
  useProductionOrders,
  useRecalculateComponentCosting,
} from '../../hooks/queries/useComponents'
import {
  ComponentsDonut,
  ComponentsFilterBar,
  ComponentsKpiCard,
  ComponentsMiniBars,
  ComponentsPanel,
  ComponentsSelect,
  componentsInput,
  componentsMutedButton,
  componentsPrimaryButton,
  componentsTableHead,
  componentsTableRow,
  componentsTableShell,
} from './ComponentsCockpitShared'

type ComponentRow = {
  id: string
  code: string
  name: string
  type: string
  profile: string
  project: string
  location: string
  installZone?: string | null
  installAxis?: string | null
  installLevel?: string | null
  installPosition?: string | null
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

type ComponentsListRouteState = {
  componentId?: string
} | null

export function ComponentsListPage() {
  const routeLocation = useLocation()
  const routeComponentId =
    (routeLocation.state as ComponentsListRouteState)?.componentId
  const openedRouteComponentIdRef = useRef<string | null>(null)
  const { data: componentRecords = [], isLoading } = useComponents()
  const { data: productionOrders = [] } = useProductionOrders()
  const { data: projects = [] } = useProjects()
  const { data: productionBoms = [] } = useProductionBoms()
  const createComponent = useCreateComponent()
  const deleteComponent = useDeleteComponent()
  const recalculateCosting = useRecalculateComponentCosting()
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
  const [costingView, setCostingView] = useState<'summary' | 'breakdown'>('summary')
  const { data: selectedCosting, error: costingError } = useComponentCosting(selected?.id)
  const { data: selectedCostingBreakdown, error: costingBreakdownError } =
    useComponentCostingBreakdown(selected?.id)

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
        installZone: record.installZone,
        installAxis: record.installAxis,
        installLevel: record.installLevel,
        installPosition: record.installPosition,
        status: statusMap[record.status] ?? 'Tồn kho',
        qty: metadata.quantity ?? 1,
        qc: metadata.qcQuantity ?? (record.status === 'READY' ? metadata.quantity ?? 1 : 0),
        createdAt: record.createdAt
          ? new Date(record.createdAt).toLocaleDateString('vi-VN')
          : '-',
      }
    })
  }, [componentRecords])

  useEffect(() => {
    if (
      !routeComponentId ||
      openedRouteComponentIdRef.current === routeComponentId
    ) {
      return
    }

    const row = rows.find((item) => item.id === routeComponentId)
    if (!row) {
      return
    }

    openedRouteComponentIdRef.current = routeComponentId
    setSelected(row)
    setDetailOpen(true)
  }, [routeComponentId, rows])

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

  async function recalculateSelectedCosting() {
    if (!selected) return

    try {
      await recalculateCosting.mutateAsync(selected.id)
      toast.success('Đã tính lại chi phí cấu kiện')
    } catch (error) {
      const raw = (error as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message
      toast.error(Array.isArray(raw) ? raw.join(', ') : raw || 'Không thể tính chi phí cấu kiện')
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
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-6">
          <ComponentsKpiCard title="Tổng số cấu kiện" value={rows.length.toLocaleString('vi-VN')} sub="+8,6% so với tháng trước" tone="blue" />
          <ComponentsKpiCard title="Đang sản xuất" value={rows.filter((x) => x.status === 'Đang SX').length.toLocaleString('vi-VN')} tone="amber" />
          <ComponentsKpiCard title="Đã QC" value={rows.filter((x) => x.status === 'Đã QC').length.toLocaleString('vi-VN')} tone="emerald" />
          <ComponentsKpiCard title="Chờ QC" value={rows.filter((x) => x.status === 'Chờ QC').length.toLocaleString('vi-VN')} tone="purple" />
          <ComponentsKpiCard title="Tồn kho cấu kiện" value={rows.filter((x) => x.status === 'Tồn kho').length.toLocaleString('vi-VN')} tone="cyan" />
          <ComponentsKpiCard title="Lệnh SX mới" value={productionOrders.length.toLocaleString('vi-VN')} tone="emerald" />
        </div>

        <ComponentsFilterBar>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm theo mã, tên, profile, dự án, vị trí..."
            className={`${componentsInput} xl:col-span-4`}
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
          <button onClick={() => setCreateOpen(true)} className={componentsPrimaryButton}>
            + Tạo cấu kiện
          </button>
          <button onClick={() => openProductionFor()} className="rounded-xl border border-emerald-400/30 bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-500">
            + Tạo lệnh sản xuất
          </button>
          <button onClick={() => openBomFor()} className={componentsMutedButton}>
            + Tạo Production BOM
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <div className="xl:col-span-9">
            <ComponentsPanel title={`Danh sách cấu kiện (${filtered.length})`}>
              <div className={componentsTableShell}>
                <div className="overflow-auto">
                <table className="w-full min-w-[1080px] text-sm">
                  <thead className={componentsTableHead}>
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
                        className={`cursor-pointer ${componentsTableRow}`}
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
                            className="rounded-lg border border-red-500/30 bg-red-500/10 px-2 py-1 text-xs text-red-300 hover:bg-red-500/20"
                          >
                            Xóa
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
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
                  <div key={order.orderNo} className="mb-3 rounded-xl border border-white/10 bg-white/[0.035] p-2 text-xs text-slate-300">
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
                <div key={line} className="mb-2 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-sm text-slate-300">
                  {line}
                </div>
              ))}
            </ComponentsPanel>
            <ComponentsPanel title="Cơ cấu trạng thái">
              <ComponentsDonut
                centerValue={rows.length.toLocaleString('vi-VN')}
                centerLabel="cấu kiện"
                segments={[
                  { label: 'Tồn kho', value: rows.filter((x) => x.status === 'Tồn kho').length, color: '#1d7cff' },
                  { label: 'Đang SX', value: rows.filter((x) => x.status === 'Đang SX').length, color: '#f59e0b' },
                  { label: 'Đã QC', value: rows.filter((x) => x.status === 'Đã QC').length, color: '#14c987' },
                  { label: 'Chờ QC', value: rows.filter((x) => x.status === 'Chờ QC').length, color: '#7c3aed' },
                ]}
              />
            </ComponentsPanel>
            <ComponentsPanel title="Nhịp tạo cấu kiện">
              <ComponentsMiniBars values={[18, 24, 16, 31, 28, 35, 42, 38, 44, 49, 46, 52]} />
            </ComponentsPanel>
          </div>
        </div>
      </div>

      {createOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-3xl rounded-2xl border border-white/10 bg-[#071323]/95 p-5 shadow-2xl ring-1 ring-white/[0.03] backdrop-blur-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Tạo cấu kiện mới</h3>
              <button onClick={closeCreateModal} className={componentsMutedButton}>Đóng</button>
            </div>
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
              <input value={createForm.name} onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))} placeholder="Tên cấu kiện" className={`${componentsInput} xl:col-span-2`} />
              <select value={createForm.type} onChange={(e) => setCreateForm((f) => ({ ...f, type: e.target.value }))} className={componentsInput}>
                <option>Dầm (Beam)</option>
                <option>Cột (Column)</option>
                <option>Bản mã (Plate)</option>
              </select>
              <input value={createForm.profile} onChange={(e) => setCreateForm((f) => ({ ...f, profile: e.target.value }))} placeholder="Profile/Kích thước" className={componentsInput} />
              <select value={createForm.projectId} onChange={(e) => setCreateForm((f) => ({ ...f, projectId: e.target.value }))} className={componentsInput}>
                <option value="">Chọn dự án</option>
                {projects.map((item: { id: string; code?: string; name: string }) => (
                  <option key={item.id} value={item.id}>{item.code ?? item.name} - {item.name}</option>
                ))}
              </select>
              <input value={createForm.qty} onChange={(e) => setCreateForm((f) => ({ ...f, qty: e.target.value }))} placeholder="Số lượng" className={componentsInput} />
            </div>
            <div className="mt-4 rounded-xl border border-cyan-900/60 bg-cyan-950/10 p-3 text-xs text-cyan-100">
              Vật tư không khai báo tại đây. Sau khi tạo cấu kiện, tạo Production BOM riêng để quản lý định mức và routing sản xuất.
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={closeCreateModal} className={componentsMutedButton}>Hủy</button>
              <button onClick={submitCreate} className={componentsPrimaryButton}>Lưu cấu kiện</button>
            </div>
          </div>
        </div>
      ) : null}

      {productionOpen ? <ManufacturingOrderModal components={productionComponents} boms={productionBoms} initialComponentId={productionComponentId} onClose={closeProductionModal} /> : null}
      {bomOpen ? <ProductionBomModal components={productionComponents} initialComponentId={bomComponentId} onClose={() => { setBomOpen(false); setBomComponentId('') }} /> : null}

      {detailOpen && selected ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-5xl rounded-2xl border border-white/10 bg-[#071323]/95 p-5 shadow-2xl ring-1 ring-white/[0.03] backdrop-blur-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-white">{selected.name}</h3>
                <div className="text-sm text-slate-400">{selected.code} · {selected.profile} · {selected.project}</div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => openBomFor(selected)} className={componentsMutedButton}>Tạo BOM</button>
                <button onClick={() => openProductionFor(selected)} className="rounded-xl border border-emerald-400/30 bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white">Sản xuất</button>
                <button onClick={() => void handleDelete(selected)} className="rounded-lg border border-red-800 px-3 py-2 text-sm text-red-300">Xóa</button>
                <button onClick={() => setDetailOpen(false)} className={componentsMutedButton}>Đóng</button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                <div className="text-xs text-slate-400">Trạng thái</div>
                <div className="mt-1 text-lg font-semibold text-white">{selected.status}</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                <div className="text-xs text-slate-400">Số lượng hiện tại</div>
                <div className="mt-1 text-lg font-semibold text-white">{selected.qty.toLocaleString('vi-VN')} kiện</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                <div className="text-xs text-slate-400">Vị trí hiện tại</div>
                <div className="mt-1 text-lg font-semibold text-white">{selected.location}</div>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.035] p-4">
              <div className="mb-3">
                <div className="text-sm font-semibold text-white">Vị trí lắp đặt</div>
                <div className="mt-1 text-xs text-slate-500">Thông tin được ghi khi xác nhận lắp đặt tại công trình.</div>
              </div>
              <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                <CostMetric title="Khu vực" value={selected.installZone ?? '-'} />
                <CostMetric title="Trục" value={selected.installAxis ?? '-'} />
                <CostMetric title="Tầng" value={selected.installLevel ?? '-'} />
                <CostMetric title="Vị trí" value={selected.installPosition ?? '-'} />
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.035] p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-white">Production BOM liên kết</div>
                  <div className="mt-1 text-xs text-slate-500">Định mức vật tư và routing dùng khi phát hành lệnh sản xuất.</div>
                </div>
                <button onClick={() => openBomFor(selected)} className={componentsMutedButton}>+ Tạo BOM</button>
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

            <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.035] p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-white">Costing cấu kiện</div>
                  <div className="mt-1 text-xs text-slate-500">Chi phí thực tế tính từ production consumption và giá vốn bình quân vật tư.</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="rounded-xl border border-white/10 bg-slate-950/70 p-1 text-xs">
                    <button onClick={() => setCostingView('summary')} className={`rounded-lg px-3 py-1.5 ${costingView === 'summary' ? 'bg-cyan-600 text-white' : 'text-slate-400'}`}>Costing</button>
                    <button onClick={() => setCostingView('breakdown')} className={`rounded-lg px-3 py-1.5 ${costingView === 'breakdown' ? 'bg-cyan-600 text-white' : 'text-slate-400'}`}>Cost Breakdown</button>
                  </div>
                  <button onClick={() => void recalculateSelectedCosting()} disabled={recalculateCosting.isPending} className={componentsMutedButton}>Tính lại costing</button>
                </div>
              </div>
              {costingView === 'summary' && costingError ? (
                <div className="rounded-lg border border-amber-800 bg-amber-950/30 p-3 text-xs text-amber-200">
                  Chưa đủ dữ liệu costing. Cấu kiện cần có lệnh sản xuất và consumption records.
                </div>
              ) : costingView === 'summary' ? (
                <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                  <CostMetric title="Estimated Cost" value={money(selectedCosting?.estimatedCost)} />
                  <CostMetric title="Actual Cost" value={money(selectedCosting?.actualCost)} tone="text-emerald-300" />
                  <CostMetric title="Variance" value={money(selectedCosting?.varianceCost)} tone={(selectedCosting?.varianceCost ?? 0) > 0 ? 'text-red-300' : 'text-cyan-300'} />
                  <CostMetric title="Material Cost" value={money(selectedCosting?.actualMaterialCost)} tone="text-cyan-300" />
                  <CostMetric title="Labor Cost" value={money(selectedCosting?.laborCost)} />
                  <CostMetric title="Machine Cost" value={money(selectedCosting?.machineCost)} />
                  <CostMetric title="Overhead Cost" value={money(selectedCosting?.overheadCost)} />
                  <CostMetric title="MO" value={selectedCosting?.productionOrder?.orderNo ?? '-'} />
                </div>
              ) : costingBreakdownError ? (
                <div className="rounded-lg border border-amber-800 bg-amber-950/30 p-3 text-xs text-amber-200">
                  Chưa đủ dữ liệu breakdown. Cấu kiện cần có BOM, lệnh sản xuất và dữ liệu consumption.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <CostMetric title="Estimated Material Cost" value={money(selectedCostingBreakdown?.summary.estimatedMaterialCost)} />
                    <CostMetric title="Actual Material Cost" value={money(selectedCostingBreakdown?.summary.actualMaterialCost)} tone="text-emerald-300" />
                    <CostMetric title="Variance" value={money(selectedCostingBreakdown?.summary.varianceCost)} tone={(selectedCostingBreakdown?.summary.varianceCost ?? 0) > 0 ? 'text-red-300' : 'text-cyan-300'} />
                  </div>
                  <CostBreakdownTable
                    title="Estimated Materials"
                    rows={(selectedCostingBreakdown?.estimatedMaterials ?? []).map((row) => ({
                      id: row.materialId,
                      material: `${row.materialCode} · ${row.materialName}`,
                      qty: row.requiredQty,
                      unitCost: row.averageCost,
                      amount: row.estimatedAmount,
                    }))}
                  />
                  <CostBreakdownTable
                    title="Actual Materials"
                    rows={(selectedCostingBreakdown?.actualMaterials ?? []).map((row) => ({
                      id: row.materialId,
                      material: `${row.materialCode} · ${row.materialName}`,
                      qty: row.actualQty,
                      unitCost: row.averageCost,
                      amount: row.actualAmount,
                    }))}
                  />
                  <CostWarnings warnings={selectedCostingBreakdown?.warnings ?? []} />
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </EnterpriseModulePage>
  )
}

function money(value?: number | null) {
  return new Intl.NumberFormat('vi-VN', {
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0))
}

function CostMetric({ title, value, tone = 'text-white' }: { title: string; value: string; tone?: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/55 p-3">
      <div className="text-[11px] text-slate-500">{title}</div>
      <div className={`mt-1 text-base font-semibold ${tone}`}>{value}</div>
    </div>
  )
}

function CostBreakdownTable({
  title,
  rows,
}: {
  title: string
  rows: Array<{
    id: string
    material: string
    qty: number
    unitCost: number
    amount: number
  }>
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-950/45">
      <div className="border-b border-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-cyan-300">{title}</div>
      <table className="w-full text-xs">
        <thead className="bg-white/[0.03] text-slate-500">
          <tr>
            <th className="px-3 py-2 text-left">Material</th>
            <th className="px-3 py-2 text-right">Qty</th>
            <th className="px-3 py-2 text-right">Unit Cost</th>
            <th className="px-3 py-2 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-3 py-4 text-center text-slate-500">Không có dữ liệu vật tư.</td>
            </tr>
          ) : rows.map((row) => (
            <tr key={row.id} className="border-t border-white/10 text-slate-200">
              <td className="px-3 py-2 text-cyan-200">{row.material}</td>
              <td className="px-3 py-2 text-right">{quantity(row.qty)}</td>
              <td className="px-3 py-2 text-right">{money(row.unitCost)}</td>
              <td className="px-3 py-2 text-right font-semibold text-white">{money(row.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CostWarnings({ warnings }: { warnings: ComponentCostingWarning[] }) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/45 p-3">
      <div className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-amber-300">Warnings</div>
      {warnings.length === 0 ? (
        <div className="text-xs text-slate-500">Không có cảnh báo costing.</div>
      ) : (
        <div className="space-y-2">
          {warnings.map((warning) => (
            <div key={`${warning.type}-${warning.materialId}`} className="rounded-lg border border-amber-800/70 bg-amber-950/25 p-2 text-xs text-amber-100">
              <div className="font-semibold">{warning.type}</div>
              <div className="mt-1 text-amber-100/80">{warning.materialCode} · {warning.materialName}</div>
              <div className="mt-1 text-slate-300">{warning.message}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function quantity(value?: number | null) {
  return new Intl.NumberFormat('vi-VN', {
    maximumFractionDigits: 3,
  }).format(Number(value ?? 0))
}
