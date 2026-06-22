import { useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { useLocation } from 'react-router-dom'

import { EnterpriseModulePage } from '../../../../shared/runtime-tabs/EnterpriseModulePage'
import { ModuleDataGrid, ModuleDetailDrawer, ModuleEmptyState, ModuleFilterBar, ModuleKpiStrip, ModuleLoadingState, ModulePageHeader } from '../../../../shared/ui/modules'
import { nextLocalCode } from '@/shared/utils/code-format'
import { useProjects } from '../../../inventory/hooks/useProjects'
import {
  InventoryChartCard,
  InventoryKpi,
  inventoryGridGap,
  inventoryInput,
  inventoryPageStack,
  inventoryTableHead,
  inventoryTableRow,
} from '../../../inventory/components/InventoryVisuals'
import { ManufacturingOrderModal } from '../../../production/components/ManufacturingOrderModal'
import { ProductionBomModal } from '../../../production/components/ProductionBomModal'
import { useProductionBoms, useProductionIssues } from '../../../production/hooks/useProductionCockpit'
import type { ComponentCostingWarning, ProductionOrderRecord } from '../../api/contracts/components.contract'
import { calculateComponentMaterialReadiness } from '../../lib/material-readiness'
import {
  useComponents,
  useComponentCostingBreakdown,
  useComponentCosting,
  useCreateComponent,
  useDeleteComponent,
  useProductionOrders,
  useRecalculateComponentCosting,
} from '../../hooks/queries/useComponents'
import { formatCurrencyVnd, formatQuantity } from '@/shared/utils/number-format'
import {
  ComponentsDonut,
  ComponentsMiniBars,
  ComponentsSelect,
  componentsInput,
  componentsMutedButton,
  componentsPrimaryButton,
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
  rawStatus: string
  qty: number
  qc: number
  weight: number
  progress: number
  materialReady: number
  requiredQty: number
  issuedQty: number
  remainingQty: number
  hasBom: boolean
  hasProductionOrder: boolean
  workOrder: string
  dueDate?: string
  productionStatus?: string
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

const runningStatuses = new Set(['IN_PROGRESS', 'RUNNING', 'ACTIVE', 'CUTTING', 'WELDING', 'PAINTING'])
const completedStatuses = new Set(['DONE', 'COMPLETED', 'FINISHED', 'READY', 'SHIPPED', 'DELIVERED', 'INSTALLED'])

function isRunningStatus(status?: string) {
  return runningStatuses.has(String(status ?? '').toUpperCase())
}

function isCompletedStatus(status?: string) {
  return completedStatuses.has(String(status ?? '').toUpperCase())
}

function isDelayed(dueDate?: string, status?: string) {
  if (!dueDate || isCompletedStatus(status)) return false
  const due = new Date(dueDate)
  return !Number.isNaN(due.getTime()) && due < new Date()
}

function progressOf(status?: string, order?: ProductionOrderRecord) {
  const normalized = String(status ?? order?.status ?? '').toUpperCase()
  if (isCompletedStatus(normalized)) return 100
  if (normalized === 'PAINTING') return 75
  if (normalized === 'WELDING') return 50
  if (normalized === 'CUTTING' || normalized === 'IN_PROGRESS' || normalized === 'RUNNING' || normalized === 'ACTIVE') return 25
  if (order?.status === 'IN_PROGRESS') return 50
  return 0
}

function componentTypeBucket(type: string) {
  const raw = type.toLowerCase()
  if (raw.includes('beam') || raw.includes('dầm')) return 'Beam'
  if (raw.includes('column') || raw.includes('cột')) return 'Column'
  if (raw.includes('brace') || raw.includes('giằng')) return 'Brace'
  if (raw.includes('plate') || raw.includes('bản')) return 'Plate'
  return 'Assembly'
}

export function ComponentsListPage() {
  const routeLocation = useLocation()
  const routeComponentId =
    (routeLocation.state as ComponentsListRouteState)?.componentId
  const openedRouteComponentIdRef = useRef<string | null>(null)
  const { data: componentRecords = [], isLoading } = useComponents()
  const { data: productionOrders = [] } = useProductionOrders()
  const { data: projects = [] } = useProjects()
  const { data: productionBoms = [] } = useProductionBoms()
  const { data: productionIssues = [] } = useProductionIssues()
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
      const order = productionOrders.find((item) => item.componentId === record.id)
      const quantity = metadata.quantity ?? 1
      const readiness = calculateComponentMaterialReadiness({
        componentCode: record.code,
        fallbackQuantity: quantity,
        order,
        boms: productionBoms,
        issues: productionIssues,
      })
      const weight = Number(readiness.bom?.estimatedWeight ?? 0)

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
        rawStatus: record.status,
        qty: quantity,
        qc: metadata.qcQuantity ?? (record.status === 'READY' ? metadata.quantity ?? 1 : 0),
        weight,
        progress: progressOf(record.status, order),
        materialReady: readiness.readinessPercent,
        requiredQty: readiness.requiredQty,
        issuedQty: readiness.issuedQty,
        remainingQty: readiness.remainingQty,
        hasBom: readiness.hasBom,
        hasProductionOrder: readiness.hasProductionOrder,
        workOrder: order?.orderNo ?? '-',
        dueDate: order?.plannedEndAt,
        productionStatus: order?.status,
        createdAt: record.createdAt
          ? new Date(record.createdAt).toLocaleDateString('vi-VN')
          : '-',
      }
    })
  }, [componentRecords, productionBoms, productionIssues, productionOrders])

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
      if (status && row.status !== status && row.rawStatus !== status) return false
      if (type && row.type !== type) return false
      if (location && row.location !== location) return false
      if (query && !`${row.code} ${row.name}`.toLowerCase().includes(query.toLowerCase())) return false
      return true
    })
  }, [rows, project, status, type, location, query])

  const cockpitKpis = useMemo(() => ({
    total: rows.length,
    running: rows.filter((row) => isRunningStatus(row.rawStatus) || isRunningStatus(row.productionStatus)).length,
    completed: rows.filter((row) => isCompletedStatus(row.rawStatus) || isCompletedStatus(row.productionStatus)).length,
    waitingMaterial: rows.filter((row) => row.hasBom && row.materialReady < 100).length,
    delayed: rows.filter((row) => isDelayed(row.dueDate, row.productionStatus ?? row.rawStatus)).length,
    weight: rows.reduce((sum, row) => sum + Number(row.weight ?? 0), 0),
  }), [rows])
  const componentAnalytics = useMemo(() => {
    const topWeight = [...rows].sort((a, b) => Number(b.weight ?? 0) - Number(a.weight ?? 0)).slice(0, 5)
    const delayedRows = rows.filter((row) => isDelayed(row.dueDate, row.productionStatus ?? row.rawStatus)).slice(0, 5)
    const materialShortage = rows.filter((row) => row.hasBom && row.materialReady < 100).sort((a, b) => a.materialReady - b.materialReady).slice(0, 5)
    const structure = ['Beam', 'Column', 'Brace', 'Plate', 'Assembly'].map((label) => ({
      label,
      value: rows.filter((row) => componentTypeBucket(row.type) === label).length,
      color: { Beam: '#1d7cff', Column: '#14c987', Brace: '#f59e0b', Plate: '#7c3aed', Assembly: '#06b6d4' }[label] ?? '#06b6d4',
    }))
    return { topWeight, delayedRows, materialShortage, structure }
  }, [rows])

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
    const code = nextLocalCode('CPL')
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

  const productionComponents = componentRecords.map((record) => ({
    id: record.id,
    code: record.code,
    name: record.name,
    projectId: record.projectId,
    project: record.project,
  }))
  const selectedOrders = selected
    ? productionOrders.filter((order) => order.componentId === selected.id)
    : []
  const selectedBoms = selected
    ? productionBoms.filter((bom) =>
        bom.status !== 'ARCHIVED' &&
        (bom.productCode === selected.code || selectedOrders.some((order) => order.bomId === bom.id)),
      )
    : []
  const selectedRequiredQty = selected?.requiredQty ?? 0
  const selectedIssuedQty = selected?.issuedQty ?? 0
  const selectedRemainingQty = selected?.remainingQty ?? 0

  return (
    <EnterpriseModulePage>
      <div className={inventoryPageStack}>
        <ModulePageHeader
          eyebrow="Steel component lifecycle"
          title="Trung tâm điều hành cấu kiện"
          description="Theo dõi cấu kiện từ BOM, lệnh sản xuất, QC, bãi, giao hàng đến lắp đặt."
          action={<button onClick={() => setCreateOpen(true)} className={componentsPrimaryButton}>+ Tạo cấu kiện</button>}
        />

        <ModuleKpiStrip className="grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
          <InventoryKpi title="Tổng cấu kiện" value={formatQuantity(cockpitKpis.total, 0)} note="Toàn bộ cấu kiện" tone="blue" />
          <InventoryKpi title="Đang sản xuất" value={formatQuantity(cockpitKpis.running, 0)} note="IN_PROGRESS / RUNNING" tone="cyan" />
          <InventoryKpi title="Hoàn thành" value={formatQuantity(cockpitKpis.completed, 0)} note="DONE / COMPLETED / READY+" tone="emerald" />
          <InventoryKpi title="Chờ vật tư" value={formatQuantity(cockpitKpis.waitingMaterial, 0)} note="Issued / Required < 100%" tone="amber" />
          <InventoryKpi title="Trễ tiến độ" value={formatQuantity(cockpitKpis.delayed, 0)} note="Quá hạn chưa hoàn thành" tone="red" />
          <InventoryKpi title="Khối lượng cấu kiện" value={`${formatQuantity(cockpitKpis.weight, 3)} kg`} note="Theo BOM hiện có" tone="purple" />
        </ModuleKpiStrip>

        <ModuleFilterBar>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm theo mã, tên, profile, dự án, vị trí..."
            className={`${inventoryInput} xl:col-span-4`}
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
            <option value="READY">READY</option>
            <option value="SHIPPED">SHIPPED</option>
            <option value="DELIVERED">DELIVERED</option>
            <option value="INSTALLED">INSTALLED</option>
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
        </ModuleFilterBar>

        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => openProductionFor()} className="rounded-xl border border-emerald-400/30 bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-500">
            + Tạo lệnh sản xuất
          </button>
          <button onClick={() => openBomFor()} className={componentsMutedButton}>
            + Tạo Production BOM
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <div className="xl:col-span-9">
            <InventoryChartCard title={`Danh sách cấu kiện (${filtered.length})`} note="Production cockpit grid">
              <ModuleDataGrid>
                <div className="overflow-auto">
                <table className="w-full min-w-[1320px] text-sm">
                  <thead className={inventoryTableHead}>
                    <tr>
                      {['Mã cấu kiện', 'Tên cấu kiện', 'Profile/Kích thước', 'Loại', 'Dự án', 'Work Order', 'Progress', 'Material Ready', 'Vị trí hiện tại', 'Trạng thái', 'Khối lượng', 'Ngày tạo', 'Thao tác'].map((h) => (
                        <th key={h} className="px-2 py-2 text-left font-medium">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={13} className="px-2 py-6">
                          <ModuleLoadingState label="Đang tải dữ liệu cấu kiện..." />
                        </td>
                      </tr>
                    ) : filtered.map((row) => (
                      <tr
                        key={row.code}
                        onClick={() => openDetail(row)}
                        className={`cursor-pointer ${inventoryTableRow}`}
                      >
                        <td className="px-2 py-2 text-cyan-300">{row.code}</td>
                        <td className="px-2 py-2">{row.name}</td>
                        <td className="px-2 py-2">{row.profile}</td>
                        <td className="px-2 py-2">{row.type}</td>
                        <td className="px-2 py-2">{row.project}</td>
                        <td className="px-2 py-2 text-cyan-300">{row.workOrder}</td>
                        <td className="px-2 py-2"><ProgressMeter value={row.progress} /></td>
                        <td className="px-2 py-2"><ProgressMeter value={row.materialReady} tone={row.materialReady < 100 ? 'amber' : 'emerald'} /></td>
                        <td className="px-2 py-2">{row.location}</td>
                        <td className="px-2 py-2">{row.status}</td>
                        <td className="px-2 py-2 font-mono tabular-nums">{formatQuantity(row.weight, 3)} kg</td>
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
              </ModuleDataGrid>
              {!isLoading && !filtered.length ? <div className="p-3"><ModuleEmptyState title="Không tìm thấy cấu kiện" description="Thử đổi từ khóa hoặc bộ lọc trạng thái/dự án." /></div> : null}
              <div className="mt-3 text-xs text-slate-400">Hiển thị 1 - {filtered.length} của {filtered.length} kết quả</div>
            </InventoryChartCard>
          </div>

          <div className="space-y-4 xl:col-span-3">
            <InventoryChartCard title="Top cấu kiện theo khối lượng" note="Theo BOM hiện có">
              <RankList rows={componentAnalytics.topWeight.map((row) => ({ id: row.id, title: row.code, subtitle: row.name, value: `${formatQuantity(row.weight, 3)} kg` }))} />
            </InventoryChartCard>
            <InventoryChartCard title="Top cấu kiện chậm tiến độ" note="Due date < Today">
              <RankList rows={componentAnalytics.delayedRows.map((row) => ({ id: row.id, title: row.code, subtitle: row.dueDate ? new Date(row.dueDate).toLocaleDateString('vi-VN') : '-', value: row.workOrder }))} empty="Không có cấu kiện trễ tiến độ" />
            </InventoryChartCard>
            <InventoryChartCard title="Cấu kiện thiếu vật tư" note="BOM required - issued">
              <RankList rows={componentAnalytics.materialShortage.map((row) => ({ id: row.id, title: row.code, subtitle: row.name, value: `${formatQuantity(row.materialReady, 0)}%` }))} empty="Chưa phát hiện thiếu vật tư" />
            </InventoryChartCard>
            <InventoryChartCard title="Cơ cấu cấu kiện" note="Beam / Column / Brace / Plate / Assembly">
              <ComponentsDonut
                centerValue={formatQuantity(rows.length, 0)}
                centerLabel="cấu kiện"
                segments={componentAnalytics.structure}
              />
            </InventoryChartCard>
            <InventoryChartCard title="Nhịp tạo cấu kiện" note="Xu hướng 12 kỳ gần nhất">
              <ComponentsMiniBars values={[18, 24, 16, 31, 28, 35, 42, 38, 44, 49, 46, 52]} />
            </InventoryChartCard>
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

      <ModuleDetailDrawer
        open={detailOpen && Boolean(selected)}
        title={selected?.name ?? ''}
        subtitle={selected ? `${selected.code} · ${selected.profile} · ${selected.project}` : undefined}
        onClose={() => setDetailOpen(false)}
        actions={selected ? (
          <>
                <button onClick={() => openBomFor(selected)} className={componentsMutedButton}>Tạo BOM</button>
                <button onClick={() => openProductionFor(selected)} className="rounded-xl border border-emerald-400/30 bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white">Sản xuất</button>
                <button onClick={() => void handleDelete(selected)} className="rounded-lg border border-red-800 px-3 py-2 text-sm text-red-300">Xóa</button>
          </>
        ) : null}
      >
        {selected ? (
          <>
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                <div className="text-xs text-slate-400">Trạng thái</div>
                <div className="mt-1 text-lg font-semibold text-white">{selected.status}</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                <div className="text-xs text-slate-400">Số lượng hiện tại</div>
                <div className="mt-1 text-lg font-semibold text-white">{formatQuantity(selected.qty, 0)} kiện</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                <div className="text-xs text-slate-400">Vị trí hiện tại</div>
                <div className="mt-1 text-lg font-semibold text-white">{selected.location}</div>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.035] p-4">
              <div className="mb-3 text-sm font-semibold text-white">Thông tin cấu kiện</div>
              <div className="grid grid-cols-2 gap-3 xl:grid-cols-6">
                <CostMetric title="Code" value={selected.code} />
                <CostMetric title="Name" value={selected.name} />
                <CostMetric title="Type" value={selected.type} />
                <CostMetric title="Project" value={selected.project} />
                <CostMetric title="Weight" value={`${formatQuantity(selected.weight, 3)} kg`} />
                <CostMetric title="Status" value={selected.rawStatus} />
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
                      <td className="px-2 py-2">{formatQuantity(bom.estimatedWeight, 0)} kg</td>
                      <td className="px-2 py-2"><span className="rounded bg-emerald-950 px-2 py-1 text-xs text-emerald-300">{bom.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-white/[0.035] p-4">
                <div className="mb-3">
                  <div className="text-sm font-semibold text-white">Vật tư</div>
                  <div className="mt-1 text-xs text-slate-500">Tính theo BOM required và Production Material Issue đã cấp phát.</div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <CostMetric title="Required" value={quantity(selectedRequiredQty)} />
                  <CostMetric title="Issued" value={quantity(selectedIssuedQty)} tone="text-emerald-300" />
                  <CostMetric title="Remaining" value={quantity(selectedRemainingQty)} tone={selectedRemainingQty > 0 ? 'text-amber-300' : 'text-cyan-300'} />
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.035] p-4">
                <div className="mb-3 text-sm font-semibold text-white">Tiến độ</div>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                  {['Planning', 'Cutting', 'Assembly', 'Welding', 'Painting', 'Finished'].map((step, index) => {
                    const active = selected.progress >= [0, 25, 35, 50, 75, 100][index]
                    return <div key={step} className={`rounded-xl border px-3 py-2 text-xs ${active ? 'border-cyan-400/40 bg-cyan-400/10 text-cyan-200' : 'border-white/10 bg-white/[0.035] text-slate-500'}`}>{step}</div>
                  })}
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.035] p-4">
              <div className="mb-3 text-sm font-semibold text-white">Work Orders</div>
              <ModuleDataGrid>
                <table className="w-full text-sm">
                  <thead className={inventoryTableHead}>
                    <tr>
                      {['MO', 'Title', 'Status', 'Qty', 'Start', 'Due'].map((head) => <th key={head} className="px-3 py-2 text-left">{head}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrders.length ? selectedOrders.map((order) => (
                      <tr key={order.id} className={inventoryTableRow}>
                        <td className="px-3 py-2 text-cyan-300">{order.orderNo}</td>
                        <td className="px-3 py-2">{order.title}</td>
                        <td className="px-3 py-2">{order.status}</td>
                        <td className="px-3 py-2">{formatQuantity(order.quantity, 3)}</td>
                        <td className="px-3 py-2">{order.plannedStartAt ? new Date(order.plannedStartAt).toLocaleDateString('vi-VN') : '-'}</td>
                        <td className="px-3 py-2">{order.plannedEndAt ? new Date(order.plannedEndAt).toLocaleDateString('vi-VN') : '-'}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan={6} className="px-3 py-5 text-center text-slate-500">Chưa có work order liên quan.</td></tr>
                    )}
                  </tbody>
                </table>
              </ModuleDataGrid>
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
          </>
        ) : null}
      </ModuleDetailDrawer>
    </EnterpriseModulePage>
  )
}

function money(value?: number | null) {
  return formatCurrencyVnd(value)
}

function ProgressMeter({ value, tone = 'cyan' }: { value: number; tone?: 'cyan' | 'emerald' | 'amber' | 'red' }) {
  const color = tone === 'emerald' ? 'bg-emerald-500' : tone === 'amber' ? 'bg-amber-500' : tone === 'red' ? 'bg-red-500' : 'bg-cyan-500'
  return (
    <div className="min-w-[120px]">
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
      </div>
      <div className="mt-1 text-[10px] text-slate-500">{formatQuantity(value, 0)}%</div>
    </div>
  )
}

function RankList({
  rows,
  empty = 'Chưa có dữ liệu',
}: {
  rows: Array<{ id: string; title: string; subtitle?: string; value: string }>
  empty?: string
}) {
  if (!rows.length) {
    return <div className="rounded-xl border border-white/10 bg-white/[0.035] p-4 text-center text-sm text-slate-500">{empty}</div>
  }
  return (
    <div className="space-y-2">
      {rows.map((row) => (
        <div key={row.id} className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs">
          <div className="min-w-0">
            <div className="truncate font-semibold text-cyan-300">{row.title}</div>
            {row.subtitle ? <div className="mt-0.5 truncate text-slate-500">{row.subtitle}</div> : null}
          </div>
          <div className="font-mono tabular-nums text-slate-200">{row.value}</div>
        </div>
      ))}
    </div>
  )
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
  return formatQuantity(value, 3)
}
