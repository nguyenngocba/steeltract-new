import { useEffect, useMemo, useState, type ReactNode } from 'react'
import toast from 'react-hot-toast'
import { Archive, Boxes, ClipboardList, Factory, FileStack, Search, Wrench } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

import { OperationalShell } from '@/shared/layouts/OperationalShell'
import { ModuleDataGrid, ModuleDetailDrawer, ModuleEmptyState, ModuleFilterBar, ModuleKpiStrip } from '@/shared/ui/modules'
import { CockpitChartCard, CockpitKpiCard, CockpitTableShell, COCKPIT_HEIGHTS, DataTablePagination } from '@/shared/ui/cockpit'
import {
  InventoryChartCard,
  InventoryKpi,
  inventoryGridGap,
  inventoryInput,
  inventoryMutedButton,
  inventoryPageStack,
  inventoryTableHead,
  inventoryTableRow,
} from '@/modules/inventory/components/InventoryVisuals'

import type { ProductionBom, ProductionComponent, ProductionMaterialConsumption, ProductionMaterialIssue, ProductionMaterialLedger, ProductionMaterialLedgerParams, ProductionOrder, ProductionReservation } from '../api/production.api'
import { calculateComponentMaterialReadiness } from '@/modules/components/lib/material-readiness'
import {
  Meter,
  ProductionDonut,
  ProductionMiniBars,
  ProductionPanel,
  StatusChip,
} from '../components/ProductionCockpitShared'
import { ProductionExecutionBoard } from '../components/ProductionExecutionBoard'
import { ManufacturingOrderModal } from '../components/ManufacturingOrderModal'
import { ProductionBomModal } from '../components/ProductionBomModal'
import { productionTabs } from '../config/production-tabs'
import { useInventoryAudit } from '@/modules/inventory/hooks/useInventoryAudit'
import { useInventoryItems } from '@/modules/inventory/hooks/useInventoryItems'
import { formatCurrencyVnd, formatDateTime, formatQuantity, formatQuantityInput, parseLocaleNumber } from '@/shared/utils/number-format'
import {
  useMaterialRequirements,
  useArchiveProductionBom,
  useCloneProductionBom,
  useCompleteProductionStage,
  useConsumeProductionMaterial,
  useCreateComponentFromProductionOrder,
  useCreateProductionReservation,
  useExpireProductionReservation,
  useIssueProductionReservation,
  useProductionBoms,
  useProductionComponents,
  useProductionConsumptions,
  useProductionIssues,
  useProductionLogs,
  useProductionMaterialLedger,
  useProductionOrder,
  useProductionOrders,
  useProductionReservations,
  useReleaseProductionReservation,
  useReservationPreview,
  useReturnProductionMaterialIssue,
  useReserveProductionReservation,
  useStageProductionToYard,
  useStartProductionOrder,
  useYardSlots,
} from '../hooks/useProductionCockpit'

const number = (value = 0) => formatQuantity(value, 3)
const date = (value?: string) => value ? new Date(value).toLocaleDateString('vi-VN') : '-'

function sameDay(value?: string) {
  if (!value) return false
  const input = new Date(value)
  if (Number.isNaN(input.getTime())) return false
  const now = new Date()
  return input.getFullYear() === now.getFullYear() && input.getMonth() === now.getMonth() && input.getDate() === now.getDate()
}

function isDelayedOrder(order: ProductionOrder) {
  if (['COMPLETED', 'CANCELLED'].includes(order.status)) return false
  if (order.status === 'DELAYED') return true
  if (!order.plannedEndAt) return false
  const end = new Date(order.plannedEndAt)
  return !Number.isNaN(end.getTime()) && end < new Date()
}

function orderProgress(order: ProductionOrder) {
  if (order.status === 'COMPLETED') return 100
  const stages = order.stages ?? []
  if (stages.length) {
    const completed = stages.filter((stage) => stage.status === 'COMPLETED').length
    const running = stages.some((stage) => stage.status === 'IN_PROGRESS' || stage.status === 'READY') ? 0.5 : 0
    return Math.min(99, Math.round(((completed + running) / stages.length) * 100))
  }
  if (order.status === 'IN_PROGRESS') return 58
  if (isDelayedOrder(order)) return 22
  return 12
}

function orderStatusTone(order: ProductionOrder) {
  if (order.status === 'COMPLETED') return 'bg-emerald-500'
  if (isDelayedOrder(order)) return 'bg-red-500'
  if (order.status === 'IN_PROGRESS') return 'bg-cyan-500'
  return 'bg-amber-500'
}

function orderMaterialReadiness(order: ProductionOrder) {
  const readiness = workOrderReadiness(order)
  if (!readiness.hasBom) return { label: 'Thiếu BOM', className: 'border-red-500/40 bg-red-500/10 text-red-300', readiness }
  if (readiness.readinessPercent >= 100) return { label: 'READY TO RELEASE', className: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300', readiness }
  if (readiness.readinessPercent >= 80) return { label: 'Gần đủ vật tư', className: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300', readiness }
  if (readiness.readinessPercent >= 50) return { label: 'Thiếu một phần', className: 'border-amber-500/40 bg-amber-500/10 text-amber-300', readiness }
  return { label: 'Thiếu vật tư', className: 'border-red-500/40 bg-red-500/10 text-red-300', readiness }
}

function stageFamily(value?: string) {
  const raw = String(value ?? '').toLowerCase()
  if (raw.includes('cut') || raw.includes('cắt')) return 'Cutting'
  if (raw.includes('assembl') || raw.includes('lắp')) return 'Assembly'
  if (raw.includes('weld') || raw.includes('hàn')) return 'Welding'
  if (raw.includes('paint') || raw.includes('sơn')) return 'Painting'
  if (raw.includes('finish') || raw.includes('hoàn')) return 'Finished'
  return 'Waiting'
}

function workOrderReadiness(order: ProductionOrder, issues: ProductionMaterialIssue[] = []) {
  return calculateComponentMaterialReadiness({
    componentCode: order.component?.code ?? order.bom?.productCode ?? order.orderNo,
    fallbackQuantity: Number(order.quantity ?? 1),
    order,
    boms: order.bom ? [order.bom] : [],
    issues,
  })
}

function readinessTone(percent: number) {
  if (percent >= 100) return 'emerald'
  if (percent >= 80) return 'cyan'
  if (percent >= 50) return 'amber'
  return 'red'
}

function readinessBarClass(percent: number) {
  if (percent >= 100) return 'bg-emerald-500'
  if (percent >= 80) return 'bg-cyan-500'
  if (percent >= 50) return 'bg-amber-500'
  return 'bg-red-500'
}

function workOrderStageProgress(order: ProductionOrder) {
  const stages = ['Planning', 'Cutting', 'Assembly', 'Welding', 'Painting', 'Finished']
  const progress = orderProgress(order)
  return stages.map((stage, index) => ({
    stage,
    active: progress >= [0, 25, 35, 50, 75, 100][index],
  }))
}

export function ProductionCockpitPage() {
  const location = useLocation()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<ProductionOrder>()
  const [selectedBom, setSelectedBom] = useState<ProductionBom>()
  const [createOrderOpen, setCreateOrderOpen] = useState(false)
  const [createBomOpen, setCreateBomOpen] = useState(false)
  const [ledgerFilters, setLedgerFilters] = useState<ProductionMaterialLedgerParams>({})
  const { data: orders = [] } = useProductionOrders()
  const { data: boms = [] } = useProductionBoms()
  const { data: issues = [] } = useProductionIssues()
  const { data: consumptions = [] } = useProductionConsumptions()
  const { data: reservations = [] } = useProductionReservations()
  const ledgerQueryParams = useMemo(() => ({
    productionOrderId: ledgerFilters.productionOrderId || undefined,
    inventoryItemId: ledgerFilters.inventoryItemId || undefined,
    eventType: ledgerFilters.eventType || undefined,
    fromDate: ledgerFilters.fromDate || undefined,
    toDate: ledgerFilters.toDate || undefined,
  }), [ledgerFilters])
  const { data: ledger = [] } = useProductionMaterialLedger(ledgerQueryParams)
  const { data: logs = [] } = useProductionLogs()
  const { data: components = [] } = useProductionComponents()
  const { data: inventoryItems = [] } = useInventoryItems()
  const { data: inventoryAudit = [] } = useInventoryAudit()

  const view = location.pathname.split('/').at(-1) ?? 'production'
  const mode = view === 'production' ? 'overview' : view
  const filteredOrders = useMemo(() => orders.filter((row) => {
    if (statusFilter && row.status !== statusFilter) return false
    return `${row.orderNo} ${row.title} ${row.status}`.toLowerCase().includes(search.toLowerCase())
  }), [orders, search, statusFilter])
  const filteredBoms = useMemo(() => boms.filter((row) =>
    `${row.bomNo} ${row.productCode} ${row.productName}`.toLowerCase().includes(search.toLowerCase())), [boms, search])

  const completed = orders.filter((item) => item.status === 'COMPLETED').length
  const inProgress = orders.filter((item) => item.status === 'IN_PROGRESS').length
  const planned = orders.filter((item) => item.status === 'PLANNED').length
  const released = orders.filter((item) => item.status === 'RELEASED').length
  const completedToday = orders.filter((item) => item.status === 'COMPLETED' && sameDay(item.plannedEndAt)).length
  const waitingMaterial = orders.filter((item) => item.bom && !(item.materialIssues ?? []).length && item.status !== 'COMPLETED').length
  const delayed = orders.filter(isDelayedOrder).length
  const runningComponents = orders.filter((item) => item.status === 'IN_PROGRESS' && item.component).length
  const productionWeight = orders.reduce((sum, item) => sum + Number(item.quantity ?? 0) * Number(item.bom?.estimatedWeight ?? 0), 0)
  const isWorkOrderMode = mode === 'orders'

  return <OperationalShell>
    <main className="min-h-screen bg-[radial-gradient(circle_at_20%_0%,rgba(14,165,233,0.13),transparent_30%),radial-gradient(circle_at_88%_8%,rgba(99,102,241,0.11),transparent_26%),linear-gradient(180deg,#08111f_0%,#101827_48%,#0b1220_100%)] p-3 text-slate-100">
      <div className="w-full min-w-0 flex-1 space-y-1">
      <div className="flex items-center justify-end gap-1">
        <button onClick={() => setCreateOrderOpen(true)} className={`${inventoryMutedButton} h-9 rounded-xl`}>+ Tạo lệnh sản xuất</button>
        <button onClick={() => setCreateBomOpen(true)} className={`${inventoryMutedButton} h-9 rounded-xl`}>+ Tạo BOM</button>
        <button className={`${inventoryMutedButton} h-9 rounded-xl`}>Xuất báo cáo</button>
      </div>

      <nav className="overflow-auto rounded-xl border border-white/10 bg-white/[0.055] p-1 shadow-[0_18px_44px_rgba(0,0,0,0.18)] backdrop-blur-xl">
        <div className="flex min-w-max gap-1">
        {productionTabs.map((tab) => <Link key={tab.path} to={tab.path}
          className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${location.pathname === tab.path ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400/30' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`}>
          {tab.label}
        </Link>)}
        </div>
      </nav>

      <div className="grid grid-cols-1 gap-1 md:grid-cols-3 xl:grid-cols-6">
        {isWorkOrderMode ? (
          <>
            <CockpitKpiCard title="Total Work Orders" value={number(orders.length)} note="REAL · Tất cả WO/MO" tone="blue" state="normal" />
            <CockpitKpiCard title="Planned" value={number(planned)} note="REAL · Đã lập kế hoạch" tone="purple" state="normal" />
            <CockpitKpiCard title="Released" value={number(released)} note="REAL · Sẵn sàng phát hành" tone="cyan" state="normal" />
            <CockpitKpiCard title="In Progress" value={number(inProgress)} note="REAL · Đang sản xuất" tone="emerald" state="normal" />
            <CockpitKpiCard title="Completed" value={number(completed)} note="REAL · Đã hoàn thành" tone="emerald" state="normal" />
            <CockpitKpiCard title="Delayed" value={number(delayed)} note="REAL · Quá hạn/chậm tiến độ" tone="red" state="normal" />
          </>
        ) : (
          <>
            <CockpitKpiCard title="Đang sản xuất" value={number(inProgress)} note="REAL · Đang chạy tại xưởng" tone="cyan" state="normal" active={statusFilter === 'IN_PROGRESS'} onClick={() => setStatusFilter('IN_PROGRESS')} />
            <CockpitKpiCard title="Hoàn thành hôm nay" value={number(completedToday)} note={`REAL · ${number(completed)} hoàn thành tổng`} tone="emerald" state="normal" active={statusFilter === 'COMPLETED'} onClick={() => setStatusFilter('COMPLETED')} />
            <CockpitKpiCard title="Chờ vật tư" value={number(waitingMaterial)} note="REAL · MO chưa có issue" tone="amber" state="normal" />
            <CockpitKpiCard title="Trễ tiến độ" value={number(delayed)} note="REAL · Quá hạn hoặc delayed" tone="red" state="normal" active={statusFilter === 'DELAYED'} onClick={() => setStatusFilter('DELAYED')} />
            <CockpitKpiCard title="Cấu kiện đang chạy" value={number(runningComponents)} note="REAL · Đang sản xuất" tone="purple" state="normal" />
            <CockpitKpiCard title="Khối lượng sản xuất" value={`${number(productionWeight)} kg`} note="REAL · Theo BOM x MO" tone="blue" state="normal" />
          </>
        )}
      </div>

      <ModuleFilterBar className="my-1">
        <div className="flex min-w-64 items-center gap-2 rounded-lg border border-white/10 bg-slate-950/45 px-2 xl:col-span-5">
          <Search size={15} className="text-cyan-400" />
          <input value={search} onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm mã, kết cấu, BOM, trạng thái..." className={`${inventoryInput} w-full border-0 bg-transparent px-0 focus:border-0 focus:bg-transparent`} />
        </div>
        <button onClick={() => setStatusFilter('')} className={`${inventoryMutedButton} xl:col-span-1 ${!statusFilter ? 'border-cyan-400/50 text-cyan-200' : ''}`}>Trạng thái: Tất cả</button>
        {['Xưởng: Tất cả', 'Dự án: Tất cả', 'Ưu tiên: Tất cả'].map((text) =>
          <button key={text} className={`${inventoryMutedButton} xl:col-span-1`}>{text}</button>)}
      </ModuleFilterBar>

      {mode === 'overview' && <Overview orders={filteredOrders} logs={logs} reservations={reservations} issues={issues} components={components} onOpen={setSelectedOrder} />}
      {mode === 'boms' && <Boms rows={filteredBoms} onOpen={setSelectedBom} onCreate={() => setCreateBomOpen(true)} />}
      {mode === 'orders' && <Orders rows={filteredOrders} onOpen={setSelectedOrder} />}
      {mode === 'planning' && <Orders rows={filteredOrders.filter((row) => ['PLANNED', 'RELEASED'].includes(row.status))} onOpen={setSelectedOrder} />}
      {mode === 'execution' && <ProductionExecutionBoard orders={orders} issues={issues} reservations={reservations} />}
      {mode === 'reservations' && <Reservations rows={reservations} orders={orders} onOpen={setSelectedOrder} />}
      {mode === 'warehouse' && <ProductionWarehouseCockpit inventoryItems={inventoryItems as InventoryItemLike[]} auditRows={inventoryAudit as InventoryAuditLike[]} orders={orders} reservations={reservations} consumptions={consumptions} />}
      {mode === 'material-ledger' && <MaterialLedger rows={ledger} orders={orders} filters={ledgerFilters} onFiltersChange={setLedgerFilters} />}
      {mode === 'material-issues' && <Issues rows={issues} consumptions={consumptions} orders={orders} />}
      {mode === 'consumptions' && <Consumptions issues={issues} consumptions={consumptions} />}
      {mode === 'incidents' && <ProductionNavigationPlaceholder title="Sự cố sản xuất" description="Tab đã được đồng bộ route/sidebar. Chưa có workflow sự cố riêng nên chưa hiển thị dữ liệu nghiệp vụ." icon={<Wrench size={18} />} />}
      {mode === 'logs' && <Logs rows={logs} />}
      {mode === 'reports' && <ProductionNavigationPlaceholder title="Báo cáo sản xuất" description="Tab đã được đồng bộ route/sidebar. Báo cáo quản trị sẽ dùng dữ liệu sản xuất hiện có ở phase sau." icon={<FileStack size={18} />} />}

      {selectedOrder && <OrderWorkspace order={selectedOrder} onClose={() => setSelectedOrder(undefined)} />}
      {selectedBom && <BomWorkspace bom={selectedBom} onClose={() => setSelectedBom(undefined)} />}
      {createOrderOpen && <ManufacturingOrderModal components={components} boms={boms} onClose={() => setCreateOrderOpen(false)} />}
      {createBomOpen && <ProductionBomModal components={components} onClose={() => setCreateBomOpen(false)} />}
      </div>
    </main>
  </OperationalShell>
}

function ProductionNavigationPlaceholder({
  title,
  description,
  icon,
}: {
  title: string
  description: string
  icon: ReactNode
}) {
  return <div className="grid gap-1 xl:grid-cols-[minmax(0,1fr)_320px]">
    <CockpitTableShell className={COCKPIT_HEIGHTS.TABLE_MD}>
      <ModuleEmptyState title={title} description={description} icon={icon} />
    </CockpitTableShell>
    <aside className="space-y-1">
      <CockpitChartCard title="Trạng thái" className={COCKPIT_HEIGHTS.CHART_SM}>
        <ModuleEmptyState title="Chưa có dữ liệu" description="Không có dữ liệu riêng cho tab này trong API hiện tại." icon={icon} />
      </CockpitChartCard>
      <CockpitChartCard title="Gần đây" className={COCKPIT_HEIGHTS.CHART_SM}>
        <ModuleEmptyState title="Chưa có hoạt động" description="Hoạt động sẽ hiển thị khi backend bổ sung nguồn dữ liệu tương ứng." icon={icon} />
      </CockpitChartCard>
    </aside>
  </div>
}

function Overview({
  orders,
  logs,
  reservations,
  issues,
  components,
  onOpen,
}: {
  orders: ProductionOrder[]
  logs: ReturnType<typeof useProductionLogs>['data']
  reservations: ProductionReservation[]
  issues: ProductionMaterialIssue[]
  components: ProductionComponent[]
  onOpen: (row: ProductionOrder) => void
}) {
  const running = orders.filter((row) => row.status === 'IN_PROGRESS').length
  const pending = orders.filter((row) => !['IN_PROGRESS', 'COMPLETED'].includes(row.status) && !isDelayedOrder(row)).length
  const completed = orders.filter((row) => row.status === 'COMPLETED').length
  const stageRows = ['Cutting', 'Assembly', 'Welding', 'Painting', 'Finished'].map((label) => [
    label,
    orders.filter((row) => stageFamily(row.currentStageCode ?? row.stages?.find((stage) => stage.status === 'IN_PROGRESS' || stage.status === 'READY')?.name) === label).length,
  ] as [string, number])
  const issuedOrders = new Set(issues.map((issue) => issue.productionOrderId))
  const reservedOrders = new Set(reservations.filter((row) => ['RESERVED', 'PARTIALLY_ISSUED'].includes(row.status)).map((row) => row.productionOrderId))
  const issued = orders.filter((row) => issuedOrders.has(row.id)).length
  const waiting = orders.filter((row) => !issuedOrders.has(row.id) && reservedOrders.has(row.id)).length
  const shortage = orders.filter((row) => row.bom && !issuedOrders.has(row.id) && !reservedOrders.has(row.id) && row.status !== 'COMPLETED').length
  const activeComponents = components
    .filter((component) => orders.some((order) => order.component?.id === component.id && order.status !== 'COMPLETED'))
    .slice(0, 5)

  return <div className="w-full min-w-0 flex-1 space-y-1">
    <div className="grid grid-cols-1 gap-1 xl:grid-cols-12">
      <div className="xl:col-span-9">
        <Orders rows={orders} onOpen={onOpen} embedded />
      </div>
      <aside className="space-y-1 xl:col-span-3">
        <CockpitChartCard title="Tiến độ sản xuất" subtitle="REAL · Running / Pending / Completed" heightClass={COCKPIT_HEIGHTS.CHART_SM}>
          <ProductionDonut
            centerValue={formatQuantity(orders.length, 0)}
            centerLabel="MO"
            segments={[
              { label: 'Running', value: running, color: '#06b6d4' },
              { label: 'Pending', value: pending, color: '#f59e0b' },
              { label: 'Completed', value: completed, color: '#14c987' },
            ]}
          />
        </CockpitChartCard>
        <CockpitChartCard title="Vật tư cấp phát" subtitle="REAL · Issue / reservation hiện có" heightClass={COCKPIT_HEIGHTS.CHART_SM}>
          <ProductionDonut
            centerValue={formatQuantity(orders.length, 0)}
            centerLabel="MO"
            segments={[
              { label: 'Đã cấp phát', value: issued, color: '#14c987' },
              { label: 'Chờ cấp phát', value: waiting, color: '#f59e0b' },
              { label: 'Thiếu vật tư', value: shortage, color: '#ef4444' },
            ]}
          />
        </CockpitChartCard>
        <CockpitChartCard title="Hoạt động gần đây" subtitle="REAL · Nhật ký thực thi" heightClass={COCKPIT_HEIGHTS.CHART_SM}>
          {(logs ?? []).length ? <ActivityList logs={(logs ?? []).slice(0, 4)} /> : (
            <ModuleEmptyState icon={<span>🕒</span>} title="Chưa có hoạt động gần đây" description="Nhật ký production sẽ hiển thị khi có thao tác thực thi." />
          )}
        </CockpitChartCard>
      </aside>
    </div>
    <div className="grid grid-cols-1 gap-1 xl:grid-cols-3">
      <CockpitChartCard title="Công đoạn sản xuất" subtitle="REAL · Phân bổ theo công đoạn hiện tại" heightClass={COCKPIT_HEIGHTS.CHART_LG}>
        <ProductionMiniBars values={stageRows.map(([, value]) => value || 1)} />
        <div className="mt-2 grid grid-cols-2 gap-1 text-xs md:grid-cols-5">
          {stageRows.map(([label, value]) => <Info key={label} k={label} v={formatQuantity(value, 0)} />)}
        </div>
      </CockpitChartCard>
      <CockpitChartCard title="Cấu kiện đang sản xuất" subtitle="REAL · Top 5 lệnh đang mở" heightClass={COCKPIT_HEIGHTS.CHART_LG}>
        <div className="space-y-1">
          {activeComponents.length ? activeComponents.map((component) => (
            <div key={component.id} className="grid grid-cols-[1fr_auto] items-center gap-1 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs">
              <div className="min-w-0">
                <div className="truncate font-semibold text-cyan-300">{component.code}</div>
                <div className="truncate text-slate-400">{component.name}</div>
              </div>
              <StatusChip status="RUNNING" />
            </div>
          )) : <ModuleEmptyState icon={<span>🏭</span>} title="Chưa có cấu kiện đang sản xuất" description="Các cấu kiện có lệnh sản xuất mở sẽ xuất hiện tại đây." />}
        </div>
      </CockpitChartCard>
      <CockpitChartCard title="Thao tác nhanh" subtitle="REAL · Lối tắt vận hành" heightClass={COCKPIT_HEIGHTS.CHART_LG}>
        <ActionCards compact />
      </CockpitChartCard>
    </div>
  </div>
}

function Orders({ rows, onOpen, embedded = false }: { rows: ProductionOrder[]; onOpen: (row: ProductionOrder) => void; embedded?: boolean }) {
  const enriched = rows.map((row) => {
    const readiness = orderMaterialReadiness(row)
    const progress = orderProgress(row)
    return {
      row,
      readiness,
      progress,
      materialValueProxy: readiness.readiness.requiredQty,
    }
  })
  const topValue = [...enriched].sort((a, b) => b.materialValueProxy - a.materialValueProxy).slice(0, 5)
  const topShortage = enriched
    .filter((item) => item.readiness.readiness.hasBom && item.readiness.readiness.remainingQty > 0)
    .sort((a, b) => b.readiness.readiness.remainingQty - a.readiness.readiness.remainingQty)
    .slice(0, 5)
  const upcomingDelayed = enriched
    .filter((item) => !['COMPLETED', 'CANCELLED'].includes(item.row.status) && item.row.plannedEndAt)
    .sort((a, b) => new Date(a.row.plannedEndAt ?? '').getTime() - new Date(b.row.plannedEndAt ?? '').getTime())
    .slice(0, 5)
  const progressSegments = [
    { label: 'Planning', value: enriched.filter((item) => item.progress < 25).length, color: '#64748b' },
    { label: 'Cutting', value: enriched.filter((item) => item.progress >= 25 && item.progress < 50).length, color: '#06b6d4' },
    { label: 'Welding', value: enriched.filter((item) => item.progress >= 50 && item.progress < 75).length, color: '#f59e0b' },
    { label: 'Painting', value: enriched.filter((item) => item.progress >= 75 && item.progress < 100).length, color: '#7c3aed' },
    { label: 'Finished', value: enriched.filter((item) => item.progress >= 100).length, color: '#14c987' },
  ]
  const readinessSegments = [
    { label: '0-49%', value: enriched.filter((item) => item.readiness.readiness.readinessPercent < 50).length, color: '#ef4444' },
    { label: '50-79%', value: enriched.filter((item) => item.readiness.readiness.readinessPercent >= 50 && item.readiness.readiness.readinessPercent < 80).length, color: '#f59e0b' },
    { label: '80-99%', value: enriched.filter((item) => item.readiness.readiness.readinessPercent >= 80 && item.readiness.readiness.readinessPercent < 100).length, color: '#06b6d4' },
    { label: '100%', value: enriched.filter((item) => item.readiness.readiness.readinessPercent >= 100).length, color: '#14c987' },
  ]
  const [page, setPage] = useState(1)
  const pageSize = 14
  const pagedRows = enriched.slice((page - 1) * pageSize, page * pageSize)
  const pageStart = rows.length ? (page - 1) * pageSize + 1 : 0
  const pageEnd = Math.min(page * pageSize, rows.length)

  useEffect(() => {
    setPage(1)
  }, [rows.length, embedded])

  const grid = (
    <CockpitChartCard
      title={embedded ? 'Danh sách lệnh sản xuất' : 'Work Order Cockpit'}
      subtitle="REAL · WO No, Component, Project, Material Ready, Progress, Due Date"
      action={<span className="text-[11px] text-cyan-300">{pageStart}-{pageEnd} / {rows.length}</span>}
      heightClass={COCKPIT_HEIGHTS.TABLE_MD}
    >
      <div className="flex h-full min-h-0 flex-col">
        <CockpitTableShell className="min-h-0 flex-1">
          <table className="w-full min-w-[1180px] table-fixed text-left text-[13px]">
            <thead className={inventoryTableHead}><tr>{['WO No', 'Component', 'Project', 'Qty', 'Material Ready', 'Progress', 'Due Date', 'Status'].map((x) => <th key={x} className="px-1.5 py-0.5 text-left font-medium">{x}</th>)}</tr></thead>
            <tbody>{pagedRows.map(({ row, readiness, progress }) => (
              <tr key={row.id} onClick={() => onOpen(row)} className={`cursor-pointer ${inventoryTableRow}`}>
                <td className="px-2 py-2 font-semibold text-cyan-300">{row.orderNo}<div className="mt-0.5 truncate text-[10px] text-slate-500">{row.title}</div></td>
                <td className="px-2 py-2 text-slate-200">{row.component ? `${row.component.code} · ${row.component.name}` : row.bom?.productCode ?? '-'}</td>
                <td className="px-2 py-2 text-slate-300">{row.projectId ?? row.component?.project?.code ?? '-'}</td>
                <td className="px-2 py-2 font-mono tabular-nums">{number(row.quantity)}</td>
                <td className="w-44 px-2 py-2">
                  <Meter value={readiness.readiness.readinessPercent} tone={readinessBarClass(readiness.readiness.readinessPercent)} />
                  <div className={`mt-1 text-[10px] ${readiness.readiness.readinessPercent >= 100 ? 'text-emerald-300' : readiness.readiness.readinessPercent >= 80 ? 'text-cyan-300' : readiness.readiness.readinessPercent >= 50 ? 'text-amber-300' : 'text-red-300'}`}>
                    {formatQuantity(readiness.readiness.readinessPercent, 0)}% · {readiness.label}
                  </div>
                </td>
                <td className="w-40 px-2 py-2">
                  <Meter value={progress} tone={orderStatusTone(row)} />
                  <div className="mt-1 text-[10px] text-slate-500">{progress}%</div>
                </td>
                <td className="px-2 py-2 text-slate-300">{date(row.plannedEndAt)}{isDelayedOrder(row) ? <div className="mt-1 text-[10px] text-red-300">Trễ tiến độ</div> : null}</td>
                <td className="px-2 py-2"><StatusChip status={row.status} /></td>
              </tr>
            ))}</tbody>
          </table>
          {!pagedRows.length ? (
            <ModuleEmptyState icon={<span>⚙️</span>} title="Chưa có lệnh sản xuất" description="Tạo lệnh sản xuất để theo dõi tiến độ, vật tư và hoàn thành." />
          ) : null}
        </CockpitTableShell>
        <DataTablePagination page={page} pageSize={pageSize} total={rows.length} onPageChange={setPage} />
      </div>
    </CockpitChartCard>
  )

  if (embedded) return grid

  return (
    <div className="w-full min-w-0 flex-1 space-y-1">
      <div className="grid grid-cols-1 gap-1 xl:grid-cols-12">
        <div className="xl:col-span-9">{grid}</div>
        <aside className="space-y-1 xl:col-span-3">
          <CockpitChartCard title="Tiến độ sản xuất" subtitle="REAL · Planning → Finished" heightClass={COCKPIT_HEIGHTS.CHART_SM}>
            <ProductionDonut centerValue={formatQuantity(rows.length, 0)} centerLabel="WO" segments={progressSegments} />
          </CockpitChartCard>
          <CockpitChartCard title="Material readiness" subtitle="REAL · Net issued / required" heightClass={COCKPIT_HEIGHTS.CHART_SM}>
            <ProductionDonut centerValue={formatQuantity(rows.length, 0)} centerLabel="WO" segments={readinessSegments} />
          </CockpitChartCard>
          <CockpitChartCard title="WO sắp trễ" subtitle="REAL · Sắp xếp theo Due Date" heightClass={COCKPIT_HEIGHTS.CHART_SM}>
            <RankList rows={upcomingDelayed.map((item) => ({ id: item.row.id, title: item.row.orderNo, subtitle: item.row.title, value: date(item.row.plannedEndAt) }))} empty="Chưa có WO có hạn" />
          </CockpitChartCard>
        </aside>
      </div>
      <div className="grid grid-cols-1 gap-1 xl:grid-cols-3">
        <CockpitChartCard title="Top WO theo giá trị vật tư" subtitle="TODO · API chưa có unit cost, đang dùng required qty proxy" heightClass={COCKPIT_HEIGHTS.CHART_LG}>
          <RankList rows={topValue.map((item) => ({ id: item.row.id, title: item.row.orderNo, subtitle: item.row.title, value: number(item.materialValueProxy) }))} />
        </CockpitChartCard>
        <CockpitChartCard title="Top WO thiếu vật tư" subtitle="REAL · Remaining required qty" heightClass={COCKPIT_HEIGHTS.CHART_LG}>
          <RankList rows={topShortage.map((item) => ({ id: item.row.id, title: item.row.orderNo, subtitle: item.row.title, value: number(item.readiness.readiness.remainingQty) }))} empty="Không có WO thiếu vật tư" />
        </CockpitChartCard>
        <CockpitChartCard title="READY TO RELEASE" subtitle="REAL · Chỉ hiển thị cảnh báo UI" heightClass={COCKPIT_HEIGHTS.CHART_LG}>
          <ModuleEmptyState icon={<span>🏭</span>} title="Chưa khóa workflow" description="READY TO RELEASE hiện chỉ là cảnh báo UI khi Material Readiness >= 100%." />
        </CockpitChartCard>
      </div>
    </div>
  )
}

function Boms({ rows, onOpen, onCreate }: { rows: ProductionBom[]; onOpen: (row: ProductionBom) => void; onCreate: () => void }) {
  const clone = useCloneProductionBom()
  const archive = useArchiveProductionBom()

  async function cloneBom(id: string) {
    try {
      await clone.mutateAsync(id)
      toast.success('Đã nhân bản Production BOM')
    } catch {
      toast.error('Không thể nhân bản Production BOM')
    }
  }

  async function archiveBom(id: string) {
    try {
      await archive.mutateAsync(id)
      toast.success('Đã lưu trữ Production BOM')
    } catch {
      toast.error('Không thể lưu trữ Production BOM')
    }
  }

  const active = rows.filter((row) => row.status !== 'ARCHIVED').length
  const totalMaterials = rows.reduce((sum, row) => sum + row.items.length, 0)
  const totalWeight = rows.reduce((sum, row) => sum + Number(row.estimatedWeight ?? 0), 0)
  const [page, setPage] = useState(1)
  const pageSize = 14
  const pagedRows = rows.slice((page - 1) * pageSize, page * pageSize)
  const pageStart = rows.length ? (page - 1) * pageSize + 1 : 0
  const pageEnd = Math.min(page * pageSize, rows.length)
  const statusSegments = [
    { label: 'Active', value: active, color: '#14c987' },
    { label: 'Archived', value: rows.length - active, color: '#64748b' },
  ]
  const typeSegments = Array.from(rows.reduce((map, row) => {
    const key = row.structureType ?? 'Chưa phân loại'
    map.set(key, (map.get(key) ?? 0) + 1)
    return map
  }, new Map<string, number>()).entries())
    .map(([label, value], index) => ({ label, value, color: ['#1d7cff', '#14c987', '#f59e0b', '#7c3aed', '#06b6d4'][index % 5] }))
  const recentRows = [...rows].sort((a, b) => new Date(b.createdAt ?? '').getTime() - new Date(a.createdAt ?? '').getTime()).slice(0, 5)

  useEffect(() => {
    setPage(1)
  }, [rows.length])

  return <div className="w-full min-w-0 flex-1 space-y-1">
    <div className="grid grid-cols-1 gap-1 md:grid-cols-4">
      <CockpitKpiCard title="Tổng BOM" value={formatQuantity(rows.length, 0)} note="REAL · Định mức sản xuất" tone="blue" state="normal" />
      <CockpitKpiCard title="Đang dùng" value={formatQuantity(active, 0)} note="REAL · Không archive" tone="emerald" state="normal" />
      <CockpitKpiCard title="Dòng vật tư" value={formatQuantity(totalMaterials, 0)} note="REAL · Tổng BOM items" tone="cyan" state="normal" />
      <CockpitKpiCard title="Khối lượng ước tính" value={`${number(totalWeight)} kg`} note="REAL · Tổng estimated weight" tone="purple" state="normal" />
    </div>
    <div className="flex items-center justify-end gap-1">
      <button onClick={onCreate} className={`${inventoryMutedButton} h-9 rounded-xl`}>+ Tạo BOM</button>
    </div>
    <div className="grid grid-cols-1 gap-1 xl:grid-cols-12">
      <div className="xl:col-span-9">
        <CockpitChartCard title="Production BOM Registry" subtitle="REAL · Danh sách định mức sản xuất" action={<span className="text-[11px] text-cyan-300">{pageStart}-{pageEnd} / {rows.length}</span>} heightClass={COCKPIT_HEIGHTS.TABLE_MD}>
          <div className="flex h-full min-h-0 flex-col">
            <CockpitTableShell className="min-h-0 flex-1">
              <table className="w-full min-w-[1050px] table-fixed text-left text-[13px]">
                <thead className={inventoryTableHead}>
                  <tr>{['STT','BOM Code','Structure Code','Structure Name','Structure Type','Project','Unit','Materials','Estimated Weight','Status','Created','Actions'].map((x)=><th className="px-1.5 py-0.5 text-left font-medium" key={x}>{x}</th>)}</tr>
                </thead>
                <tbody>{pagedRows.map((row,index)=><tr key={row.id} onClick={()=>onOpen(row)} className={`cursor-pointer ${inventoryTableRow}`}>
                  <td className="px-2 py-2">{(page - 1) * pageSize + index + 1}</td>
                  <td className="px-2 py-2 font-semibold text-cyan-300">{row.bomNo}</td>
                  <td className="px-2 py-2 text-slate-300">{row.productCode}</td>
                  <td className="px-2 py-2 text-white">{row.productName}</td>
                  <td className="px-2 py-2 text-slate-300">{row.structureType??'-'}</td>
                  <td className="px-2 py-2 text-slate-300">{row.projectId??'-'}</td>
                  <td className="px-2 py-2 text-slate-300">{row.unit??'-'}</td>
                  <td className="px-2 py-2 font-mono tabular-nums">{row.items.length}</td>
                  <td className="px-2 py-2 font-mono tabular-nums">{number(row.estimatedWeight)} kg</td>
                  <td className="px-2 py-2"><StatusChip status={row.status}/></td>
                  <td className="px-2 py-2 text-slate-300">{date(row.createdAt)}</td>
                  <td className="px-2 py-2"><div className="flex gap-1 text-cyan-300"><button onClick={(event) => { event.stopPropagation(); onOpen(row) }}>Xem</button><button onClick={(event) => { event.stopPropagation(); void cloneBom(row.id) }}>Clone</button>{row.status !== 'ARCHIVED' && <button onClick={(event) => { event.stopPropagation(); void archiveBom(row.id) }} className="text-amber-300">Archive</button>}</div></td>
                </tr>)}</tbody>
              </table>
              {!pagedRows.length ? <ModuleEmptyState icon={<span>⚙️</span>} title="Chưa có dữ liệu BOM" description="Tạo Production BOM để chuẩn hóa định mức vật tư cho sản xuất." /> : null}
            </CockpitTableShell>
            <DataTablePagination page={page} pageSize={pageSize} total={rows.length} onPageChange={setPage} />
          </div>
        </CockpitChartCard>
      </div>
      <aside className="space-y-1 xl:col-span-3">
        <CockpitChartCard title="Theo trạng thái" subtitle="REAL · Active / archived" heightClass={COCKPIT_HEIGHTS.CHART_SM}>
          <ProductionDonut centerValue={formatQuantity(rows.length, 0)} centerLabel="BOM" segments={statusSegments} />
        </CockpitChartCard>
        <CockpitChartCard title="Phân loại BOM" subtitle="REAL · Theo structureType" heightClass={COCKPIT_HEIGHTS.CHART_SM}>
          {typeSegments.length ? <ProductionDonut centerValue={formatQuantity(rows.length, 0)} centerLabel="BOM" segments={typeSegments} /> : (
            <ModuleEmptyState icon={<span>🏭</span>} title="Chưa có phân loại" description="Structure type sẽ hiển thị khi BOM có dữ liệu phân loại." />
          )}
        </CockpitChartCard>
        <CockpitChartCard title="Gần đây" subtitle="REAL · BOM mới tạo" heightClass={COCKPIT_HEIGHTS.CHART_SM}>
          <RankList rows={recentRows.map((row) => ({ id: row.id, title: row.bomNo, subtitle: row.productName, value: date(row.createdAt) }))} empty="Chưa có BOM gần đây" />
        </CockpitChartCard>
      </aside>
    </div>
  </div>
}

type LocationBalanceLike = {
  warehouseId?: string
  warehouseCode?: string
  warehouseName?: string
  zoneId?: string
  zoneCode?: string
  zoneName?: string
  slotId?: string
  level?: string | number
  quantity?: number | string
}

type InventoryItemLike = {
  id: string
  code?: string
  name?: string
  unit?: string
  unitPrice?: number | string
  averageCost?: number | string
  minimumStock?: number | string
  unitMaster?: { symbol?: string }
  locationBalances?: LocationBalanceLike[]
}

type InventoryAuditLike = {
  materialId?: string
  inventoryItemId?: string
  averageCost?: number | string
}

type ProductionWarehouseMaterialRow = {
  id: string
  code: string
  name: string
  unit: string
  mainStock: number
  productionStock: number
  reserved: number
  available: number
  required: number
  shortage: number
  averageCost: number
  inventoryValue: number
  readiness: number
  status: 'OUT' | 'LOW' | 'NORMAL'
  locations: LocationBalanceLike[]
}

function numeric(value: unknown) {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function isMainWarehouseBalance(location: LocationBalanceLike) {
  const code = String(location.warehouseCode ?? '').trim().toUpperCase()
  const name = String(location.warehouseName ?? '').trim().toLowerCase()
  return code === 'MAIN' || name.includes('kho chính') || name.includes('kho chinh')
}

function isProductionWarehouseBalance(location: LocationBalanceLike) {
  const code = String(location.warehouseCode ?? '').trim().toUpperCase()
  const name = String(location.warehouseName ?? '').trim().toLowerCase()
  return code === 'PRODUCTION' || name.includes('sản xuất') || name.includes('san xuat')
}

function stockFromLocations(item: InventoryItemLike, predicate: (location: LocationBalanceLike) => boolean) {
  return (item.locationBalances ?? [])
    .filter(predicate)
    .reduce((sum, location) => sum + numeric(location.quantity), 0)
}

function productionLocationLabel(location: LocationBalanceLike) {
  const zone = [location.zoneCode, location.zoneName].filter(Boolean).join(' - ') || location.zoneId || 'Production Zone'
  const slot = location.slotId ? ` / ${location.slotId}` : ''
  const level = location.level ? ` / ${String(location.level).startsWith('L') ? location.level : `L${location.level}`}` : ''
  return `${zone}${slot}${level}`
}

function buildProductionWarehouseRows({
  inventoryItems,
  auditRows,
  orders,
  reservations,
}: {
  inventoryItems: InventoryItemLike[]
  auditRows: InventoryAuditLike[]
  orders: ProductionOrder[]
  reservations: ProductionReservation[]
}) {
  const auditByItem = new Map(
    auditRows.map((row) => [String(row.materialId ?? row.inventoryItemId), row]),
  )
  const requiredByItem = new Map<string, number>()
  const reservedByItem = new Map<string, number>()

  orders
    .filter((order) => !['COMPLETED', 'CANCELLED'].includes(order.status))
    .forEach((order) => {
      const orderQty = numeric(order.quantity) || 1
      ;(order.bom?.items ?? []).forEach((item) => {
        const materialId = String(item.materialId ?? item.material?.id ?? '')
        if (!materialId) return
        const required = numeric(item.quantity) * (1 + numeric(item.wastePercent) / 100) * orderQty
        requiredByItem.set(materialId, (requiredByItem.get(materialId) ?? 0) + required)
      })
    })

  reservations
    .filter((reservation) => ['RESERVED', 'PARTIALLY_ISSUED'].includes(reservation.status))
    .forEach((reservation) => {
      reservation.lines.forEach((line) => {
        const reserved = Math.max(0, numeric(line.reservedQty) - numeric(line.issuedQty))
        reservedByItem.set(line.inventoryItemId, (reservedByItem.get(line.inventoryItemId) ?? 0) + reserved)
      })
    })

  return inventoryItems
    .map<ProductionWarehouseMaterialRow>((item) => {
      const productionLocations = (item.locationBalances ?? []).filter(isProductionWarehouseBalance)
      const mainStock = stockFromLocations(item, isMainWarehouseBalance)
      const productionStock = productionLocations.reduce((sum, location) => sum + numeric(location.quantity), 0)
      const reserved = reservedByItem.get(item.id) ?? 0
      const required = requiredByItem.get(item.id) ?? 0
      const available = Math.max(0, productionStock - reserved)
      const shortage = Math.max(0, required - available)
      const minimumStock = numeric(item.minimumStock)
      const averageCost = numeric(auditByItem.get(item.id)?.averageCost ?? item.averageCost ?? item.unitPrice)
      const readiness = required > 0 ? Math.min(100, (available / required) * 100) : available > 0 ? 100 : 0
      const status: ProductionWarehouseMaterialRow['status'] = available <= 0
        ? 'OUT'
        : shortage > 0 || (minimumStock > 0 && available <= minimumStock)
          ? 'LOW'
          : 'NORMAL'
      return {
        id: item.id,
        code: item.code ?? item.id,
        name: item.name ?? '-',
        unit: item.unitMaster?.symbol ?? item.unit ?? '-',
        mainStock,
        productionStock,
        reserved,
        available,
        required,
        shortage,
        averageCost,
        inventoryValue: productionStock * averageCost,
        readiness,
        status,
        locations: productionLocations,
      }
    })
    .filter((row) => row.productionStock > 0 || row.required > 0 || row.reserved > 0)
}

function statusText(status: ProductionWarehouseMaterialRow['status']) {
  if (status === 'OUT') return 'OUT'
  if (status === 'LOW') return 'LOW'
  return 'NORMAL'
}

function statusToneClass(status: ProductionWarehouseMaterialRow['status']) {
  if (status === 'OUT') return 'border-red-500/40 bg-red-500/10 text-red-300'
  if (status === 'LOW') return 'border-amber-500/40 bg-amber-500/10 text-amber-300'
  return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
}

function ProductionWarehouseCockpit({
  inventoryItems,
  auditRows,
  orders,
  reservations,
  consumptions,
}: {
  inventoryItems: InventoryItemLike[]
  auditRows: InventoryAuditLike[]
  orders: ProductionOrder[]
  reservations: ProductionReservation[]
  consumptions: ProductionMaterialConsumption[]
}) {
  const [selectedRow, setSelectedRow] = useState<ProductionWarehouseMaterialRow | null>(null)
  const rows = useMemo(
    () => buildProductionWarehouseRows({ inventoryItems, auditRows, orders, reservations }),
    [inventoryItems, auditRows, orders, reservations],
  )
  const productionStock = rows.reduce((sum, row) => sum + row.productionStock, 0)
  const reserved = rows.reduce((sum, row) => sum + row.reserved, 0)
  const available = rows.reduce((sum, row) => sum + row.available, 0)
  const shortageRisk = rows.filter((row) => row.shortage > 0 || row.status === 'OUT').length
  const inventoryValue = rows.reduce((sum, row) => sum + row.inventoryValue, 0)
  const materialCount = rows.filter((row) => row.productionStock > 0).length
  const orderById = new Map(orders.map((order) => [order.id, order]))
  const topWoConsumption = Array.from(consumptions.reduce((map, row) => {
    const current = map.get(row.productionOrderId) ?? 0
    map.set(row.productionOrderId, current + numeric(row.consumedQty) + numeric(row.scrapQty))
    return map
  }, new Map<string, number>()).entries())
    .map(([id, value]) => ({ id, title: orderById.get(id)?.orderNo ?? id, subtitle: orderById.get(id)?.title ?? 'Production consumption', value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)
  const readinessRows = [...rows]
    .sort((a, b) => a.readiness - b.readiness)
    .slice(0, 5)
  const productionLocations = rows
    .flatMap((row) => row.locations.map((location) => ({
      id: `${row.id}-${location.zoneId ?? 'zone'}-${location.slotId ?? 'slot'}-${location.level ?? 'level'}`,
      material: `${row.code} · ${row.name}`,
      location: productionLocationLabel(location),
      quantity: numeric(location.quantity),
      unit: row.unit,
      value: numeric(location.quantity) * row.averageCost,
    })))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10)
  const shortageRows = rows.filter((row) => row.shortage > 0).sort((a, b) => b.shortage - a.shortage).slice(0, 8)
  const [page, setPage] = useState(1)
  const pageSize = 14
  const pagedRows = rows.slice((page - 1) * pageSize, page * pageSize)
  const statusSegments = [
    { label: 'OUT', value: rows.filter((row) => row.status === 'OUT').length, color: '#ef4444' },
    { label: 'LOW', value: rows.filter((row) => row.status === 'LOW').length, color: '#f59e0b' },
    { label: 'NORMAL', value: rows.filter((row) => row.status === 'NORMAL').length, color: '#14c987' },
  ]

  useEffect(() => {
    setPage(1)
  }, [rows.length])

  return (
    <div className="w-full min-w-0 flex-1 space-y-1">
      <div className="grid grid-cols-1 gap-1 xl:grid-cols-12">
        <div className="xl:col-span-9">
          <CockpitChartCard title="Production Warehouse Material Grid" subtitle="REAL · Trạng thái dựa trên Available tại Kho vật tư SX" heightClass={COCKPIT_HEIGHTS.TABLE_MD}>
            <div className="flex h-full min-h-0 flex-col">
            <CockpitTableShell className="min-h-0 flex-1">
            <table className="w-full min-w-[1280px] table-fixed text-left text-[13px]">
              <thead className={inventoryTableHead}>
                <tr>{['Material', 'Main Stock', 'Production Stock', 'Reserved', 'Available', 'Required', 'Shortage', 'Status'].map((head) => <th key={head} className="px-1.5 py-0.5 text-left font-medium">{head}</th>)}</tr>
              </thead>
              <tbody>
                {pagedRows.map((row) => (
                  <tr key={row.id} onClick={() => setSelectedRow(row)} className={`cursor-pointer ${inventoryTableRow}`}>
                    <td className="px-2 py-2 text-cyan-300">{row.code}<div className="mt-0.5 truncate text-[10px] text-slate-500">{row.name}</div></td>
                    <td className="px-2 py-2 font-mono tabular-nums">{number(row.mainStock)} {row.unit}</td>
                    <td className="px-2 py-2 font-mono tabular-nums text-cyan-300">{number(row.productionStock)} {row.unit}</td>
                    <td className="px-2 py-2 font-mono tabular-nums text-purple-300">{number(row.reserved)} {row.unit}</td>
                    <td className="px-2 py-2 font-mono tabular-nums text-emerald-300">{number(row.available)} {row.unit}</td>
                    <td className="px-2 py-2 font-mono tabular-nums">{number(row.required)} {row.unit}</td>
                    <td className={row.shortage > 0 ? 'px-2 py-2 font-mono tabular-nums text-red-300' : 'px-2 py-2 font-mono tabular-nums text-slate-500'}>{number(row.shortage)} {row.unit}</td>
                    <td className="px-2 py-2"><span className={`rounded-lg border px-2 py-0.5 text-xs font-semibold ${statusToneClass(row.status)}`}>{statusText(row.status)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!pagedRows.length ? <ModuleEmptyState icon={<span>📦</span>} title="Chưa có dữ liệu vật tư" description="Kho sản xuất chưa có tồn, nhu cầu BOM hoặc reservation đang mở." /> : null}
            </CockpitTableShell>
            <DataTablePagination page={page} pageSize={pageSize} total={rows.length} onPageChange={setPage} />
            </div>
          </CockpitChartCard>
        </div>
        <aside className="space-y-1 xl:col-span-3">
          <CockpitChartCard title="Tồn sản xuất" subtitle="REAL · Production stock" heightClass={COCKPIT_HEIGHTS.CHART_SM}>
            <div className="space-y-2 text-xs text-slate-300">
              <Info k="Production Stock" v={number(productionStock)} />
              <Info k="Materials" v={formatQuantity(materialCount, 0)} />
              <Info k="Inventory Value" v={formatCurrencyVnd(inventoryValue)} />
            </div>
          </CockpitChartCard>
          <CockpitChartCard title="Theo trạng thái" subtitle="REAL · Available status" heightClass={COCKPIT_HEIGHTS.CHART_SM}>
            <ProductionDonut centerValue={formatQuantity(rows.length, 0)} centerLabel="VT" segments={statusSegments} />
          </CockpitChartCard>
          <CockpitChartCard title="Gần đây" subtitle="REAL · Shortage board" heightClass={COCKPIT_HEIGHTS.CHART_SM}>
            <RankList rows={shortageRows.map((row) => ({ id: row.id, title: row.code, subtitle: `${row.name} · Available ${number(row.available)}`, value: number(row.shortage) }))} empty="Không có thiếu hụt" />
          </CockpitChartCard>
        </aside>
      </div>

      <div className="grid grid-cols-1 gap-1 xl:grid-cols-3">
        <CockpitChartCard title="Top WO tiêu thụ vật tư" subtitle="REAL · Consumed + Scrap" heightClass={COCKPIT_HEIGHTS.CHART_LG}>
          <RankList rows={topWoConsumption.map((row) => ({ id: row.id, title: row.title, subtitle: row.subtitle, value: number(row.value) }))} empty="Chưa có tiêu hao vật tư" />
        </CockpitChartCard>
        <CockpitChartCard title="Readiness theo vật tư" subtitle="REAL · Available / Required" heightClass={COCKPIT_HEIGHTS.CHART_LG}>
          <RankList rows={readinessRows.map((row) => ({ id: row.id, title: row.code, subtitle: row.name, value: `${formatQuantity(row.readiness, 0)}%` }))} empty="Chưa có nhu cầu BOM" />
        </CockpitChartCard>
        <CockpitChartCard title="Production Locations" subtitle="REAL · Production Zone / Slot / Level" heightClass={COCKPIT_HEIGHTS.CHART_LG}>
          <RankList rows={productionLocations.slice(0, 5).map((row) => ({ id: row.id, title: row.location, subtitle: row.material, value: `${number(row.quantity)} ${row.unit}` }))} empty="Chưa có vị trí SX" />
        </CockpitChartCard>
      </div>

      <CockpitChartCard title="Production Zone / Slot / Level Detail" subtitle="REAL · Nhóm tồn Kho vật tư SX theo vị trí" heightClass={COCKPIT_HEIGHTS.TABLE_SM}>
        <CockpitTableShell className="h-full">
          <table className="w-full min-w-[980px] table-fixed text-left text-[13px]">
            <thead className={inventoryTableHead}>
              <tr>{['Material', 'Production Location', 'Quantity', 'Value'].map((head) => <th key={head} className="px-1.5 py-0.5 text-left font-medium">{head}</th>)}</tr>
            </thead>
            <tbody>
              {productionLocations.map((row) => (
                <tr key={row.id} className={inventoryTableRow}>
                  <td className="px-2 py-2 text-cyan-300">{row.material}</td>
                  <td className="px-2 py-2">{row.location}</td>
                  <td className="px-2 py-2 font-mono tabular-nums">{number(row.quantity)} {row.unit}</td>
                  <td className="px-2 py-2 font-mono tabular-nums text-amber-300">{formatCurrencyVnd(row.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!productionLocations.length ? <ModuleEmptyState icon={<span>📦</span>} title="Chưa có vị trí sản xuất" description="Vị trí kho sản xuất sẽ hiển thị khi có tồn theo slot/level." /> : null}
        </CockpitTableShell>
      </CockpitChartCard>

      <ProductionWarehouseDrawer row={selectedRow} onClose={() => setSelectedRow(null)} />
    </div>
  )
}

function ProductionWarehouseDrawer({ row, onClose }: { row: ProductionWarehouseMaterialRow | null; onClose: () => void }) {
  if (!row) return null
  return (
    <ModuleDetailDrawer open title={row.name} subtitle={row.code} onClose={onClose} widthClass="max-w-4xl">
      <div className="grid gap-3 md:grid-cols-4">
        <InventoryKpi title="Production Stock" value={`${number(row.productionStock)} ${row.unit}`} note="Kho vật tư SX" tone="blue" />
        <InventoryKpi title="Reserved" value={`${number(row.reserved)} ${row.unit}`} note="WO reservation" tone="purple" />
        <InventoryKpi title="Available" value={`${number(row.available)} ${row.unit}`} note="Có thể cấp WO" tone="emerald" />
        <InventoryKpi title="Shortage" value={`${number(row.shortage)} ${row.unit}`} note="Required - Available" tone={row.shortage > 0 ? 'red' : 'emerald'} />
      </div>
      <div className="mt-3 grid gap-3 xl:grid-cols-2">
        <InventoryChartCard title="Production Locations" note="Nhóm vị trí sản xuất">
          <div className="space-y-2">
            {row.locations.map((location) => (
              <div key={`${location.zoneId}-${location.slotId}-${location.level}`} className="grid grid-cols-[1fr_auto] gap-3 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs">
                <span className="text-slate-300">{productionLocationLabel(location)}</span>
                <span className="font-mono tabular-nums text-cyan-300">{number(numeric(location.quantity))} {row.unit}</span>
              </div>
            ))}
            {!row.locations.length ? <div className="rounded-xl border border-white/10 bg-white/[0.035] p-5 text-center text-sm text-slate-500">Không có tồn kho sản xuất.</div> : null}
          </div>
        </InventoryChartCard>
        <InventoryChartCard title="Readiness" note="Available / Required">
          <ProductionDonut centerValue={`${formatQuantity(row.readiness, 0)}%`} centerLabel="ready" segments={[
            { label: 'Available', value: row.available, color: '#14c987' },
            { label: 'Shortage', value: row.shortage, color: '#ef4444' },
            { label: 'Reserved', value: row.reserved, color: '#7c3aed' },
          ]} />
        </InventoryChartCard>
      </div>
    </ModuleDetailDrawer>
  )
}

type IssueControlRow = {
  issue: ProductionMaterialIssue
  issueNo: string
  order?: ProductionOrder
  orderNo: string
  orderTitle: string
  component: string
  material: string
  requiredQty: number
  issuedQty: number
  returnedQty: number
  netIssuedQty: number
  remainingQty: number
  readinessPercent: number
  returnableQty: number
  location: string
}

function issueKey(issue: ProductionMaterialIssue) {
  return `${issue.productionOrderId}:${issue.inventoryItemId}`
}

function issueLocation(issue: ProductionMaterialIssue) {
  const level = issue.level ? String(issue.level).startsWith('L') ? String(issue.level) : `L${issue.level}` : undefined
  return [issue.warehouseId, issue.zoneId, issue.slotId, level].filter(Boolean).join(' / ') || '-'
}

function requiredQtyForIssue(issue: ProductionMaterialIssue, order?: ProductionOrder) {
  const bomItems = order?.bom?.items ?? issue.productionOrder?.bom?.items ?? []
  const orderQty = Number(order?.quantity ?? issue.productionOrder?.quantity ?? 1) || 1
  const matchingItems = bomItems.filter((item) => item.materialId === issue.inventoryItemId || item.material?.id === issue.inventoryItemId)
  const required = matchingItems.reduce((sum, item) => {
    const wasteRatio = 1 + Number(item.wastePercent ?? 0) / 100
    return sum + Number(item.quantity ?? 0) * wasteRatio * orderQty
  }, 0)
  return required > 0 ? required : Number(issue.issuedQty ?? 0)
}

function buildIssueControlRows(
  issues: ProductionMaterialIssue[],
  orders: ProductionOrder[],
  remainingByMaterial: Map<string, number>,
): IssueControlRow[] {
  const ordersById = new Map(orders.map((order) => [order.id, order]))
  const netIssuedByMaterial = new Map<string, number>()

  issues.forEach((issue) => {
    const key = issueKey(issue)
    const net = Number(issue.issuedQty ?? 0) - Number(issue.returnedQty ?? 0)
    netIssuedByMaterial.set(key, (netIssuedByMaterial.get(key) ?? 0) + net)
  })

  return issues.map((issue) => {
    const order = ordersById.get(issue.productionOrderId) ?? issue.productionOrder
    const requiredQty = requiredQtyForIssue(issue, order)
    const netIssuedQty = Math.max(0, netIssuedByMaterial.get(issueKey(issue)) ?? 0)
    const remainingQty = Math.max(0, requiredQty - netIssuedQty)
    const readinessPercent = requiredQty > 0 ? Math.min(100, (netIssuedQty / requiredQty) * 100) : 0
    const material = issue.inventoryItem ? `${issue.inventoryItem.code} · ${issue.inventoryItem.name}` : issue.inventoryItemId
    const component = order?.component ? `${order.component.code} · ${order.component.name}` : order?.bom?.productCode ?? '-'
    return {
      issue,
      issueNo: issue.issueNo,
      order,
      orderNo: order?.orderNo ?? issue.productionOrder?.orderNo ?? issue.productionOrderId,
      orderTitle: order?.title ?? issue.productionOrder?.title ?? '-',
      component,
      material,
      requiredQty,
      issuedQty: Number(issue.issuedQty ?? 0),
      returnedQty: Number(issue.returnedQty ?? 0),
      netIssuedQty,
      remainingQty,
      readinessPercent,
      returnableQty: getIssueReturnableQty(issue, remainingByMaterial),
      location: issueLocation(issue),
    }
  })
}

function aggregateIssueRows(rows: IssueControlRow[], field: 'issuedQty' | 'returnedQty') {
  const map = new Map<string, { id: string; title: string; subtitle: string; value: number }>()
  rows.forEach((row) => {
    const id = row.issue.inventoryItemId
    const current = map.get(id) ?? { id, title: row.material, subtitle: row.issue.inventoryItem?.unit ?? '', value: 0 }
    current.value += row[field]
    map.set(id, current)
  })
  return Array.from(map.values()).sort((a, b) => b.value - a.value)
}

function aggregateShortageWorkOrders(rows: IssueControlRow[]) {
  const map = new Map<string, { id: string; title: string; subtitle: string; value: number }>()
  rows.forEach((row) => {
    const id = row.issue.productionOrderId
    const current = map.get(id) ?? { id, title: row.orderNo, subtitle: row.orderTitle, value: 0 }
    current.value += row.remainingQty
    map.set(id, current)
  })
  return Array.from(map.values()).filter((row) => row.value > 0).sort((a, b) => b.value - a.value)
}

function aggregateReadinessByWorkOrder(rows: IssueControlRow[]) {
  const map = new Map<string, { id: string; title: string; subtitle: string; required: number; netIssued: number }>()
  rows.forEach((row) => {
    const id = row.issue.productionOrderId
    const current = map.get(id) ?? { id, title: row.orderNo, subtitle: row.orderTitle, required: 0, netIssued: 0 }
    current.required += row.requiredQty
    current.netIssued += Math.max(0, row.netIssuedQty)
    map.set(id, current)
  })
  return Array.from(map.values())
    .map((row) => ({ id: row.id, title: row.title, subtitle: row.subtitle, value: row.required > 0 ? Math.min(100, (row.netIssued / row.required) * 100) : 0 }))
    .sort((a, b) => a.value - b.value)
}

function aggregateSourceLocations(rows: IssueControlRow[]) {
  const map = new Map<string, { id: string; title: string; subtitle: string; value: number }>()
  rows.forEach((row) => {
    const id = row.location
    const current = map.get(id) ?? { id, title: id, subtitle: 'Nguồn xuất thực tế', value: 0 }
    current.value += row.issuedQty
    map.set(id, current)
  })
  return Array.from(map.values()).sort((a, b) => b.value - a.value)
}

function Issues({
  rows,
  consumptions,
  orders,
}: {
  rows: ReturnType<typeof useProductionIssues>['data']
  consumptions: ProductionMaterialConsumption[]
  orders: ProductionOrder[]
}) {
  const returnIssue = useReturnProductionMaterialIssue()
  const [selectedIssue, setSelectedIssue] = useState<IssueControlRow | null>(null)
  const consumptionRows = useMemo(
    () => buildConsumptionRows(rows ?? [], consumptions),
    [rows, consumptions],
  )
  const remainingByMaterial = useMemo(() => {
    const map = new Map<string, number>()
    consumptionRows.forEach((row) => {
      map.set(`${row.productionOrderId}:${row.inventoryItemId}`, row.remainingQty)
    })
    return map
  }, [consumptionRows])
  const issueRows = useMemo(
    () => buildIssueControlRows(rows ?? [], orders, remainingByMaterial),
    [rows, orders, remainingByMaterial],
  )

  async function runReturn(row: NonNullable<ReturnType<typeof useProductionIssues>['data']>[number]) {
    const returnable = getIssueReturnableQty(row, remainingByMaterial)
    if (returnable <= 0) {
      toast.error('Phiếu này không còn vật tư dư sau tiêu hao/scrap để hoàn trả')
      return
    }
    const input = window.prompt(
      `Nhập số lượng hoàn trả về Kho chính cho ${row.inventoryItem?.code ?? row.inventoryItemId}`,
      String(returnable),
    )
    if (input === null) return
    const quantity = parseLocaleNumber(input)
    if (!Number.isFinite(quantity) || quantity <= 0 || quantity > returnable) {
      toast.error(`Số lượng hoàn trả phải lớn hơn 0 và không vượt quá ${number(returnable)}`)
      return
    }
    try {
      await returnIssue.mutateAsync({
        id: row.id,
        payload: {
          quantity,
          remarks: `Return unused production material to Main Warehouse from ${row.issueNo}`,
        },
      })
      toast.success('Đã hoàn trả vật tư dư về Kho chính')
    } catch (error) {
      const raw = (error as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message
      const message = Array.isArray(raw) ? raw.join(', ') : raw || ''
      toast.error(
        message.includes('Insufficient stock')
          ? 'Không còn vật tư dư hợp lệ để hoàn trả. Vui lòng tải lại dữ liệu phiếu cấp.'
          : message || 'Không thể hoàn trả vật tư',
      )
    }
  }

  const issuedTotal = (rows ?? []).reduce((sum, row) => sum + Number(row.issuedQty ?? 0), 0)
  const returnedTotal = (rows ?? []).reduce((sum, row) => sum + Number(row.returnedQty ?? 0), 0)
  const returnableTotal = (rows ?? []).reduce((sum, row) => sum + getIssueReturnableQty(row, remainingByMaterial), 0)
  const requiredTotal = issueRows.reduce((sum, row) => sum + row.requiredQty, 0)
  const remainingTotal = issueRows.reduce((sum, row) => sum + row.remainingQty, 0)
  const issuedOrders = new Set(issueRows.map((row) => row.issue.productionOrderId)).size
  const completionRate = requiredTotal > 0
    ? Math.min(100, (issueRows.reduce((sum, row) => sum + row.netIssuedQty, 0) / requiredTotal) * 100)
    : 0
  const topIssuedMaterials = aggregateIssueRows(issueRows, 'issuedQty').slice(0, 5)
  const topReturnedMaterials = aggregateIssueRows(issueRows, 'returnedQty').filter((row) => row.value > 0).slice(0, 5)
  const shortageWorkOrders = aggregateShortageWorkOrders(issueRows).slice(0, 5)
  const readinessByWorkOrder = aggregateReadinessByWorkOrder(issueRows).slice(0, 5)
  const sourceLocations = aggregateSourceLocations(issueRows).slice(0, 5)
  const readinessSegments = [
    { label: '0-49%', value: issueRows.filter((row) => row.readinessPercent < 50).length, color: '#ef4444' },
    { label: '50-79%', value: issueRows.filter((row) => row.readinessPercent >= 50 && row.readinessPercent < 80).length, color: '#f59e0b' },
    { label: '80-99%', value: issueRows.filter((row) => row.readinessPercent >= 80 && row.readinessPercent < 100).length, color: '#06b6d4' },
    { label: '100%', value: issueRows.filter((row) => row.readinessPercent >= 100).length, color: '#14c987' },
  ]
  const [page, setPage] = useState(1)
  const pageSize = 14
  const pagedRows = issueRows.slice((page - 1) * pageSize, page * pageSize)

  useEffect(() => {
    setPage(1)
  }, [issueRows.length])

  return <div className="w-full min-w-0 flex-1 space-y-1">
    <div className="flex items-center justify-end gap-1">
      <button className={`${inventoryMutedButton} h-9 rounded-xl`}>+ Tạo phiếu cấp</button>
    </div>
    <div className="grid grid-cols-1 gap-1 xl:grid-cols-12">
      <div className="xl:col-span-9">
    <CockpitChartCard title="Production Material Control Center" subtitle="REAL · Issue No, Work Order, Component, Required, Issued, Returned, Remaining, Readiness" heightClass={COCKPIT_HEIGHTS.TABLE_MD}>
      <div className="flex h-full min-h-0 flex-col">
      <CockpitTableShell className="min-h-0 flex-1">
      <table className="w-full min-w-[1320px] table-fixed text-left text-[13px]">
        <thead className={inventoryTableHead}><tr>{['Issue No','Date','Work Order','Component','Required','Issued','Returned','Remaining','Readiness','Status','Action'].map(x=><th className="px-1.5 py-0.5 text-left font-medium" key={x}>{x}</th>)}</tr></thead>
        <tbody>{pagedRows.map(row=>{
          const issue = row.issue
          return <tr className={`cursor-pointer ${inventoryTableRow}`} key={issue.id} onClick={() => setSelectedIssue(row)}>
            <td className="px-2 py-2 text-cyan-300">{row.issueNo}</td>
            <td className="px-2 py-2">{date(issue.issuedDate)}</td>
            <td className="px-2 py-2">{row.orderNo}<div className="mt-0.5 truncate text-[10px] text-slate-500">{row.orderTitle}</div></td>
            <td className="px-2 py-2">{row.component}</td>
            <td className="px-2 py-2 font-mono tabular-nums">{number(row.requiredQty)}</td>
            <td className="px-2 py-2 font-mono tabular-nums text-cyan-300">{number(row.issuedQty)}</td>
            <td className="px-2 py-2 font-mono tabular-nums text-amber-300">{number(row.returnedQty)}</td>
            <td className={row.remainingQty > 0 ? 'px-2 py-2 font-mono tabular-nums text-red-300' : 'px-2 py-2 font-mono tabular-nums text-emerald-300'}>{number(row.remainingQty)}</td>
            <td className="w-44 px-2 py-2">
              <Meter value={row.readinessPercent} tone={readinessBarClass(row.readinessPercent)} />
              <div className={`mt-1 text-[10px] ${row.readinessPercent >= 100 ? 'text-emerald-300' : row.readinessPercent >= 80 ? 'text-cyan-300' : row.readinessPercent >= 50 ? 'text-amber-300' : 'text-red-300'}`}>{formatQuantity(row.readinessPercent, 0)}%</div>
            </td>
            <td className="px-2 py-2"><StatusChip status={issue.status}/></td>
            <td className="px-2 py-2">{row.returnableQty > 0 ? <button disabled={returnIssue.isPending} onClick={(event) => { event.stopPropagation(); void runReturn(issue) }} className="text-amber-300 disabled:opacity-50">Return</button> : <span className="text-slate-500">Đã cân bằng</span>}</td>
          </tr>
        })}</tbody>
      </table>
      {!pagedRows.length ? <ModuleEmptyState icon={<span>📦</span>} title="Chưa có dữ liệu vật tư" description="Phiếu cấp phát vật tư sản xuất sẽ hiển thị tại đây." /> : null}
      </CockpitTableShell>
      <DataTablePagination page={page} pageSize={pageSize} total={issueRows.length} onPageChange={setPage} />
      </div>
    </CockpitChartCard>
      </div>
      <aside className="space-y-1 xl:col-span-3">
        <CockpitChartCard title="Thiếu vật tư" subtitle="REAL · Remaining = Required - NetIssued" heightClass={COCKPIT_HEIGHTS.CHART_SM}>
          <RankList rows={shortageWorkOrders.map((row) => ({ id: row.id, title: row.title, subtitle: row.subtitle, value: number(row.value) }))} empty="Không có WO thiếu vật tư" />
        </CockpitChartCard>
        <CockpitChartCard title="Theo ưu tiên" subtitle="TODO · API issue chưa có priority" heightClass={COCKPIT_HEIGHTS.CHART_SM}>
          <ModuleEmptyState icon={<span>🏭</span>} title="Chưa có dữ liệu ưu tiên" description="Cần backend trả priority theo issue hoặc WO để phân tích ưu tiên." />
        </CockpitChartCard>
        <CockpitChartCard title="Gần đây" subtitle="REAL · Phiếu cấp mới nhất" heightClass={COCKPIT_HEIGHTS.CHART_SM}>
          <RankList rows={issueRows.slice(0, 5).map((row) => ({ id: row.issue.id, title: row.issueNo, subtitle: row.orderNo, value: date(row.issue.issuedDate) }))} empty="Chưa có phiếu cấp phát" />
        </CockpitChartCard>
      </aside>
    </div>
    <div className="grid grid-cols-1 gap-1 xl:grid-cols-5">
      <CockpitChartCard title="Top vật tư được cấp phát" subtitle="REAL · Xếp theo issued qty" heightClass={COCKPIT_HEIGHTS.CHART_LG}>
        <RankList rows={topIssuedMaterials.map((row) => ({ id: row.id, title: row.title, subtitle: row.subtitle, value: number(row.value) }))} />
      </CockpitChartCard>
      <CockpitChartCard title="Top vật tư hoàn trả" subtitle="REAL · Xếp theo returned qty" heightClass={COCKPIT_HEIGHTS.CHART_LG}>
        <RankList rows={topReturnedMaterials.map((row) => ({ id: row.id, title: row.title, subtitle: row.subtitle, value: number(row.value) }))} empty="Chưa có vật tư hoàn trả" />
      </CockpitChartCard>
      <CockpitChartCard title="Readiness theo WO" subtitle="REAL · NetIssued / Required" heightClass={COCKPIT_HEIGHTS.CHART_LG}>
        <RankList rows={readinessByWorkOrder.map((row) => ({ id: row.id, title: row.title, subtitle: row.subtitle, value: `${formatQuantity(row.value, 0)}%` }))} empty="Chưa có dữ liệu readiness" />
      </CockpitChartCard>
      <CockpitChartCard title="Nguồn xuất kho sản xuất" subtitle="REAL · Warehouse / Zone / Slot / Level" heightClass={COCKPIT_HEIGHTS.CHART_LG}>
        <RankList rows={sourceLocations.map((row) => ({ id: row.id, title: row.title, subtitle: row.subtitle, value: number(row.value) }))} empty="Chưa có vị trí xuất" />
      </CockpitChartCard>
      <CockpitChartCard title="Readiness distribution" subtitle="REAL · Theo dòng cấp phát" heightClass={COCKPIT_HEIGHTS.CHART_LG}>
        <ProductionDonut centerValue={`${formatQuantity(completionRate, 0)}%`} centerLabel="ready" segments={readinessSegments} />
      </CockpitChartCard>
      <CockpitChartCard title="Business indicators" subtitle="REAL/TODO · NetIssued = Issued - Returned" heightClass={COCKPIT_HEIGHTS.CHART_LG}>
        <div className="space-y-2 text-xs text-slate-300">
          <Info k="Required" v={number(requiredTotal)} />
          <Info k="Net issued" v={number(issuedTotal - returnedTotal)} />
          <Info k="Remaining" v={number(remainingTotal)} />
          <Info k="Returnable" v={number(returnableTotal)} />
          <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3 text-slate-400">
            Giá trị cấp phát chưa tính được từ frontend vì API material issue hiện chưa trả unit cost/totalAmount.
          </div>
        </div>
      </CockpitChartCard>
    </div>
    <IssueDetailDrawer row={selectedIssue} onClose={() => setSelectedIssue(null)} />
  </div>
}

function IssueDetailDrawer({
  row,
  onClose,
}: {
  row: IssueControlRow | null
  onClose: () => void
}) {
  if (!row) return null
  const issue = row.issue
  return <ModuleDetailDrawer open title={issue.issueNo} subtitle={issue.productionOrder?.orderNo ?? issue.productionOrderId} onClose={onClose} widthClass="max-w-3xl">
    <div className="grid gap-3 md:grid-cols-3">
      <InventoryKpi title="Required" value={number(row.requiredQty)} note="Theo BOM/MO" tone="blue" />
      <InventoryKpi title="Net Issued" value={number(row.netIssuedQty)} note="Issued - Returned" tone="emerald" />
      <InventoryKpi title="Readiness" value={`${formatQuantity(row.readinessPercent, 0)}%`} note={row.remainingQty > 0 ? `Còn thiếu ${number(row.remainingQty)}` : 'Đã đủ'} tone={readinessTone(row.readinessPercent)} />
    </div>
    <div className="mt-3 grid gap-3 xl:grid-cols-2">
      <ProductionPanel title="Section A · Thông tin phiếu">
        <div className="space-y-3 text-xs">
          <Info k="Issue No" v={issue.issueNo} />
          <Info k="WO" v={row.orderNo} />
          <Info k="Component" v={row.component} />
          <Info k="Người thực hiện" v={issue.issuedBy ?? '-'} />
          <Info k="Ngày cấp phát" v={date(issue.issuedDate)} />
          <Info k="Status" v={issue.status} />
        </div>
      </ProductionPanel>
      <ProductionPanel title="Section C · Warehouse Source">
        <div className="space-y-3 text-xs">
          <Info k="Kho" v={issue.warehouseId ?? '-'} />
          <Info k="Zone" v={issue.zoneId ?? '-'} />
          <Info k="Slot" v={issue.slotId ?? '-'} />
          <Info k="Level" v={issue.level ? `L${issue.level}` : '-'} />
        </div>
      </ProductionPanel>
    </div>
    <div className="mt-3 grid gap-3 xl:grid-cols-2">
      <ProductionPanel title="Section B · Danh sách vật tư">
        <ModuleDataGrid>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-xs">
              <thead className={inventoryTableHead}><tr>{['Material','Required','Issued','Returned','Remaining'].map((head) => <th key={head} className="px-3 py-2 text-left font-medium">{head}</th>)}</tr></thead>
              <tbody>
                <tr className={inventoryTableRow}>
                  <td className="px-3 py-3 text-cyan-300">{row.material}</td>
                  <td>{number(row.requiredQty)}</td>
                  <td>{number(row.issuedQty)}</td>
                  <td>{number(row.returnedQty)}</td>
                  <td className={row.remainingQty > 0 ? 'text-red-300' : 'text-emerald-300'}>{number(row.remainingQty)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </ModuleDataGrid>
      </ProductionPanel>
      <ProductionPanel title="Section D · Issue Timeline">
        <div className="space-y-3 text-xs">
          <Info k="Ngày cấp phát" v={date(issue.issuedDate)} />
          <Info k="Ngày hoàn trả" v={row.returnedQty > 0 ? 'Đã ghi nhận hoàn trả (API chưa trả ngày riêng)' : '-'} />
          <Info k="Lịch sử phát sinh" v={issue.remarks ?? 'Không có ghi chú.'} />
          <Info k="Returnable" v={number(row.returnableQty)} />
        </div>
      </ProductionPanel>
    </div>
  </ModuleDetailDrawer>
}

type ConsumptionSummaryRow = {
  productionOrderId: string
  orderNo: string
  title: string
  inventoryItemId: string
  material: string
  unit?: string
  issuedQty: number
  returnedQty: number
  consumedQty: number
  scrapQty: number
  remainingQty: number
}

function Consumptions({ issues, consumptions }: { issues: ProductionMaterialIssue[]; consumptions: ProductionMaterialConsumption[] }) {
  const consume = useConsumeProductionMaterial()
  const rows = useMemo(() => buildConsumptionRows(issues, consumptions), [issues, consumptions])
  const issued = rows.reduce((sum, row) => sum + row.issuedQty, 0)
  const returned = rows.reduce((sum, row) => sum + row.returnedQty, 0)
  const consumed = rows.reduce((sum, row) => sum + row.consumedQty, 0)
  const scrap = rows.reduce((sum, row) => sum + row.scrapQty, 0)
  const remaining = rows.reduce((sum, row) => sum + row.remainingQty, 0)

  async function runConsume(row: ConsumptionSummaryRow) {
    const consumedInput = window.prompt(`Nhập số lượng tiêu hao cho ${row.material}`, String(row.remainingQty))
    if (consumedInput === null) return
    const scrapInput = window.prompt('Nhập số lượng phế phẩm/scrap', '0')
    if (scrapInput === null) return
    const consumedQty = parseLocaleNumber(consumedInput)
    const scrapQty = parseLocaleNumber(scrapInput)
    if (!Number.isFinite(consumedQty) || !Number.isFinite(scrapQty) || consumedQty < 0 || scrapQty < 0 || consumedQty + scrapQty <= 0) {
      toast.error('Số lượng tiêu hao hoặc scrap không hợp lệ')
      return
    }
    try {
      await consume.mutateAsync({
        id: row.productionOrderId,
        payload: {
          inventoryItemId: row.inventoryItemId,
          consumedQty,
          scrapQty,
          remark: `Consume from Production Cockpit for ${row.orderNo}`,
        },
      })
      toast.success('Đã ghi nhận tiêu hao vật tư sản xuất')
    } catch (error) {
      const raw = (error as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message
      toast.error(Array.isArray(raw) ? raw.join(', ') : raw || 'Không thể ghi nhận tiêu hao')
    }
  }

  return <div className="grid gap-3 xl:grid-cols-[1fr_330px]">
    <div className="space-y-3">
      <div className="grid gap-3 md:grid-cols-5">
        <InventoryKpi title="Issued" value={number(issued)} note="Đã cấp phát" tone="blue" />
        <InventoryKpi title="Returned" value={number(returned)} note="Đã hoàn trả" tone="amber" />
        <InventoryKpi title="Consumed" value={number(consumed)} note="Đã tiêu hao" tone="emerald" />
        <InventoryKpi title="Scrap" value={number(scrap)} note="Phế phẩm" tone="red" />
        <InventoryKpi title="Remaining" value={number(remaining)} note="Còn treo tại sản xuất" tone="purple" />
      </div>
      <InventoryChartCard title="Production Consumption" note="Issued = Returned + Consumed + Scrap + Remaining" action={<span className="text-[11px] text-cyan-300">{formatQuantity(rows.length, 0)} dòng vật tư</span>}>
        <ModuleDataGrid><div className="overflow-x-auto"><table className="w-full min-w-[1080px] text-left text-xs">
          <thead className={inventoryTableHead}><tr>{['MO Number','Material','Issued','Returned','Consumed','Scrap','Remaining','Unit','Action'].map(x=><th className="px-3 py-2 text-left font-medium" key={x}>{x}</th>)}</tr></thead>
          <tbody>{rows.slice(0,50).map(row=><tr className={inventoryTableRow} key={`${row.productionOrderId}-${row.inventoryItemId}`}>
            <td className="px-3 py-3 text-cyan-300">{row.orderNo}<div className="mt-1 text-[10px] text-slate-500">{row.title}</div></td>
            <td>{row.material}</td>
            <td>{number(row.issuedQty)}</td>
            <td>{number(row.returnedQty)}</td>
            <td className="text-emerald-300">{number(row.consumedQty)}</td>
            <td className="text-red-300">{number(row.scrapQty)}</td>
            <td className={row.remainingQty > 0 ? 'text-amber-300' : 'text-slate-500'}>{number(row.remainingQty)}</td>
            <td>{row.unit ?? '-'}</td>
            <td>{row.remainingQty > 0 && <button onClick={() => void runConsume(row)} className="text-cyan-300">Consume</button>}</td>
          </tr>)}</tbody>
        </table></div></ModuleDataGrid>
      </InventoryChartCard>
    </div>
    <aside className="space-y-3">
      <ProductionPanel title="Nguyên tắc tiêu hao">
        <div className="space-y-3 text-xs text-slate-300">
          <div>Chỉ consume vật tư đã issue cho MO.</div>
          <div className="text-cyan-300">Remaining = Issued - Returned - Consumed - Scrap.</div>
          <div>Ghi consume sẽ tạo ledger event CONSUME.</div>
        </div>
      </ProductionPanel>
      <ProductionPanel title="Phân bổ tiêu hao">
        <ProductionDonut centerValue={number(issued)} centerLabel="issued" segments={[
          { label: 'Returned', value: returned, color: '#f59e0b' },
          { label: 'Consumed', value: consumed, color: '#14c987' },
          { label: 'Scrap', value: scrap, color: '#ef4444' },
          { label: 'Remaining', value: remaining, color: '#7c3aed' },
        ]} />
      </ProductionPanel>
    </aside>
  </div>
}

function Reservations({ rows, orders, onOpen }: { rows: ProductionReservation[]; orders: ProductionOrder[]; onOpen: (row: ProductionOrder) => void }) {
  const reserve = useReserveProductionReservation()
  const issue = useIssueProductionReservation()
  const release = useReleaseProductionReservation()
  const expire = useExpireProductionReservation()

  async function run(action: () => Promise<unknown>, message: string) {
    try {
      await action()
      toast.success(message)
    } catch (error) {
      const raw = (error as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message
      toast.error(Array.isArray(raw) ? raw.join(', ') : raw || 'Không thể cập nhật giữ chỗ vật tư')
    }
  }

  const requiredTotal = rows.reduce((sum, row) => sum + row.lines.reduce((lineSum, line) => lineSum + Number(line.requiredQty ?? 0), 0), 0)
  const reservedTotal = rows.reduce((sum, row) => sum + row.lines.reduce((lineSum, line) => lineSum + Number(line.reservedQty ?? 0), 0), 0)
  const issuedTotal = rows.reduce((sum, row) => sum + row.lines.reduce((lineSum, line) => lineSum + Number(line.issuedQty ?? 0), 0), 0)
  const [page, setPage] = useState(1)
  const pageSize = 14
  const pagedRows = rows.slice((page - 1) * pageSize, page * pageSize)
  const statusSegments = [
    { label: 'Reserved', value: rows.filter((row) => row.status === 'RESERVED').length, color: '#14c987' },
    { label: 'Draft', value: rows.filter((row) => row.status === 'DRAFT').length, color: '#1d7cff' },
    { label: 'Cancelled', value: rows.filter((row) => row.status === 'CANCELLED').length, color: '#f59e0b' },
    { label: 'Expired', value: rows.filter((row) => row.status === 'EXPIRED').length, color: '#ef4444' },
  ]

  useEffect(() => {
    setPage(1)
  }, [rows.length])

  return <div className="w-full min-w-0 flex-1 space-y-1">
    <div className="grid grid-cols-1 gap-1 xl:grid-cols-12">
    <div className="xl:col-span-9">
    <CockpitChartCard title="Giữ chỗ vật tư sản xuất" subtitle="REAL · Reservation theo kho sản xuất" action={<span className="text-[11px] text-cyan-300">{formatQuantity(rows.length, 0)} reservation</span>} heightClass={COCKPIT_HEIGHTS.TABLE_MD}>
      <div className="flex h-full min-h-0 flex-col">
      <CockpitTableShell className="min-h-0 flex-1">
      <table className="w-full min-w-[1120px] table-fixed text-left text-[13px]">
        <thead className={inventoryTableHead}><tr>{['Reservation','MO Number','BOM','Dòng VT','Required','Reserved','Issued','Vị trí','Ngày giữ','Trạng thái','Thao tác'].map((x)=><th className="px-1.5 py-0.5 text-left font-medium" key={x}>{x}</th>)}</tr></thead>
        <tbody>{pagedRows.map((row)=>{
          const requiredQty = row.lines.reduce((sum, line) => sum + Number(line.requiredQty ?? 0), 0)
          const reservedQty = row.lines.reduce((sum, line) => sum + Number(line.reservedQty ?? 0), 0)
          const issuedQty = row.lines.reduce((sum, line) => sum + Number(line.issuedQty ?? 0), 0)
          const locations = new Set(row.lines.map((line) => [line.warehouse?.code, line.zone?.code, line.slotId, line.level].filter(Boolean).join('/')).filter(Boolean))
          const order = orders.find((item) => item.id === row.productionOrderId)
          return <tr className={inventoryTableRow} key={row.id}>
            <td className="px-2 py-2 text-cyan-300">{row.reservationNo}</td>
            <td className="px-2 py-2">{order ? <button className="text-left text-cyan-300" onClick={() => onOpen(order)}>{row.productionOrder?.orderNo ?? order.orderNo}</button> : row.productionOrder?.orderNo}</td>
            <td className="px-2 py-2">{row.bom?.bomNo ?? '-'}</td>
            <td className="px-2 py-2">{row.lines.length}</td>
            <td className="px-2 py-2 font-mono tabular-nums">{number(requiredQty)}</td>
            <td className="px-2 py-2 font-mono tabular-nums text-emerald-300">{number(reservedQty)}</td>
            <td className="px-2 py-2 font-mono tabular-nums">{number(issuedQty)}</td>
            <td className="px-2 py-2">{locations.size ? Array.from(locations).slice(0,2).join(', ') : '-'}</td>
            <td className="px-2 py-2">{row.reservedAt ? formatDateTime(row.reservedAt) : '-'}</td>
            <td className="px-2 py-2"><StatusChip status={row.status}/></td>
            <td className="px-2 py-2"><div className="flex flex-wrap gap-2">
              {row.status === 'DRAFT' && <button className="text-cyan-300" onClick={() => run(() => reserve.mutateAsync({ id: row.id }), 'Đã giữ chỗ vật tư')}>Reserve</button>}
              {['RESERVED','PARTIALLY_ISSUED'].includes(row.status) && <button className="text-emerald-300" onClick={() => run(() => issue.mutateAsync({ id: row.id }), 'Đã issue vật tư từ reservation')}>Issue</button>}
              {['RESERVED','PARTIALLY_ISSUED'].includes(row.status) && <button className="text-amber-300" onClick={() => run(() => release.mutateAsync({ id: row.id }), 'Đã hủy giữ chỗ')}>Release</button>}
              {['DRAFT','RESERVED','PARTIALLY_ISSUED'].includes(row.status) && <button className="text-red-300" onClick={() => run(() => expire.mutateAsync({ id: row.id }), 'Đã hết hạn giữ chỗ')}>Expire</button>}
            </div></td>
          </tr>
        })}</tbody>
      </table>
      {!pagedRows.length ? <ModuleEmptyState icon={<span>📦</span>} title="Chưa có dữ liệu vật tư" description="Reservation vật tư sản xuất sẽ hiển thị khi tạo giữ chỗ cho WO." /> : null}
      </CockpitTableShell>
      <DataTablePagination page={page} pageSize={pageSize} total={rows.length} onPageChange={setPage} />
      </div>
    </CockpitChartCard>
    </div>
    <aside className="space-y-1 xl:col-span-3">
      <CockpitChartCard title="Chờ cấp vật tư" subtitle="REAL · Reserved chưa issue" heightClass={COCKPIT_HEIGHTS.CHART_SM}>
        <div className="space-y-2 text-xs text-slate-300">
          <Info k="Required" v={number(requiredTotal)} />
          <Info k="Reserved" v={number(reservedTotal)} />
          <Info k="Issued" v={number(issuedTotal)} />
        </div>
      </CockpitChartCard>
      <CockpitChartCard title="Theo trạng thái" subtitle="REAL · Reservation status" heightClass={COCKPIT_HEIGHTS.CHART_SM}>
        <ProductionDonut centerValue={formatQuantity(rows.length, 0)} centerLabel="RSV" segments={[
          ...statusSegments,
        ]} />
      </CockpitChartCard>
      <CockpitChartCard title="Gần đây" subtitle="REAL · Reservation mới nhất" heightClass={COCKPIT_HEIGHTS.CHART_SM}>
        <RankList rows={rows.slice(0, 5).map((row) => ({ id: row.id, title: row.reservationNo, subtitle: row.productionOrder?.orderNo ?? row.productionOrderId, value: row.status }))} empty="Chưa có reservation" />
      </CockpitChartCard>
    </aside>
    </div>
  </div>
}

function MaterialLedger({ rows, orders, filters, onFiltersChange }: { rows: ProductionMaterialLedger[]; orders: ProductionOrder[]; filters: ProductionMaterialLedgerParams; onFiltersChange: (filters: ProductionMaterialLedgerParams) => void }) {
  const materials = useMemo(() => {
    const byId = new Map<string, NonNullable<ProductionMaterialLedger['inventoryItem']>>()
    rows.forEach((row) => {
      if (row.inventoryItem) byId.set(row.inventoryItem.id, row.inventoryItem)
    })
    return Array.from(byId.values()).sort((a, b) => a.code.localeCompare(b.code))
  }, [rows])
  const reserveQty = rows.filter((row) => row.eventType === 'RESERVE').reduce((sum, row) => sum + Number(row.quantity ?? 0), 0)
  const releaseQty = rows.filter((row) => row.eventType === 'RELEASE').reduce((sum, row) => sum + Math.abs(Number(row.quantity ?? 0)), 0)
  const netQty = rows.reduce((sum, row) => sum + Number(row.quantity ?? 0), 0)
  const eventTypes: Array<ProductionMaterialLedger['eventType']> = ['RESERVE', 'RELEASE', 'ISSUE', 'RETURN', 'CONSUME', 'ADJUST']
  const [page, setPage] = useState(1)
  const pageSize = 14
  const pagedRows = rows.slice((page - 1) * pageSize, page * pageSize)
  const warehouseRows = Array.from(rows.reduce((map, row) => {
    const key = row.warehouse?.code ?? row.warehouseId ?? 'Chưa rõ kho'
    map.set(key, (map.get(key) ?? 0) + Math.abs(Number(row.quantity ?? 0)))
    return map
  }, new Map<string, number>()).entries())
    .map(([id, value]) => ({ id, title: id, subtitle: 'Quantity movement', value: number(value) }))
    .sort((a, b) => parseLocaleNumber(b.value) - parseLocaleNumber(a.value))

  useEffect(() => {
    setPage(1)
  }, [rows.length])

  function update(key: keyof ProductionMaterialLedgerParams, value: string) {
    onFiltersChange({ ...filters, [key]: value || undefined })
  }

  return <div className="w-full min-w-0 flex-1 space-y-1">
      <div className="grid grid-cols-1 gap-1 md:grid-cols-5">
          <select value={filters.productionOrderId ?? ''} onChange={(event) => update('productionOrderId', event.target.value)} className={inventoryInput}>
            <option value="">Tất cả lệnh SX</option>
            {orders.map((order) => <option key={order.id} value={order.id}>{order.orderNo} · {order.title}</option>)}
          </select>
          <select value={filters.inventoryItemId ?? ''} onChange={(event) => update('inventoryItemId', event.target.value)} className={inventoryInput}>
            <option value="">Tất cả vật tư</option>
            {materials.map((material) => <option key={material.id} value={material.id}>{material.code} · {material.name}</option>)}
          </select>
          <select value={filters.eventType ?? ''} onChange={(event) => update('eventType', event.target.value)} className={inventoryInput}>
            <option value="">Tất cả event</option>
            {eventTypes.map((eventType) => <option key={eventType} value={eventType}>{eventType}</option>)}
          </select>
          <input type="date" value={filters.fromDate ?? ''} onChange={(event) => update('fromDate', event.target.value)} className={inventoryInput} />
          <input type="date" value={filters.toDate ?? ''} onChange={(event) => update('toDate', event.target.value)} className={inventoryInput} />
      </div>
      <div className="grid grid-cols-1 gap-1 xl:grid-cols-12">
        <div className="xl:col-span-9">
      <CockpitChartCard title="Production Material Ledger" subtitle="REAL · Sổ vật tư sản xuất theo event" action={<span className="text-[11px] text-cyan-300">{formatQuantity(rows.length, 0)} dòng</span>} heightClass={COCKPIT_HEIGHTS.TABLE_MD}>
        <div className="flex h-full min-h-0 flex-col">
        <CockpitTableShell className="min-h-0 flex-1">
        <table className="w-full min-w-[1060px] table-fixed text-left text-[13px]">
          <thead className={inventoryTableHead}><tr>{['Thời gian','Event','MO','Reservation','Material','Vị trí','Quantity','Created By','Remark'].map((x)=><th className="px-1.5 py-0.5 text-left font-medium" key={x}>{x}</th>)}</tr></thead>
          <tbody>{pagedRows.map((row)=><tr key={row.id} className={inventoryTableRow}>
            <td className="px-2 py-2">{formatDateTime(row.eventDate)}</td>
            <td className="px-2 py-2"><StatusChip status={row.eventType}/></td>
            <td className="px-2 py-2 text-cyan-300">{row.productionOrder?.orderNo ?? row.productionOrderId}</td>
            <td className="px-2 py-2">{row.reservation?.reservationNo ?? '-'}</td>
            <td className="px-2 py-2">{row.inventoryItem ? `${row.inventoryItem.code} · ${row.inventoryItem.name}` : row.inventoryItemId}</td>
            <td className="px-2 py-2">{[row.warehouse?.code, row.zone?.code, row.slotId, row.level ? `L${row.level}` : undefined].filter(Boolean).join('/') || '-'}</td>
            <td className={Number(row.quantity) < 0 ? 'px-2 py-2 font-mono tabular-nums text-amber-300' : 'px-2 py-2 font-mono tabular-nums text-emerald-300'}>{number(row.quantity)}</td>
            <td className="px-2 py-2">{row.createdBy ?? '-'}</td>
            <td className="px-2 py-2">{row.remark ?? '-'}</td>
          </tr>)}</tbody>
        </table>
        {!pagedRows.length ? <ModuleEmptyState icon={<span>📦</span>} title="Chưa có dữ liệu vật tư" description="Ledger sẽ có dữ liệu khi reservation, issue, return, consume hoặc adjust phát sinh." /> : null}
        </CockpitTableShell>
        <DataTablePagination page={page} pageSize={pageSize} total={rows.length} onPageChange={setPage} />
        </div>
      </CockpitChartCard>
        </div>
    <aside className="space-y-1 xl:col-span-3">
      <CockpitChartCard title="Giá trị xuất" subtitle="TODO · Ledger chưa có unit cost" heightClass={COCKPIT_HEIGHTS.CHART_SM}>
        <ModuleEmptyState icon={<span>📦</span>} title="Chưa có giá trị xuất" description="Cần cost trên ledger/material issue để hiển thị giá trị." />
      </CockpitChartCard>
      <CockpitChartCard title="Theo kho" subtitle="REAL · Quantity movement" heightClass={COCKPIT_HEIGHTS.CHART_SM}>
        <RankList rows={warehouseRows.slice(0, 5)} empty="Chưa có dữ liệu kho" />
      </CockpitChartCard>
      <CockpitChartCard title="Gần đây" subtitle="REAL · Event mới nhất" heightClass={COCKPIT_HEIGHTS.CHART_SM}>
        <RankList rows={rows.slice(0, 5).map((row) => ({ id: row.id, title: row.eventType, subtitle: row.productionOrder?.orderNo ?? row.productionOrderId, value: formatDateTime(row.eventDate) }))} empty="Chưa có ledger event" />
      </CockpitChartCard>
    </aside>
      </div>
      <div className="grid grid-cols-1 gap-1 xl:grid-cols-2">
      <CockpitChartCard title="Tổng quan ledger" subtitle="REAL · Quantity movement" heightClass={COCKPIT_HEIGHTS.CHART_LG}>
        <div className="space-y-2 text-xs">
          <Info k="Reserve" v={number(reserveQty)} />
          <Info k="Release" v={number(releaseQty)} />
          <Info k="Net" v={number(netQty)} />
          <Info k="Số dòng" v={formatQuantity(rows.length, 0)} />
        </div>
      </CockpitChartCard>
      <CockpitChartCard title="Phân bổ event" subtitle="REAL · Event type distribution" heightClass={COCKPIT_HEIGHTS.CHART_LG}>
        <ProductionDonut centerValue={formatQuantity(rows.length, 0)} centerLabel="events" segments={eventTypes.map((eventType, index) => ({
          label: eventType,
          value: rows.filter((row) => row.eventType === eventType).length,
          color: ['#1d7cff', '#f59e0b', '#14c987', '#06b6d4', '#7c3aed', '#ef4444'][index],
        }))} />
      </CockpitChartCard>
      </div>
  </div>
}

function Logs({ rows }: { rows: ReturnType<typeof useProductionLogs>['data'] }) {
  const logs = rows ?? []
  const [page, setPage] = useState(1)
  const pageSize = 14
  const pagedRows = logs.slice((page - 1) * pageSize, page * pageSize)
  const todayRows = logs.filter((row) => sameDay(row.createdAt))
  const typeRows = Array.from(logs.reduce((map, row) => {
    map.set(row.type, (map.get(row.type) ?? 0) + 1)
    return map
  }, new Map<string, number>()).entries())
    .map(([id, value]) => ({ id, title: id, subtitle: 'Log type', value: formatQuantity(value, 0) }))

  useEffect(() => {
    setPage(1)
  }, [logs.length])

  return <div className="w-full min-w-0 flex-1 space-y-1">
    <div className="grid grid-cols-1 gap-1 xl:grid-cols-12">
      <div className="xl:col-span-9">
  <CockpitChartCard title="Nhật ký thực thi sản xuất" subtitle="REAL · Production logs" heightClass={COCKPIT_HEIGHTS.TABLE_MD}>
    <div className="flex h-full min-h-0 flex-col">
    <CockpitTableShell className="min-h-0 flex-1">
    <table className="w-full min-w-[900px] table-fixed text-left text-[13px]"><thead className={inventoryTableHead}><tr>{['Timestamp','MO','Structure','Operation','Operator','Workshop','Status','Remarks'].map(x=><th className="px-1.5 py-0.5 text-left font-medium" key={x}>{x}</th>)}</tr></thead><tbody>{pagedRows.map(row=><tr className={inventoryTableRow} key={row.id}><td className="px-2 py-2">{formatDateTime(row.createdAt)}</td><td className="px-2 py-2 text-cyan-300">{row.productionOrder.orderNo}</td><td className="px-2 py-2">{row.productionOrder.title}</td><td className="px-2 py-2">{row.stage?.name??row.type}</td><td className="px-2 py-2">{row.workerId??'-'}</td><td className="px-2 py-2">{row.stage?.name??'-'}</td><td className="px-2 py-2"><StatusChip status={row.type}/></td><td className="px-2 py-2">{row.message}</td></tr>)}</tbody></table>
    {!pagedRows.length ? <ModuleEmptyState icon={<span>🕒</span>} title="Chưa có nhật ký" description="Nhật ký sản xuất sẽ hiển thị khi có thao tác production." /> : null}
    </CockpitTableShell>
    <DataTablePagination page={page} pageSize={pageSize} total={logs.length} onPageChange={setPage} />
    </div>
  </CockpitChartCard>
      </div>
      <aside className="space-y-1 xl:col-span-3">
        <CockpitChartCard title="Hoạt động hôm nay" subtitle="REAL · Log count" heightClass={COCKPIT_HEIGHTS.CHART_SM}>
          <div className="space-y-2 text-xs text-slate-300">
            <Info k="Hôm nay" v={formatQuantity(todayRows.length, 0)} />
            <Info k="Tổng log" v={formatQuantity(logs.length, 0)} />
            <Info k="Operator" v="TODO · API chưa có user profile" />
          </div>
        </CockpitChartCard>
        <CockpitChartCard title="Theo loại" subtitle="REAL · Log type" heightClass={COCKPIT_HEIGHTS.CHART_SM}>
          <RankList rows={typeRows.slice(0, 5)} empty="Chưa có loại nhật ký" />
        </CockpitChartCard>
        <CockpitChartCard title="Gần đây" subtitle="REAL · Logs mới nhất" heightClass={COCKPIT_HEIGHTS.CHART_SM}>
          <RankList rows={logs.slice(0, 5).map((row) => ({ id: row.id, title: row.productionOrder.orderNo, subtitle: row.message, value: formatDateTime(row.createdAt) }))} empty="Chưa có nhật ký gần đây" />
        </CockpitChartCard>
      </aside>
    </div>
  </div>
}

function OrderWorkspace({ order, onClose }: { order: ProductionOrder; onClose: () => void }) {
  const { data: latest = order } = useProductionOrder(order.id)
  const { data: requirements = [] } = useMaterialRequirements(order.id)
  const { data: reservationPreview } = useReservationPreview(order.id)
  const { data: orderReservations = [] } = useProductionReservations(order.id)
  const { data: slots = [] } = useYardSlots()
  const start = useStartProductionOrder()
  const createReservation = useCreateProductionReservation()
  const createComponentFromOrder = useCreateComponentFromProductionOrder()
  const complete = useCompleteProductionStage()
  const stage = useStageProductionToYard()
  const [slotId, setSlotId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [weight, setWeight] = useState('1')
  const [actionError, setActionError] = useState('')
  const [actionMessage, setActionMessage] = useState('')
  const activeStage = latest.stages?.find((item) => item.status === 'IN_PROGRESS' || item.status === 'READY')
  const allStagesCompleted = Boolean(latest.stages?.length) && latest.stages!.every((item) => item.status === 'COMPLETED')
  const canStageToYard = latest.status === 'COMPLETED' || allStagesCompleted
  const availableSlots = slots.filter((slot) => slot.status !== 'BLOCKED' && slot.currentStackLevel < slot.maxStackLevel)
  const targetSlot = availableSlots.find((slot) => slot.id === slotId)
  const stagedQuantity = slots
    .flatMap((slot) => slot.placements ?? [])
    .filter((placement) => placement.itemId === latest.component?.id && placement.metadata?.productionOrderId === latest.id)
    .reduce((sum, placement) => sum + Number(placement.quantity ?? 0), 0)
  const remainingQuantity = Math.max(0, Number(latest.quantity ?? 0) - stagedQuantity)
  const stageQuantity = parseLocaleNumber(quantity) || 0
  const stageInvalid = !slotId || stageQuantity <= 0 || stageQuantity > remainingQuantity
  const netIssuedMaterialQty = (latest.materialIssues ?? []).reduce(
    (sum, issue) => sum + Number(issue.issuedQty ?? 0) - Number(issue.returnedQty ?? 0),
    0,
  )
  const materialReadiness = workOrderReadiness(latest)
  const orderIssueRows = latest.materialIssues ?? []
  const reservedQty = orderReservations.reduce((sum, row) => sum + row.lines.reduce((lineSum, line) => lineSum + Number(line.reservedQty ?? 0), 0), 0)
  const reservationIssuedQty = orderReservations.reduce((sum, row) => sum + row.lines.reduce((lineSum, line) => lineSum + Number(line.issuedQty ?? 0), 0), 0)
  const availableQty = reservationPreview?.totalAvailableQty ?? 0
  const canCreateComponentFromOrder = netIssuedMaterialQty > 0
  const stageDisabledReason = !slotId
    ? 'Chọn slot còn tầng trống trước khi chuyển bãi.'
    : stageQuantity <= 0
      ? 'Nhập số lượng chuyển bãi lớn hơn 0.'
      : stageQuantity > remainingQuantity
        ? `Số lượng chuyển bãi vượt quá số lượng còn lại (${number(remainingQuantity)}).`
        : ''

  useEffect(() => {
    if (remainingQuantity > 0 && parseLocaleNumber(quantity) > remainingQuantity) {
      setQuantity(number(remainingQuantity))
    }
  }, [quantity, remainingQuantity])

  function productionErrorMessage(error: unknown) {
    const data = (error as { response?: { data?: { message?: string | string[] } } })?.response?.data
    const raw = Array.isArray(data?.message) ? data?.message.join(', ') : data?.message
    if (raw === 'QC inspection must be passed or approved before staging finished component to yard') {
      return 'Chưa có phiếu QC đạt/đã duyệt cho lệnh sản xuất hoặc cấu kiện này. Vào Chất lượng (QC), tạo phiếu kiểm tra và chấm Đạt/Duyệt trước khi chuyển ra bãi.'
    }
    if (raw === 'Production order must be completed before yard staging') {
      return 'Lệnh sản xuất chưa hoàn tất toàn bộ công đoạn nên chưa được chuyển ra bãi.'
    }
    if (raw === 'Cannot create component without issued production material') {
      return 'Cần issue vật tư từ reservation trước khi tạo hoặc đánh dấu cấu kiện từ MO.'
    }
    if (raw === 'Yard slot not found') {
      return 'Slot bãi không tồn tại hoặc vừa bị thay đổi. Chọn lại slot khác.'
    }
    if (raw?.startsWith('Only ')) {
      return `Số lượng còn được nhập bãi không đủ. Backend trả về: ${raw}.`
    }
    return raw || 'Không thể cập nhật lệnh sản xuất.'
  }

  async function run(action: () => Promise<unknown>, message: string) {
    setActionError('')
    setActionMessage('')
    try {
      await action()
      setActionMessage(message)
      toast.success(message)
    } catch (error) {
      const message = productionErrorMessage(error)
      setActionError(message)
      toast.error(message)
    }
  }

  async function reserveMaterials() {
    await run(
      () => createReservation.mutateAsync({ id: latest.id, payload: { autoReserve: true } }),
      'Đã tạo và giữ chỗ vật tư sản xuất',
    )
  }

  return <ModuleDetailDrawer
    open
    title={latest.title}
    subtitle={latest.orderNo}
    actions={<StatusChip status={canStageToYard ? 'COMPLETED' : latest.status} />}
    onClose={onClose}
    widthClass="max-w-7xl"
  >
      <div className={inventoryPageStack}>
      <div className={`grid ${inventoryGridGap} xl:grid-cols-[1fr_340px]`}>
        <div className="space-y-3">
          <InventoryChartCard title="Thông tin WO" note="Section A">
            <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
              <InfoCard title="WO No" value={latest.orderNo} />
              <InfoCard title="Component" value={latest.component ? `${latest.component.code} · ${latest.component.name}` : '-'} />
              <InfoCard title="Project" value={latest.projectId ?? latest.component?.project?.code ?? '-'} />
              <InfoCard title="Quantity" value={number(latest.quantity)} />
              <InfoCard title="Status" value={latest.status} />
              <InfoCard title="Due Date" value={date(latest.plannedEndAt)} tone={isDelayedOrder(latest) ? 'text-red-300' : 'text-white'} />
            </div>
          </InventoryChartCard>
          <InventoryChartCard title="Material Status" note="Section B · BOM required vs net issued">
            <div className="grid gap-3 md:grid-cols-4">
              <InventoryKpi title="Required" value={number(materialReadiness.requiredQty)} note="BOM demand" tone="blue" />
              <InventoryKpi title="Issued" value={number(materialReadiness.issuedQty)} note="Issue - return" tone="emerald" />
              <InventoryKpi title="Remaining" value={number(materialReadiness.remainingQty)} note="Còn thiếu" tone={materialReadiness.remainingQty > 0 ? 'amber' : 'emerald'} />
              <InventoryKpi title="Readiness" value={`${formatQuantity(materialReadiness.readinessPercent, 0)}%`} note={materialReadiness.readinessPercent >= 100 ? 'READY TO RELEASE' : 'Chưa đủ vật tư'} tone={readinessTone(materialReadiness.readinessPercent)} />
            </div>
            <div className="mt-3">
              <Meter value={materialReadiness.readinessPercent} tone={readinessBarClass(materialReadiness.readinessPercent)} />
            </div>
          </InventoryChartCard>
          <InventoryChartCard title="Production Progress" note="Section C">
            <div className="grid gap-2 md:grid-cols-6">
              {workOrderStageProgress(latest).map((item) => (
                <div key={item.stage} className={`rounded-xl border px-3 py-2 text-xs ${item.active ? 'border-cyan-400/40 bg-cyan-400/10 text-cyan-200' : 'border-white/10 bg-white/[0.035] text-slate-500'}`}>
                  {item.stage}
                </div>
              ))}
            </div>
          </InventoryChartCard>
          <InventoryChartCard title="Material Issues" note="Section D">
            <ModuleDataGrid>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-xs">
                  <thead className={inventoryTableHead}><tr>{['Issue No', 'Date', 'Qty', 'Value'].map((head) => <th key={head} className="px-3 py-2 text-left font-medium">{head}</th>)}</tr></thead>
                  <tbody>
                    {orderIssueRows.length ? orderIssueRows.map((issueRow) => (
                      <tr key={issueRow.id} className={inventoryTableRow}>
                        <td className="px-3 py-3 text-cyan-300">{issueRow.issueNo}</td>
                        <td>{date(issueRow.issuedDate)}</td>
                        <td>{number(issueRow.issuedQty)}</td>
                        <td className="text-slate-500">Chưa có unit cost</td>
                      </tr>
                    )) : <tr><td colSpan={4} className="px-3 py-5 text-center text-slate-500">Chưa có phiếu cấp phát vật tư.</td></tr>}
                  </tbody>
                </table>
              </div>
            </ModuleDataGrid>
          </InventoryChartCard>
          <InventoryChartCard title="Reservations" note="Section E">
            <div className="grid gap-3 md:grid-cols-3">
              <InventoryKpi title="Reserved Qty" value={number(reservedQty)} note="Đã giữ chỗ" tone="cyan" />
              <InventoryKpi title="Issued Qty" value={number(reservationIssuedQty)} note="Đã xuất từ reservation" tone="emerald" />
              <InventoryKpi title="Available Qty" value={number(availableQty)} note="Kho SX khả dụng" tone="blue" />
            </div>
          </InventoryChartCard>
        </div>
        <aside className="space-y-3">
          <ProductionPanel title="Release readiness">
            <div className="space-y-3 text-xs text-slate-300">
              <Info k="Material Ready" v={`${formatQuantity(materialReadiness.readinessPercent, 0)}%`} />
              <Info k="Rule" v=">= 100% = READY TO RELEASE" />
              <Info k="Workflow lock" v="Chưa khóa, chỉ cảnh báo UI" />
            </div>
          </ProductionPanel>
          <ProductionPanel title="Tổng quan nhanh">
            <ProductionDonut centerValue={`${formatQuantity(materialReadiness.readinessPercent, 0)}%`} centerLabel="ready" segments={[
              { label: 'Issued', value: materialReadiness.issuedQty, color: '#14c987' },
              { label: 'Remaining', value: materialReadiness.remainingQty, color: '#f59e0b' },
            ]} />
          </ProductionPanel>
        </aside>
      </div>
      <div className={`grid ${inventoryGridGap} xl:grid-cols-[1fr_340px]`}>
        <div className="space-y-3">
          <ProductionPanel title="Tiến độ công đoạn">
            <div className="grid gap-2 md:grid-cols-4">{(latest.stages??[]).map(item=><div key={item.id} className="rounded border border-slate-800 bg-slate-950 p-3"><div className="text-xs text-slate-400">Bước {item.sequence}</div><div className="mt-1 text-sm">{item.name}</div><div className="mt-2"><StatusChip status={item.status}/></div></div>)}</div>
          </ProductionPanel>
          <ProductionPanel title="Nhu cầu vật tư theo BOM">
            <table className="w-full text-left text-xs"><thead className="text-[10px] uppercase text-slate-500"><tr>{['Material','Required','Available SX','Issued','Shortage','Unit'].map(x=><th className="pb-3" key={x}>{x}</th>)}</tr></thead><tbody>{requirements.map(row=><tr className="border-t border-slate-800" key={row.materialId}><td className="py-3 text-cyan-300">{row.materialCode} · {row.materialName}</td><td>{number(row.requiredQty)}</td><td>{number(row.availableQty)}</td><td>{number(row.issuedQty)}</td><td className={row.shortageQty?'text-red-300':'text-emerald-300'}>{number(row.shortageQty)}</td><td>{row.unit}</td></tr>)}</tbody></table>
          </ProductionPanel>
          <ProductionPanel title="Giữ chỗ vật tư kho sản xuất" action={<StatusChip status={reservationPreview?.status ?? 'PREVIEW'} />}>
            <div className="mb-3 grid gap-2 md:grid-cols-4">
              <div className="rounded border border-slate-800 bg-slate-950 p-3 text-xs"><div className="text-slate-500">Required</div><div className="mt-1 text-lg text-white">{number(reservationPreview?.totalRequiredQty ?? 0)}</div></div>
              <div className="rounded border border-slate-800 bg-slate-950 p-3 text-xs"><div className="text-slate-500">Đã giữ bởi MO khác</div><div className="mt-1 text-lg text-amber-300">{number(reservationPreview?.totalAlreadyReservedQty ?? 0)}</div></div>
              <div className="rounded border border-slate-800 bg-slate-950 p-3 text-xs"><div className="text-slate-500">Có thể giữ</div><div className="mt-1 text-lg text-emerald-300">{number(reservationPreview?.totalReservableQty ?? 0)}</div></div>
              <div className="rounded border border-slate-800 bg-slate-950 p-3 text-xs"><div className="text-slate-500">Thiếu</div><div className={`mt-1 text-lg ${(reservationPreview?.totalShortageQty ?? 0) > 0 ? 'text-red-300' : 'text-emerald-300'}`}>{number(reservationPreview?.totalShortageQty ?? 0)}</div></div>
            </div>
            <div className="overflow-x-auto rounded border border-slate-800">
              <table className="w-full min-w-[820px] text-left text-xs">
                <thead className="bg-slate-900/80 text-[10px] uppercase text-slate-500"><tr>{['Material','Required','Reserved khác','Reservable','Shortage','Vị trí cấp'].map(x=><th className="px-3 py-2" key={x}>{x}</th>)}</tr></thead>
                <tbody>{(reservationPreview?.lines ?? []).map(row=><tr className="border-t border-slate-800" key={row.bomItemId}>
                  <td className="px-3 py-3 text-cyan-300">{row.materialCode} · {row.materialName}</td>
                  <td>{number(row.requiredQty)}</td>
                  <td>{number(row.alreadyReservedQty)}</td>
                  <td className="text-emerald-300">{number(row.reservableQty)}</td>
                  <td className={row.shortageQty > 0 ? 'text-red-300' : 'text-emerald-300'}>{number(row.shortageQty)}</td>
                  <td>{row.allocations.length ? row.allocations.map(item => `${item.warehouseCode ?? 'SX'}/${item.zoneCode ?? '-'}${item.slotId ? `/${item.slotId}` : ''}${item.level ? `/L${item.level}` : ''}: ${number(item.reservedQty)}`).slice(0,2).join(', ') : '-'}</td>
                </tr>)}</tbody>
              </table>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-slate-400">{formatQuantity(orderReservations.filter((item) => item.status === 'RESERVED').length, 0)} reservation đang active cho MO này</span>
              <button onClick={reserveMaterials} disabled={!reservationPreview || reservationPreview.status === 'SHORTAGE' || createReservation.isPending} className="rounded bg-cyan-600 px-3 py-2 font-semibold text-white disabled:opacity-40">Tạo và giữ chỗ vật tư</button>
            </div>
          </ProductionPanel>
        </div>
        <aside className="space-y-3">
          <ProductionPanel title="Thông tin MO">
            <div className="space-y-3 text-xs">
              <Info k="Cấu kiện" v={latest.component ? `${latest.component.code} · ${latest.component.name}` : '-'}/>
              <Info k="BOM" v={latest.bom?.bomNo??'-'}/>
              <Info k="Số lượng MO" v={number(latest.quantity)}/>
              <Info k="Đã nhập bãi" v={number(stagedQuantity)}/>
              <Info k="Còn được nhập" v={number(remainingQuantity)}/>
              <Info k="Ưu tiên" v={latest.priority}/>
              <Info k="Bắt đầu" v={date(latest.plannedStartAt)}/>
              <Info k="Đến hạn" v={date(latest.plannedEndAt)}/>
            </div>
          </ProductionPanel>
          <ProductionPanel title="Thao tác thực thi">
            <div className="space-y-2">
              {latest.status !== 'IN_PROGRESS' && !canStageToYard && <button onClick={() => run(() => start.mutateAsync(latest.id), 'Đã bắt đầu sản xuất')} className="w-full rounded bg-cyan-600 px-3 py-2 text-xs font-semibold">Bắt đầu sản xuất</button>}
              <button
                onClick={() => run(() => createComponentFromOrder.mutateAsync(latest.id), 'Đã tạo/đánh dấu cấu kiện từ lệnh sản xuất')}
                disabled={!canCreateComponentFromOrder || createComponentFromOrder.isPending}
                className="w-full rounded bg-blue-600 px-3 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-40"
              >
                Tạo cấu kiện từ MO
              </button>
              {!canCreateComponentFromOrder ? <p className="rounded border border-amber-900 bg-amber-950/30 p-2 text-xs text-amber-300">Cần issue vật tư từ reservation trước khi tạo hoặc đánh dấu cấu kiện từ MO.</p> : null}
              {latest.status === 'IN_PROGRESS' && activeStage && <button onClick={() => run(() => complete.mutateAsync(activeStage.id), `Đã hoàn tất ${activeStage.name}`)} className="w-full rounded bg-emerald-600 px-3 py-2 text-xs font-semibold">Hoàn tất bước: {activeStage.name}</button>}
              {canStageToYard && <p className="rounded border border-emerald-800 bg-emerald-950/30 p-2 text-xs text-emerald-300">Tất cả công đoạn đã hoàn tất. Có thể chuyển thành phẩm ra bãi.</p>}
              <p className="text-xs text-slate-400">Mỗi lần hoàn tất sẽ chuyển trạng thái cấu kiện sang công đoạn kế tiếp.</p>
            </div>
          </ProductionPanel>
          {canStageToYard && <ProductionPanel title="Chuyển thành phẩm ra bãi">
            <div className="space-y-2 text-xs">
              <select value={slotId} onChange={(e)=>{ setSlotId(e.target.value); setActionError(''); setActionMessage('') }} className="h-10 w-full rounded border border-slate-700 bg-slate-950 px-2">
                <option value="">Chọn slot còn tầng trống</option>
                {availableSlots.map(slot=><option key={slot.id} value={slot.id}>{slot.zone.code} / {slot.code} · tầng kế tiếp L{slot.currentStackLevel + 1}/{slot.maxStackLevel}</option>)}
              </select>
              {!availableSlots.length ? <p className="rounded border border-amber-900 bg-amber-950/30 p-2 text-amber-300">Bãi không còn slot có tầng trống.</p> : null}
              <input value={quantity} onFocus={(e)=>setQuantity(formatQuantityInput(e.target.value))} onBlur={(e)=>setQuantity(formatQuantity(e.target.value))} onChange={(e)=>{ setQuantity(formatQuantityInput(e.target.value)); setActionError(''); setActionMessage('') }} inputMode="decimal" className="h-10 w-full rounded border border-slate-700 bg-slate-950 px-2" placeholder="Số lượng nhập bãi"/>
              <input value={weight} onFocus={(e)=>setWeight(formatQuantityInput(e.target.value))} onBlur={(e)=>setWeight(formatQuantity(e.target.value))} onChange={(e)=>setWeight(formatQuantityInput(e.target.value))} inputMode="decimal" className="h-10 w-full rounded border border-slate-700 bg-slate-950 px-2" placeholder="Khối lượng"/>
              <div className="rounded border border-slate-800 bg-slate-950/70 p-2 text-slate-300">
                <div>Slot đích: <b className="text-cyan-300">{targetSlot ? `${targetSlot.zone.code}/${targetSlot.code}` : '--'}</b></div>
                <div className="mt-1">Tầng xếp tự động: <b className="text-cyan-300">L{targetSlot ? targetSlot.currentStackLevel + 1 : '--'}</b></div>
                <div className="mt-1">Còn được nhập bãi: <b className={stageInvalid ? 'text-red-300' : 'text-emerald-300'}>{number(remainingQuantity)}</b></div>
              </div>
              {stageDisabledReason ? <p className="rounded border border-amber-900 bg-amber-950/30 p-2 text-amber-300">{stageDisabledReason}</p> : null}
              {actionError ? <p className="rounded border border-red-900 bg-red-950/40 p-2 text-red-200">{actionError}</p> : null}
              {actionMessage ? <p className="rounded border border-emerald-900 bg-emerald-950/40 p-2 text-emerald-200">{actionMessage}</p> : null}
              <button onClick={() => run(() => stage.mutateAsync({ id: latest.id, payload: { slotId, quantity: stageQuantity, weight: parseLocaleNumber(weight) || 0 } }), 'Đã chuyển thành phẩm ra bãi')} disabled={stageInvalid || stage.isPending} className="w-full rounded bg-amber-600 px-3 py-2 font-semibold disabled:opacity-40">Xác nhận QC và chuyển bãi</button>
            </div>
          </ProductionPanel>}
        </aside>
      </div>
      </div>
  </ModuleDetailDrawer>
}

function BomWorkspace({ bom, onClose }: { bom: ProductionBom; onClose: () => void }) {
  return <ModuleDetailDrawer open title={bom.productName} subtitle={bom.bomNo} onClose={onClose} widthClass="max-w-6xl">
    <div className="mb-4 flex flex-wrap gap-2 text-xs text-slate-300">{['Information','Drawings','Materials','Production Process','History'].map(x=><span className="rounded-xl border border-cyan-300/15 bg-white/[0.045] px-3 py-2" key={x}>{x}</span>)}</div>
    <div className="grid gap-3 xl:grid-cols-2">
      <ProductionPanel title="Materials Grid">
        <ModuleDataGrid><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-xs"><thead className={inventoryTableHead}><tr>{['Material','Spec','Unit','Required','Waste','Net','Category'].map(x=><th className="px-3 py-2 text-left font-medium" key={x}>{x}</th>)}</tr></thead><tbody>{bom.items.map(row=><tr className={inventoryTableRow} key={row.id}><td className="px-3 py-3 text-cyan-300">{row.material.code} · {row.material.name}</td><td>-</td><td>{row.material.unitMaster?.symbol??row.material.unit}</td><td>{number(row.quantity)}</td><td>{row.wastePercent}%</td><td>{number(row.quantity*(1+row.wastePercent/100))}</td><td>{row.category}</td></tr>)}</tbody></table></div></ModuleDataGrid>
      </ProductionPanel>
      <ProductionPanel title="Production Routing">
        {bom.routingSteps.map(step=><div key={step.id} className="mb-2 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.035] p-3 text-xs"><span className="flex h-7 w-7 items-center justify-center rounded-xl bg-cyan-950 text-cyan-300">{step.stepNo}</span><span className="flex-1">{step.stepName}</span><span>{step.workshop??'-'}</span><span>{step.expectedHours}h</span>{step.qcRequired&&<StatusChip status="QC"/>}</div>)}
      </ProductionPanel>
    </div>
  </ModuleDetailDrawer>
}

function ActivityList({ logs }: { logs: NonNullable<ReturnType<typeof useProductionLogs>['data']> }) { return <div className="space-y-3">{logs.slice(0,7).map(row=><div key={row.id} className="border-l border-cyan-700 pl-3 text-xs"><div className="text-cyan-300">{row.productionOrder.orderNo}</div><div className="mt-1 text-slate-300">{row.message}</div></div>)}</div> }
function buildConsumptionRows(issues: ProductionMaterialIssue[], consumptions: ProductionMaterialConsumption[]) {
  const rows = new Map<string, ConsumptionSummaryRow>()

  function key(productionOrderId: string, inventoryItemId: string) {
    return `${productionOrderId}:${inventoryItemId}`
  }

  for (const issue of issues) {
    const id = key(issue.productionOrderId, issue.inventoryItemId)
    const existing = rows.get(id) ?? {
      productionOrderId: issue.productionOrderId,
      orderNo: issue.productionOrder?.orderNo ?? issue.productionOrderId,
      title: issue.productionOrder?.title ?? '-',
      inventoryItemId: issue.inventoryItemId,
      material: issue.inventoryItem ? `${issue.inventoryItem.code} · ${issue.inventoryItem.name}` : issue.inventoryItemId,
      unit: issue.inventoryItem?.unit,
      issuedQty: 0,
      returnedQty: 0,
      consumedQty: 0,
      scrapQty: 0,
      remainingQty: 0,
    }
    existing.issuedQty += Number(issue.issuedQty ?? 0)
    existing.returnedQty += Number(issue.returnedQty ?? 0)
    rows.set(id, existing)
  }

  for (const consumption of consumptions) {
    const id = key(consumption.productionOrderId, consumption.inventoryItemId)
    const existing = rows.get(id) ?? {
      productionOrderId: consumption.productionOrderId,
      orderNo: consumption.productionOrder?.orderNo ?? consumption.productionOrderId,
      title: consumption.productionOrder?.title ?? '-',
      inventoryItemId: consumption.inventoryItemId,
      material: consumption.inventoryItem ? `${consumption.inventoryItem.code} · ${consumption.inventoryItem.name}` : consumption.inventoryItemId,
      unit: consumption.inventoryItem?.unitMaster?.symbol ?? consumption.inventoryItem?.unit,
      issuedQty: Number(consumption.issuedQty ?? 0),
      returnedQty: Number(consumption.returnedQty ?? 0),
      consumedQty: 0,
      scrapQty: 0,
      remainingQty: 0,
    }
    existing.consumedQty += Number(consumption.consumedQty ?? 0)
    existing.scrapQty += Number(consumption.scrapQty ?? 0)
    rows.set(id, existing)
  }

  return Array.from(rows.values())
    .map((row) => ({
      ...row,
      remainingQty: Math.max(0, row.issuedQty - row.returnedQty - row.consumedQty - row.scrapQty),
    }))
    .sort((a, b) => `${a.orderNo}-${a.material}`.localeCompare(`${b.orderNo}-${b.material}`))
}

function getIssueReturnableQty(
  issue: ProductionMaterialIssue,
  remainingByMaterial: Map<string, number>,
) {
  if (issue.status === 'RETURNED') return 0
  const issuedQty = Number(issue.issuedQty ?? 0)
  const returnedQty = Number(issue.returnedQty ?? 0)
  const issueRemaining = Math.max(0, issuedQty - returnedQty)
  const materialRemaining =
    remainingByMaterial.get(`${issue.productionOrderId}:${issue.inventoryItemId}`) ??
    issueRemaining

  return Math.max(0, Math.min(issueRemaining, materialRemaining))
}

function ActionCards({ compact = false }: { compact?: boolean }) {
  const actions = compact
    ? [[FileStack, 'BOM'], [Factory, 'MO'], [Boxes, 'Cấp VT'], [Archive, 'Ra bãi']]
    : [[FileStack, 'Tạo BOM'], [Factory, 'Tạo MO'], [Boxes, 'Cấp vật tư'], [Archive, 'Chuyển bãi'], [Wrench, 'Cập nhật bước'], [ClipboardList, 'Nhật ký']]

  return (
    <div className="grid grid-cols-2 gap-2">
      {actions.map(([Icon, label]) => (
        <button key={String(label)} className="rounded-xl border border-white/10 bg-white/[0.045] p-3 text-left text-xs text-slate-300 transition hover:border-cyan-400/40 hover:bg-cyan-400/10 hover:text-cyan-200">
          <Icon size={16} className="mb-2 text-cyan-300" />
          {label as string}
        </button>
      ))}
    </div>
  )
}
function Info({ k, v }: { k: string; v: string }) { return <div className="flex justify-between gap-2.5 text-xs py-0.5 border-b border-white/[0.02]"><span className="text-slate-500 font-medium">{k}</span><span className="text-right text-slate-200 font-mono">{v}</span></div> }

function InfoCard({ title, value, tone = 'text-white' }: { title: string; value: string; tone?: string }) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-2.5">
      <div className="text-[11px] text-slate-500 font-medium">{title}</div>
      <div className={`mt-1 truncate text-sm font-semibold font-mono ${tone}`}>{value}</div>
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
    return <div className="rounded-xl border border-white/5 bg-white/[0.015] p-5 text-center text-xs text-slate-500">{empty}</div>
  }
  return (
    <div className="space-y-1">
      {rows.map((row) => (
        <div key={row.id} className="grid grid-cols-[1fr_auto] items-center gap-1.5 rounded-xl border border-white/5 bg-white/[0.02] p-2.5 text-xs">
          <div className="min-w-0">
            <div className="truncate font-semibold text-cyan-300 font-mono">{row.title}</div>
            {row.subtitle ? <div className="mt-0.5 truncate text-[11px] text-slate-500">{row.subtitle}</div> : null}
          </div>
          <div className="font-mono tabular-nums text-slate-200 text-right">{row.value}</div>
        </div>
      ))}
    </div>
  )
}
