import { useDeferredValue, useEffect, useMemo, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import toast from 'react-hot-toast'
import { Activity, AlertTriangle, Archive, BarChart3, Boxes, CheckCircle2, ClipboardList, Clock, Cpu, Eye, Factory, FileStack, FileText, Gauge, Layers, Package, RotateCcw, Search, SlidersHorizontal, Wrench } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'

import { EnterpriseWorkspace } from '@/shared/ui/enterprise'
import {
  EnterpriseField,
  EnterpriseFormGrid,
  EnterpriseNumberField,
  EnterpriseSelect,
  enterprisePrimaryButton,
} from '@/shared/forms'
import { ModuleDataGrid, ModuleDetailDrawer, ModuleEmptyState, ModuleFilterBar, ModuleKpiStrip } from '@/shared/ui/modules'
import { CockpitChartCard, CockpitKpiCard, CockpitTableShell, COCKPIT_HEIGHTS, DataTablePagination, EnterpriseKpiCard } from '@/shared/ui/cockpit'
import { EnterpriseModulePage } from '@/shared/runtime-tabs/EnterpriseModulePage'
import {
  EnterpriseChartCard as InventoryChartCard,
  EnterpriseKpi as InventoryKpi,
  EnterprisePanel,
  enterpriseGridGap as inventoryGridGap,
  enterpriseInput as inventoryInput,
  enterpriseMutedButton as inventoryMutedButton,
  enterprisePageStack as inventoryPageStack,
  enterpriseTableHead as inventoryTableHead,
  enterpriseTableRow as inventoryTableRow,
} from '@/shared/ui/enterprise-components'

import type { ComponentInstance, ProductionBom, ProductionCockpitReadModel, ProductionComponent, ProductionLog, ProductionMachine, ProductionMaterialConsumption, ProductionMaterialIssue, ProductionMaterialLedger, ProductionMaterialLedgerParams, ProductionOrder, ProductionReservation } from '../api/production.api'
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
import {
  ProductionConsumptionModal,
  ProductionMaterialReturnModal,
  type ProductionConsumptionTarget,
} from '../components/ProductionMaterialCommandModals'
import { useInventoryAudit } from '@/modules/inventory/hooks/useInventoryAudit'
import { useInventoryItems } from '@/modules/inventory/hooks/useInventoryItems'
import { InventoryPanel, InventoryPagination } from '@/modules/inventory/components/InventoryVisuals'
import { formatCurrencyVnd, formatDateTime, formatQuantity, formatQuantityInput, parseLocaleNumber } from '@/shared/utils/number-format'
import {
  useMaterialRequirements,
  useArchiveProductionBom,
  useCloneProductionBom,
  useCompleteProductionStage,
  useCreateProductionReservation,
  useExpireProductionReservation,
  useIssueProductionReservation,
  useProductionBoms,
  useProductionCockpitReadModel,
  useProductionComponents,
  useProductionConsumptions,
  useProductionIssues,
  useProductionLogs,
  useProductionMachines,
  useProductionMaterialLedger,
  useProductionOrder,
  useProductionOrders,
  useProductionComponentInstances,
  useProductionReservations,
  useReleaseCanonicalProductionOrder,
  useReleaseProductionReservation,
  useReservationPreview,
  useReserveProductionReservation,
  useStartProductionOrder,
  useYardSlots,
} from '../hooks/useProductionCockpit'
import { useStageComponentInstanceToYard } from '@/modules/yard/hooks/queries/useYardRuntime'

const number = (value = 0) => formatQuantity(value, 3)
const date = (value?: string) => value ? new Date(value).toLocaleDateString('vi-VN') : '-'

const componentInstanceStateLabel: Record<string, string> = {
  PLANNED: 'Chờ sản xuất',
  IN_PRODUCTION: 'Đang sản xuất',
  PRODUCED_WAITING_QC: 'Chờ QC',
  QC_PASSED: 'Đạt QC',
  QC_FAILED: 'Không đạt QC',
  REWORK: 'Làm lại',
  SCRAPPED: 'Loại bỏ',
  USE_AS_IS: 'Chấp nhận sử dụng',
  YARD: 'Trong bãi',
  DELIVERED: 'Đã giao',
  INSTALLED: 'Đã lắp dựng',
}

function instanceStateLabel(value?: string) {
  return componentInstanceStateLabel[value ?? ''] ?? value ?? '-'
}

function currentInstanceOperation(instance: ComponentInstance) {
  const active = instance.executions?.find((execution) => ['ASSIGNED', 'RUNNING'].includes(execution.status))
  const latest = active ?? instance.executions?.[instance.executions.length - 1]
  if (!latest) return { label: '-', status: 'Chưa gán' }
  return {
    label: latest.workOrder?.workOrderNo ?? latest.productionExecution?.id ?? '-',
    status: latest.status,
  }
}

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
  const [cockpitPage, setCockpitPage] = useState(1)
  const [selectedOrder, setSelectedOrder] = useState<ProductionOrder>()
  const [selectedBom, setSelectedBom] = useState<ProductionBom>()
  const [createOrderOpen, setCreateOrderOpen] = useState(false)
  const [createBomOpen, setCreateBomOpen] = useState(false)
  const [ledgerFilters, setLedgerFilters] = useState<ProductionMaterialLedgerParams>({})
  const view = location.pathname.split('/').at(-1) ?? 'production'
  const mode = view === 'production' ? 'overview' : view
  const isOrderWorkspace = ['overview', 'orders', 'planning'].includes(mode)
  const deferredSearch = useDeferredValue(search)
  const cockpitParams = useMemo(() => ({
    page: cockpitPage,
    limit: 14,
    search: isOrderWorkspace ? deferredSearch || undefined : undefined,
    status: statusFilter || undefined,
    scope: mode === 'planning' ? 'planning' as const : 'all' as const,
    sortBy: 'updatedAt' as const,
    sortOrder: 'desc' as const,
  }), [cockpitPage, deferredSearch, isOrderWorkspace, mode, statusFilter])
  const cockpitQuery = useProductionCockpitReadModel(cockpitParams)
  const cockpit = cockpitQuery.data
  const legacyOrdersQuery = useProductionOrders(!isOrderWorkspace)
  const legacyOrders = legacyOrdersQuery.data ?? []
  const orders = isOrderWorkspace ? cockpit?.data ?? [] : legacyOrders
  const bomsQuery = useProductionBoms(mode === 'boms' || createOrderOpen || createBomOpen)
  const boms = bomsQuery.data ?? []
  const issuesQuery = useProductionIssues(['execution', 'material-issues', 'consumptions'].includes(mode))
  const issues = issuesQuery.data ?? []
  const consumptionsQuery = useProductionConsumptions(undefined, ['warehouse', 'material-issues', 'consumptions'].includes(mode))
  const consumptions = consumptionsQuery.data ?? []
  const reservationsQuery = useProductionReservations(undefined, ['execution', 'reservations', 'warehouse'].includes(mode))
  const reservations = reservationsQuery.data ?? []
  const ledgerQueryParams = useMemo(() => ({
    productionOrderId: ledgerFilters.productionOrderId || undefined,
    inventoryItemId: ledgerFilters.inventoryItemId || undefined,
    eventType: ledgerFilters.eventType || undefined,
    fromDate: ledgerFilters.fromDate || undefined,
    toDate: ledgerFilters.toDate || undefined,
  }), [ledgerFilters])
  const ledgerQuery = useProductionMaterialLedger(ledgerQueryParams, mode === 'material-ledger')
  const ledger = ledgerQuery.data ?? []
  const logsQuery = useProductionLogs(mode === 'overview' || mode === 'logs')
  const logs = logsQuery.data ?? []
  const machinesQuery = useProductionMachines(mode === 'machines')
  const machines = machinesQuery.data ?? []
  const { data: components = [] } = useProductionComponents(createOrderOpen || createBomOpen)
  const { data: inventoryItems = [] } = useInventoryItems()
  const { data: inventoryAudit = [] } = useInventoryAudit()

  const filteredOrders = useMemo(() => orders.filter((row) => {
    if (isOrderWorkspace) return true
    if (statusFilter && row.status !== statusFilter) return false
    return `${row.orderNo} ${row.title} ${row.status}`.toLowerCase().includes(search.toLowerCase())
  }), [isOrderWorkspace, orders, search, statusFilter])
  const filteredBoms = useMemo(() => boms.filter((row) =>
    `${row.bomNo} ${row.productCode} ${row.productName}`.toLowerCase().includes(search.toLowerCase())), [boms, search])

  const summary = cockpit?.summary
  const completed = summary?.completed ?? 0
  const inProgress = summary?.inProgress ?? 0
  const planned = summary?.planned ?? 0
  const released = summary?.released ?? 0
  const completedToday = summary?.completedToday ?? 0
  const waitingMaterial = summary?.waitingMaterial ?? 0
  const delayed = summary?.delayed ?? 0
  const runningComponents = summary?.runningComponents ?? 0
  const productionWeight = summary?.productionWeight ?? 0
  const machineOnline = machines.filter((machine) => machine.status !== 'OFFLINE' && machine.status !== 'DOWN').length
  const machineMaintenance = machines.filter((machine) => machine.status === 'MAINTENANCE').length
  const machineAverageUtilization = machines.length
    ? machines.reduce((sum, machine) => sum + Number(machine.utilization ?? 0), 0) / machines.length
    : 0
  const isWorkOrderMode = mode === 'orders'
  const activeQueries = isOrderWorkspace
    ? [cockpitQuery]
    : mode === 'boms'
      ? [bomsQuery]
      : mode === 'execution'
        ? [legacyOrdersQuery, issuesQuery, reservationsQuery]
        : mode === 'reservations'
          ? [legacyOrdersQuery, reservationsQuery]
          : mode === 'material-ledger'
            ? [ledgerQuery]
            : mode === 'material-issues'
              ? [legacyOrdersQuery, issuesQuery, consumptionsQuery]
              : mode === 'consumptions'
                ? [issuesQuery, consumptionsQuery]
                : mode === 'machines'
                  ? [machinesQuery]
                  : mode === 'logs'
                    ? [logsQuery]
                    : []
  const workspacePending = activeQueries.some((query) => query.isPending)
  const workspaceError = activeQueries.some((query) => query.isError)

  useEffect(() => {
    setCockpitPage(1)
  }, [deferredSearch, mode, statusFilter])

  return (
    <EnterpriseModulePage>
      <div className="space-y-2 text-xs -mt-2">
        <div className="grid grid-cols-1 gap-1 md:grid-cols-2 xl:grid-cols-6">
          {mode === 'machines' ? (
            <>
              <EnterpriseKpiCard title="Tổng máy" value={number(machines.length)} tone="blue" icon={<Factory size={15} />} isLoading={workspacePending} />
              <EnterpriseKpiCard title="Online" value={number(machineOnline)} tone="emerald" icon={<CheckCircle2 size={15} />} isLoading={workspacePending} />
              <EnterpriseKpiCard title="Bảo trì" value={number(machineMaintenance)} tone="amber" icon={<AlertTriangle size={15} />} isLoading={workspacePending} />
              <EnterpriseKpiCard title="Utilization TB" value={`${formatQuantity(machineAverageUtilization, 0)}%`} tone="cyan" icon={<Wrench size={15} />} isLoading={workspacePending} />
              <EnterpriseKpiCard title="Work Centers" value={number(cockpit?.workCenters.length ?? 0)} tone="purple" icon={<Layers size={15} />} isLoading={workspacePending} />
              <EnterpriseKpiCard title="Đang sản xuất" value={number(inProgress)} tone="blue" icon={<Factory size={15} />} isLoading={workspacePending} />
            </>
          ) : isWorkOrderMode ? (
            <>
              <EnterpriseKpiCard title="Total Work Orders" value={number(summary?.total ?? 0)} tone="blue" icon={<ClipboardList size={15} />} isLoading={workspacePending} />
              <EnterpriseKpiCard title="Planned" value={number(planned)} tone="purple" icon={<Layers size={15} />} isLoading={workspacePending} />
              <EnterpriseKpiCard title="Released" value={number(released)} tone="cyan" icon={<CheckCircle2 size={15} />} isLoading={workspacePending} />
              <EnterpriseKpiCard title="In Progress" value={number(inProgress)} tone="emerald" icon={<Factory size={15} />} isLoading={workspacePending} />
              <EnterpriseKpiCard title="Completed" value={number(completed)} tone="emerald" icon={<CheckCircle2 size={15} />} isLoading={workspacePending} />
              <EnterpriseKpiCard title="Delayed" value={number(delayed)} tone="red" icon={<AlertTriangle size={15} />} isLoading={workspacePending} />
            </>
          ) : (
            <>
              <EnterpriseKpiCard title="Đang sản xuất" value={number(inProgress)} tone="cyan" icon={<Factory size={15} />} isLoading={workspacePending} onClick={() => setStatusFilter(statusFilter === 'IN_PROGRESS' ? '' : 'IN_PROGRESS')} />
              <EnterpriseKpiCard title="Hoàn thành hôm nay" value={number(completedToday)} tone="emerald" icon={<CheckCircle2 size={15} />} isLoading={workspacePending} onClick={() => setStatusFilter(statusFilter === 'COMPLETED' ? '' : 'COMPLETED')} />
              <EnterpriseKpiCard title="Chờ vật tư" value={number(waitingMaterial)} tone="amber" icon={<Boxes size={15} />} isLoading={workspacePending} />
              <EnterpriseKpiCard title="Trễ tiến độ" value={number(delayed)} tone="red" icon={<AlertTriangle size={15} />} isLoading={workspacePending} onClick={() => setStatusFilter(statusFilter === 'DELAYED' ? '' : 'DELAYED')} />
              <EnterpriseKpiCard title="Cấu kiện đang chạy" value={number(runningComponents)} tone="purple" icon={<Wrench size={15} />} isLoading={workspacePending} />
              <EnterpriseKpiCard title="Khối lượng sản xuất" value={`${number(productionWeight)} kg`} tone="blue" icon={<FileStack size={15} />} isLoading={workspacePending} />
            </>
          )}
        </div>

        <EnterprisePanel className="rounded-xl -mt-1">
          <div className="grid grid-cols-1 gap-1 xl:grid-cols-[180px_1fr_130px_120px]">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setCockpitPage(1)
              }}
              className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:bg-[#08111f]"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="IN_PROGRESS">Đang sản xuất</option>
              <option value="COMPLETED">Hoàn thành</option>
              <option value="DELAYED">Trễ tiến độ</option>
            </select>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setCockpitPage(1)
              }}
              placeholder="Tìm mã, kết cấu, BOM, trạng thái..."
              className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:bg-[#08111f]"
            />
            <button
              type="button"
              onClick={() => {
                setCockpitPage(1)
              }}
              className="h-9 self-end rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500"
            >
              Tìm kiếm
            </button>
            <button
              type="button"
              onClick={() => {
                setSearch('')
                setStatusFilter('')
                setCockpitPage(1)
              }}
              className="h-9 self-end rounded-lg border border-white/10 bg-white/[0.055] px-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
            >
              Làm mới
            </button>
          </div>
        </EnterprisePanel>

      {workspacePending ? <ProductionWorkspaceState state="loading" /> : workspaceError ? <ProductionWorkspaceState state="error" /> : <>
      {mode === 'overview' && cockpit && <Overview readModel={cockpit} logs={logs} onOpen={setSelectedOrder} onPageChange={setCockpitPage} />}
      {mode === 'boms' && <Boms rows={filteredBoms} onOpen={setSelectedBom} onCreate={() => setCreateBomOpen(true)} />}
      {mode === 'orders' && cockpit && <Orders readModel={cockpit} onOpen={setSelectedOrder} onPageChange={setCockpitPage} />}
      {mode === 'planning' && cockpit && <Orders readModel={cockpit} onOpen={setSelectedOrder} onPageChange={setCockpitPage} />}
      {mode === 'execution' && <ProductionExecutionBoard orders={orders} issues={issues} reservations={reservations} />}
      {mode === 'advanced' && <ProductionAdvancedWorkspace />}
      {mode === 'machines' && <MachinesWorkspace machines={machines} workCenters={cockpit?.workCenters ?? []} search={search} />}
      {mode === 'reservations' && <Reservations rows={reservations} orders={orders} onOpen={setSelectedOrder} />}
      {mode === 'warehouse' && <ProductionWarehouseCockpit inventoryItems={inventoryItems as InventoryItemLike[]} auditRows={inventoryAudit as InventoryAuditLike[]} orders={orders} reservations={reservations} consumptions={consumptions} />}
      {mode === 'material-ledger' && <MaterialLedger rows={ledger} orders={orders} filters={ledgerFilters} onFiltersChange={setLedgerFilters} />}
      {mode === 'material-issues' && <Issues rows={issues} consumptions={consumptions} orders={orders} />}
      {mode === 'consumptions' && <Consumptions issues={issues} consumptions={consumptions} />}
      {mode === 'incidents' && <ProductionIncidentsWorkspace orders={orders} logs={logs} />}
      {mode === 'logs' && <Logs rows={logs} />}
      {mode === 'reports' && <ProductionReportsWorkspace readModel={cockpit} orders={orders} issues={issues} consumptions={consumptions} reservations={reservations} logs={logs} />}
      </>}

      {selectedOrder && <OrderWorkspace order={selectedOrder} onClose={() => setSelectedOrder(undefined)} />}
      {selectedBom && <BomWorkspace bom={selectedBom} onClose={() => setSelectedBom(undefined)} />}
      {createOrderOpen && <ManufacturingOrderModal components={components} boms={boms} onClose={() => setCreateOrderOpen(false)} />}
      {createBomOpen && <ProductionBomModal components={components} onClose={() => setCreateBomOpen(false)} />}
      </div>
    </EnterpriseModulePage>
  )
}

function ProductionWorkspaceState({
  state,
}: {
  state: 'loading' | 'error'
}) {
  const emptyRows = Array.from({ length: 14 })
  const isLoading = state === 'loading'

  return (
    <div className="grid grid-cols-1 gap-1 xl:grid-cols-12">
      <div className="xl:col-span-9">
        <CockpitChartCard
          title="Manufacturing order registry"
          subtitle={isLoading ? 'Đang đồng bộ dữ liệu vận hành mới nhất' : 'Không thể tải dữ liệu sản xuất'}
          action={<span className="text-[11px] text-cyan-300">0-0 / 0</span>}
          heightClass={COCKPIT_HEIGHTS.TABLE_MD}
        >
          <div className="flex h-full min-h-0 flex-col">
            <CockpitTableShell className="min-h-0 flex-1">
              <table className="w-full min-w-[1180px] table-fixed text-left text-[13px]">
                <thead className={inventoryTableHead}>
                  <tr>
                    {['WO No', 'Component', 'Project', 'Qty', 'Material Ready', 'Progress', 'Due Date', 'Status'].map((heading) => (
                      <th key={heading} className="px-1.5 py-0.5 text-left font-medium">{heading}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {emptyRows.map((_, index) => (
                    <tr key={`production-state-empty-${index}`} aria-hidden="true" className="border-b border-white/[0.04]">
                      <td colSpan={8} className="h-[46px] px-2 py-2">
                        <div className="h-px w-full bg-white/[0.035]" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <ModuleEmptyState
                icon={isLoading ? <Factory size={20} /> : <Wrench size={20} />}
                title={isLoading ? 'Đang tải dữ liệu sản xuất' : 'Không thể tải dữ liệu sản xuất'}
                description={isLoading ? 'Workspace đang đồng bộ dữ liệu vận hành mới nhất.' : 'Kiểm tra kết nối rồi tải lại workspace.'}
              />
            </CockpitTableShell>
            <DataTablePagination page={1} pageSize={14} total={0} onPageChange={() => undefined} />
          </div>
        </CockpitChartCard>
      </div>

      <aside className="space-y-1 xl:col-span-3">
        <CockpitChartCard title="Tiến độ sản xuất" subtitle="Planning → Finished" heightClass={COCKPIT_HEIGHTS.CHART_SM}>
          <ModuleEmptyState
            icon={<Factory size={18} />}
            title={isLoading ? 'Đang tải tiến độ' : 'Chưa có dữ liệu tiến độ'}
            description={isLoading ? 'Đang đồng bộ phân bổ trạng thái sản xuất.' : 'Biểu đồ sẽ hiển thị khi read model trả dữ liệu thật.'}
          />
        </CockpitChartCard>
        <CockpitChartCard title="Material readiness" subtitle="Net issued / required" heightClass={COCKPIT_HEIGHTS.CHART_SM}>
          <ModuleEmptyState
            icon={<Boxes size={18} />}
            title={isLoading ? 'Đang tải readiness' : 'Chưa có dữ liệu vật tư'}
            description={isLoading ? 'Đang đồng bộ trạng thái cấp phát vật tư.' : 'Biểu đồ sẽ hiển thị khi có issue/reservation thật.'}
          />
        </CockpitChartCard>
        <CockpitChartCard title="WO sắp trễ" subtitle="Sắp xếp theo Due Date" heightClass={COCKPIT_HEIGHTS.CHART_SM}>
          <RankList rows={[]} empty={isLoading ? 'Đang tải danh sách WO' : 'Chưa có WO có hạn'} />
        </CockpitChartCard>
      </aside>
    </div>
  )
}

function MachinesWorkspace({
  machines,
  workCenters,
  search: propSearch,
}: {
  machines: ProductionMachine[]
  workCenters: Array<{ id: string; code: string; name: string; status: string; _count: { machines: number } }>
  search?: string
}) {
  const [search, setSearch] = useState(propSearch ?? '')
  const [status, setStatus] = useState<string>('')
  const [page, setPage] = useState(1)
  const [expandedModalOpen, setExpandedModalOpen] = useState(false)

  const pageSize = 14
  const normalizedSearch = search.trim().toLowerCase()
  const rows = useMemo(() => machines.filter((machine) => {
    if (status && machine.status !== status) return false
    if (!normalizedSearch) return true
    return `${machine.code} ${machine.name} ${machine.status} ${machine.workCenter?.code ?? ''} ${machine.workCenter?.name ?? ''}`
      .toLowerCase()
      .includes(normalizedSearch)
  }), [machines, normalizedSearch, status])

  const pagedRows = rows.slice((page - 1) * pageSize, page * pageSize)
  const statusOptions = Array.from(new Set(machines.map((machine) => machine.status).filter(Boolean))).sort()
  const averageUtilization = machines.length
    ? machines.reduce((sum, machine) => sum + Number(machine.utilization ?? 0), 0) / machines.length
    : 0
  const online = machines.filter((machine) => !['OFFLINE', 'DOWN'].includes(machine.status)).length
  const offline = machines.filter((machine) => machine.status === 'OFFLINE' || machine.status === 'DOWN').length
  const maintenance = machines.filter((machine) => machine.status === 'MAINTENANCE').length

  const statusSegments = statusOptions.map((label, index) => ({
    label,
    value: machines.filter((machine) => machine.status === label).length,
    color: ['#14c987', '#06b6d4', '#f59e0b', '#ef4444', '#7c3aed', '#64748b'][index % 6],
  }))

  const workCenterRows = workCenters
    .map((workCenter) => ({
      id: workCenter.id,
      title: `${workCenter.code} · ${workCenter.name}`,
      subtitle: workCenter.status,
      count: workCenter._count.machines,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map((workCenter) => ({ ...workCenter, value: formatQuantity(workCenter.count, 0) }))

  const topUtilization = [...machines]
    .sort((a, b) => Number(b.utilization ?? 0) - Number(a.utilization ?? 0))
    .slice(0, 5)

  useEffect(() => {
    setPage(1)
  }, [rows.length, status, search])

  return (
    <div className="space-y-2 text-xs -mt-2">
      <div className="grid grid-cols-1 gap-1 md:grid-cols-2 xl:grid-cols-6">
        <EnterpriseKpiCard title="Tổng số máy móc" value={formatQuantity(machines.length, 0)} tone="blue" icon={<Wrench size={15} />} />
        <EnterpriseKpiCard title="Máy Online / Sẵn sàng" value={formatQuantity(online, 0)} tone="emerald" icon={<CheckCircle2 size={15} />} />
        <EnterpriseKpiCard title="Máy Offline / Dừng" value={formatQuantity(offline, 0)} tone="red" icon={<AlertTriangle size={15} />} />
        <EnterpriseKpiCard title="Utilization trung bình" value={`${formatQuantity(averageUtilization, 0)}%`} tone="cyan" icon={<Gauge size={15} />} />
        <EnterpriseKpiCard title="Work Centers" value={formatQuantity(workCenters.length, 0)} tone="purple" icon={<Factory size={15} />} />
        <EnterpriseKpiCard title="Máy đang bảo trì" value={formatQuantity(maintenance, 0)} tone="amber" icon={<SlidersHorizontal size={15} />} />
      </div>

      <EnterprisePanel className="rounded-xl -mt-1">
        <div className="grid grid-cols-1 gap-1 xl:grid-cols-[180px_1fr_130px_120px]">
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value)
              setPage(1)
            }}
            className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:bg-[#08111f]"
          >
            <option value="">Tất cả trạng thái máy</option>
            {statusOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setPage(1)
            }}
            placeholder="Tìm máy theo mã máy, tên máy, work center..."
            className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:bg-[#08111f]"
          />
          <button
            type="button"
            onClick={() => setPage(1)}
            className="h-9 self-end rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500"
          >
            Tìm kiếm
          </button>
          <button
            type="button"
            onClick={() => {
              setSearch('')
              setStatus('')
              setPage(1)
            }}
            className="h-9 self-end rounded-lg border border-white/10 bg-white/[0.055] px-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
          >
            Làm mới
          </button>
        </div>
      </EnterprisePanel>

      <div className={`grid ${inventoryGridGap} xl:grid-cols-12`}>
        <div className="xl:col-span-9">
          <EnterprisePanel className="rounded-xl">
            <div className="mb-1 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-white">Danh sách máy móc & Work Center</h3>
                <span className="rounded-full bg-cyan-400/10 px-2 py-0.5 text-[10px] font-medium text-cyan-300 border border-cyan-400/20">
                  {rows.length} máy
                </span>
              </div>
              <button
                type="button"
                onClick={() => setExpandedModalOpen(true)}
                className="text-xs font-semibold text-cyan-300 hover:text-cyan-200 transition"
              >
                Xem tất cả
              </button>
            </div>

            <div className="h-[430px] overflow-auto scrollbar-none rounded-lg border border-white/10">
              <table className="w-full min-w-[980px] table-fixed text-sm border-collapse">
                <thead
                  className={`${inventoryTableHead} text-slate-300 border-b border-cyan-400/10 sticky top-0 z-10`}
                  style={{ backgroundColor: 'rgba(30, 41, 59, 1)' }}
                >
                  <tr>{['Mã / Tên máy', 'Work Center', 'Trạng thái', 'Utilization', 'ID'].map((head) => <th key={head} className="px-2 py-2 text-left text-xs font-semibold text-slate-300">{head}</th>)}</tr>
                </thead>
                <tbody>
                  {pagedRows.map((machine) => (
                    <tr key={machine.id} className={inventoryTableRow}>
                      <td className="px-2 py-1.5 text-cyan-300 font-semibold font-mono">{machine.name}<div className="mt-0.5 truncate text-[10px] text-slate-400 font-normal">{machine.code}</div></td>
                      <td className="px-2 py-1.5 text-slate-300 font-mono text-xs">{machine.workCenter ? `${machine.workCenter.code} · ${machine.workCenter.name}` : '-'}</td>
                      <td className="px-2 py-1.5"><StatusChip status={machine.status} /></td>
                      <td className="w-44 px-2 py-1.5">
                        <Meter value={Number(machine.utilization ?? 0)} tone={Number(machine.utilization ?? 0) >= 80 ? 'bg-emerald-500' : Number(machine.utilization ?? 0) >= 50 ? 'bg-cyan-500' : 'bg-amber-500'} />
                        <div className="mt-1 text-[10px] font-mono text-slate-400">{formatQuantity(machine.utilization ?? 0, 0)}%</div>
                      </td>
                      <td className="px-2 py-1.5 font-mono text-slate-400 text-xs">{machine.id}</td>
                    </tr>
                  ))}
                  {!pagedRows.length ? (
                    <tr>
                      <td colSpan={5} className="px-2 py-10">
                        <ModuleEmptyState icon={<Wrench size={18} />} title="Chưa có dữ liệu máy móc" description="Danh sách máy sẽ hiển thị khi backend trả machine telemetry." />
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
            <DataTablePagination page={page} pageSize={pageSize} total={rows.length} onPageChange={setPage} />
          </EnterprisePanel>
        </div>
        <aside className="space-y-1 xl:col-span-3">
          <CockpitChartCard title="Trạng thái máy" subtitle="Theo machine status" heightClass={COCKPIT_HEIGHTS.CHART_SM}>
            {machines.length ? <ProductionDonut centerValue={formatQuantity(machines.length, 0)} centerLabel="máy" segments={statusSegments} /> : (
              <ModuleEmptyState icon={<Wrench size={18} />} title="Chưa có machine status" description="Không dựng biểu đồ khi chưa có dữ liệu thật." />
            )}
          </CockpitChartCard>
          <CockpitChartCard title="Utilization" subtitle="Trung bình máy" heightClass={COCKPIT_HEIGHTS.CHART_SM}>
            <div className="space-y-2 text-xs text-slate-300">
              <Info k="Average" v={`${formatQuantity(averageUtilization, 0)}%`} />
              <Info k="Online" v={formatQuantity(online, 0)} />
              <Info k="Total" v={formatQuantity(machines.length, 0)} />
            </div>
          </CockpitChartCard>
          <CockpitChartCard title="Work centers" subtitle="Máy theo work center" heightClass={COCKPIT_HEIGHTS.CHART_SM}>
            <RankList rows={workCenterRows} empty="Chưa có work center" />
          </CockpitChartCard>
        </aside>
      </div>

      <div className="grid grid-cols-1 gap-1 xl:grid-cols-3">
        <CockpitChartCard title="Top utilization" subtitle="Máy có utilization cao nhất" heightClass={COCKPIT_HEIGHTS.CHART_LG}>
          <RankList rows={topUtilization.map((machine) => ({
            id: machine.id,
            title: machine.code,
            subtitle: machine.name,
            value: `${formatQuantity(machine.utilization ?? 0, 0)}%`,
          }))} empty="Chưa có utilization" />
        </CockpitChartCard>
        <CockpitChartCard title="Machine health" subtitle="Online / offline thật" heightClass={COCKPIT_HEIGHTS.CHART_LG}>
          {machines.length ? <ProductionMiniBars values={[online, Math.max(0, machines.length - online), maintenance]} /> : (
            <ModuleEmptyState icon={<Wrench size={18} />} title="Chưa có health telemetry" description="Không hiển thị bar chart khi chưa có máy." />
          )}
        </CockpitChartCard>
        <CockpitChartCard title="Work center capacity" subtitle="Machine count" heightClass={COCKPIT_HEIGHTS.CHART_LG}>
          <RankList rows={workCenterRows} empty="Chưa có capacity" />
        </CockpitChartCard>
      </div>

      {/* EXPANDED TABLE MODAL */}
      {expandedModalOpen
        ? createPortal(
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className="w-full max-w-7xl rounded-2xl border border-white/15 bg-[#08111f] p-5 shadow-2xl space-y-4 text-xs">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div>
                    <h2 className="text-base font-bold text-white">Toàn bộ danh sách máy móc sản xuất</h2>
                    <p className="text-xs text-slate-400">Tổng cộng {rows.length} máy trong hệ thống</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setExpandedModalOpen(false)}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition"
                  >
                    Đóng
                  </button>
                </div>

                <div className="h-[640px] overflow-y-auto rounded-xl border border-white/10">
                  <table className="w-full min-w-[980px] text-xs table-fixed border-collapse">
                    <thead
                      className={`${inventoryTableHead} text-slate-300 border-b border-cyan-400/10 sticky top-0 z-10`}
                      style={{ backgroundColor: 'rgba(30, 41, 59, 1)' }}
                    >
                      <tr>{['Mã / Tên máy', 'Work Center', 'Trạng thái', 'Utilization', 'ID'].map((head) => <th key={head} className="px-2 py-2 text-left font-semibold text-slate-300">{head}</th>)}</tr>
                    </thead>
                    <tbody>
                      {rows.map((machine) => (
                        <tr key={machine.id} className={inventoryTableRow}>
                          <td className="px-2 py-2 text-cyan-300 font-semibold font-mono">{machine.name}<div className="mt-0.5 truncate text-[10px] text-slate-400 font-normal">{machine.code}</div></td>
                          <td className="px-2 py-2 text-slate-300 font-mono text-xs">{machine.workCenter ? `${machine.workCenter.code} · ${machine.workCenter.name}` : '-'}</td>
                          <td className="px-2 py-2"><StatusChip status={machine.status} /></td>
                          <td className="w-44 px-2 py-2">
                            <Meter value={Number(machine.utilization ?? 0)} tone={Number(machine.utilization ?? 0) >= 80 ? 'bg-emerald-500' : Number(machine.utilization ?? 0) >= 50 ? 'bg-cyan-500' : 'bg-amber-500'} />
                            <div className="mt-1 text-[10px] font-mono text-slate-400">{formatQuantity(machine.utilization ?? 0, 0)}%</div>
                          </td>
                          <td className="px-2 py-2 font-mono text-slate-400 text-xs">{machine.id}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <DataTablePagination page={page} pageSize={pageSize} total={rows.length} onPageChange={setPage} />
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}

function ProductionIncidentsWorkspace({
  orders,
  logs,
}: {
  orders: ProductionOrder[]
  logs: ProductionLog[]
}) {
  const [search, setSearch] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')
  const [page, setPage] = useState(1)
  const [expandedModalOpen, setExpandedModalOpen] = useState(false)

  const delayedRows = orders.filter((order) => isDelayedOrder(order))
  const incidentLogs = logs.filter((log) => /delay|incident|error|fail|cancel|scrap/i.test(`${log.type} ${log.message}`))
  const incidentRows = [
    ...delayedRows.map((order) => ({
      id: `order-${order.id}`,
      source: 'Order',
      code: order.orderNo,
      status: order.status,
      description: order.title,
      time: date(order.plannedEndAt),
      tone: 'text-red-300',
    })),
    ...incidentLogs.map((log) => ({
      id: `log-${log.id}`,
      source: 'Log',
      code: log.productionOrder?.orderNo ?? 'PRODUCTION',
      status: log.type,
      description: log.message,
      time: formatDateTime(log.createdAt),
      tone: 'text-amber-300',
    })),
  ]

  const filteredRows = useMemo(() => {
    return incidentRows.filter((row) => {
      const matchSearch = !search || `${row.code} ${row.description} ${row.source}`.toLowerCase().includes(search.toLowerCase())
      const matchSource = !sourceFilter || row.source === sourceFilter
      return matchSearch && matchSource
    })
  }, [incidentRows, search, sourceFilter])

  const pageSize = 14
  const pagedRows = filteredRows.slice((page - 1) * pageSize, page * pageSize)

  useEffect(() => {
    setPage(1)
  }, [filteredRows.length, search, sourceFilter])

  return (
    <div className="space-y-2 text-xs -mt-2">
      {/* Phase 1: KPI SECTION */}
      <div className="grid grid-cols-1 gap-1 md:grid-cols-2 xl:grid-cols-6">
        <EnterpriseKpiCard title="Tổng số cảnh báo/sự cố" value={formatQuantity(incidentRows.length, 0)} tone="amber" icon={<AlertTriangle size={15} />} />
        <EnterpriseKpiCard title="Đơn hàng trễ (Delayed)" value={formatQuantity(delayedRows.length, 0)} tone="red" icon={<Clock size={15} />} />
        <EnterpriseKpiCard title="Cảnh báo Log hệ thống" value={formatQuantity(incidentLogs.length, 0)} tone="amber" icon={<Activity size={15} />} />
        <EnterpriseKpiCard title="Sự cố Order" value={formatQuantity(delayedRows.length, 0)} tone="purple" icon={<Factory size={15} />} />
        <EnterpriseKpiCard title="Sự cố từ máy/process" value={formatQuantity(incidentLogs.length, 0)} tone="cyan" icon={<Cpu size={15} />} />
        <EnterpriseKpiCard title="Mức độ nghiêm trọng" value="High Risk" tone="red" icon={<Wrench size={15} />} />
      </div>

      {/* Phase 3: TOOLBAR */}
      <EnterprisePanel className="rounded-xl -mt-1">
        <div className="grid grid-cols-1 gap-1 xl:grid-cols-[180px_1fr_130px_120px]">
          <select
            value={sourceFilter}
            onChange={(e) => {
              setSourceFilter(e.target.value)
              setPage(1)
            }}
            className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:bg-[#08111f]"
          >
            <option value="">Tất cả nguồn phát sinh</option>
            <option value="Order">Lệnh sản xuất (Order)</option>
            <option value="Log">Nhật ký sản xuất (Log)</option>
          </select>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setPage(1)
            }}
            placeholder="Tìm theo mã đơn hàng, nội dung sự cố, trạng thái..."
            className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:bg-[#08111f]"
          />
          <button
            type="button"
            onClick={() => setPage(1)}
            className="h-9 self-end rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500"
          >
            Tìm kiếm
          </button>
          <button
            type="button"
            onClick={() => {
              setSearch('')
              setSourceFilter('')
              setPage(1)
            }}
            className="h-9 self-end rounded-lg border border-white/10 bg-white/[0.055] px-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
          >
            Làm mới
          </button>
        </div>
      </EnterprisePanel>

      <div className={`grid ${inventoryGridGap} xl:grid-cols-12`}>
        <div className="xl:col-span-9">
          <EnterprisePanel className="rounded-xl">
            <div className="mb-1 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-white">Sự cố & cảnh báo sản xuất (Incidents & Rework)</h3>
                <span className="rounded-full bg-cyan-400/10 px-2 py-0.5 text-[10px] font-medium text-cyan-300 border border-cyan-400/20">
                  {filteredRows.length} cảnh báo
                </span>
              </div>
              <button
                type="button"
                onClick={() => setExpandedModalOpen(true)}
                className="text-xs font-semibold text-cyan-300 hover:text-cyan-200 transition"
              >
                Xem tất cả
              </button>
            </div>

            <div className="h-[430px] overflow-auto scrollbar-none rounded-lg border border-white/10">
              <table className="w-full min-w-[780px] table-fixed text-sm border-collapse">
                <thead
                  className={`${inventoryTableHead} text-slate-300 border-b border-cyan-400/10 sticky top-0 z-10`}
                  style={{ backgroundColor: 'rgba(30, 41, 59, 1)' }}
                >
                  <tr>
                    {['Nguồn', 'Mã đối tượng', 'Trạng thái', 'Mô tả chi tiết', 'Thời gian phát sinh'].map((heading) => (
                      <th key={heading} className="px-2 py-2 text-left text-xs font-semibold text-slate-300">{heading}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pagedRows.map((row) => (
                    <tr key={row.id} className={inventoryTableRow}>
                      <td className={`px-2 py-1.5 font-semibold text-xs ${row.tone}`}>{row.source}</td>
                      <td className="truncate px-2 py-1.5 font-mono text-cyan-300 font-semibold">{row.code}</td>
                      <td className="px-2 py-1.5"><StatusChip status={row.status} /></td>
                      <td className="truncate px-2 py-1.5 text-white">{row.description}</td>
                      <td className="px-2 py-1.5 font-mono text-slate-300 text-xs">{row.time}</td>
                    </tr>
                  ))}
                  {!pagedRows.length ? (
                    <tr>
                      <td colSpan={5} className="px-2 py-10">
                        <ModuleEmptyState icon={<AlertTriangle size={18} />} title="Không có sự cố đang mở" description="Workspace sẽ hiển thị delayed order hoặc log cảnh báo khi phát sinh." />
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
            <DataTablePagination page={page} pageSize={pageSize} total={filteredRows.length} onPageChange={setPage} />
          </EnterprisePanel>
        </div>

        <aside className="space-y-1 xl:col-span-3">
          <CockpitChartCard title="Đơn hàng trễ" heightClass={COCKPIT_HEIGHTS.CHART_SM}>
            <div className="text-3xl font-semibold text-red-300 font-mono">{formatQuantity(delayedRows.length, 0)}</div>
            <p className="mt-2 text-xs text-slate-400">Tính từ Production Order quá hạn hoặc trạng thái delayed.</p>
          </CockpitChartCard>
          <CockpitChartCard title="Log cảnh báo" heightClass={COCKPIT_HEIGHTS.CHART_SM}>
            <div className="text-3xl font-semibold text-amber-300 font-mono">{formatQuantity(incidentLogs.length, 0)}</div>
            <p className="mt-2 text-xs text-slate-400">Dựa trên action/description hiện có trong production log.</p>
          </CockpitChartCard>
          <CockpitChartCard title="Tổng cảnh báo" subtitle="Delayed + warning logs" heightClass={COCKPIT_HEIGHTS.CHART_SM}>
            <div className="space-y-2 text-xs text-slate-300">
              <Info k="Open items" v={formatQuantity(incidentRows.length, 0)} />
              <Info k="Delayed orders" v={formatQuantity(delayedRows.length, 0)} />
              <Info k="Warning logs" v={formatQuantity(incidentLogs.length, 0)} />
            </div>
          </CockpitChartCard>
        </aside>
      </div>

      {/* EXPANDED TABLE MODAL */}
      {expandedModalOpen
        ? createPortal(
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className="w-full max-w-7xl rounded-2xl border border-white/15 bg-[#08111f] p-5 shadow-2xl space-y-4 text-xs">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div>
                    <h2 className="text-base font-bold text-white">Toàn bộ sự cố & cảnh báo sản xuất (Incidents)</h2>
                    <p className="text-xs text-slate-400">Tổng cộng {filteredRows.length} ghi nhận sự cố / cảnh báo</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setExpandedModalOpen(false)}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition"
                  >
                    Đóng
                  </button>
                </div>

                <div className="h-[640px] overflow-y-auto rounded-xl border border-white/10">
                  <table className="w-full min-w-[780px] text-xs table-fixed border-collapse">
                    <thead
                      className={`${inventoryTableHead} text-slate-300 border-b border-cyan-400/10 sticky top-0 z-10`}
                      style={{ backgroundColor: 'rgba(30, 41, 59, 1)' }}
                    >
                      <tr>
                        {['Nguồn', 'Mã đối tượng', 'Trạng thái', 'Mô tả chi tiết', 'Thời gian phát sinh'].map((heading) => (
                          <th key={heading} className="px-2 py-2 text-left font-semibold text-slate-300">{heading}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRows.map((row) => (
                        <tr key={row.id} className={inventoryTableRow}>
                          <td className={`px-2 py-2 font-semibold ${row.tone}`}>{row.source}</td>
                          <td className="truncate px-2 py-2 font-mono text-cyan-300 font-semibold">{row.code}</td>
                          <td className="px-2 py-2"><StatusChip status={row.status} /></td>
                          <td className="truncate px-2 py-2 text-white">{row.description}</td>
                          <td className="px-2 py-2 font-mono text-slate-300">{row.time}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <DataTablePagination page={page} pageSize={pageSize} total={filteredRows.length} onPageChange={setPage} />
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}

function ProductionReportsWorkspace({
  readModel,
  orders,
  issues,
  consumptions,
  reservations,
  logs,
}: {
  readModel?: ProductionCockpitReadModel
  orders: ProductionOrder[]
  issues: ProductionMaterialIssue[]
  consumptions: ProductionMaterialConsumption[]
  reservations: ProductionReservation[]
  logs: ProductionLog[]
}) {
  const completed = orders.filter((order) => order.status === 'COMPLETED').length
  const inProgress = orders.filter((order) => order.status === 'IN_PROGRESS').length
  const issuedQty = issues.reduce((sum, issue) => sum + Number(issue.issuedQty ?? 0), 0)
  const consumedQty = consumptions.reduce((sum, item) => sum + Number(item.consumedQty ?? 0), 0)
  const reservedQty = reservations.reduce((sum, item) => sum + item.lines.reduce((lineSum, line) => lineSum + Number(line.reservedQty ?? 0), 0), 0)
  const summary = readModel?.summary
  const hasMaterialFlow = issuedQty > 0 || consumedQty > 0 || reservedQty > 0

  return (
    <div className="space-y-2 text-xs -mt-2">
      {/* Phase 1: KPI SECTION */}
      <div className="grid grid-cols-1 gap-1 md:grid-cols-2 xl:grid-cols-6">
        <EnterpriseKpiCard title="Lệnh sản xuất (MO/WO)" value={number(summary?.total ?? orders.length)} tone="blue" icon={<Factory size={15} />} />
        <EnterpriseKpiCard title="Đang chạy xưởng" value={number(inProgress)} tone="cyan" icon={<Clock size={15} />} />
        <EnterpriseKpiCard title="Đã hoàn thành" value={number(completed)} tone="emerald" icon={<CheckCircle2 size={15} />} />
        <EnterpriseKpiCard title="Khối lượng Steel Issued" value={number(issuedQty)} tone="purple" icon={<Package size={15} />} />
        <EnterpriseKpiCard title="Khối lượng Steel Consumed" value={number(consumedQty)} tone="amber" icon={<Wrench size={15} />} />
        <EnterpriseKpiCard title="Vật tư đang giữ chỗ" value={number(reservedQty)} tone="blue" icon={<FileStack size={15} />} />
      </div>

      {/* Phase 2: ANALYTICS CARDS */}
      <div className="grid gap-1 xl:grid-cols-12">
        <CockpitChartCard title="Hiệu suất sản xuất" subtitle="Status distribution" className={`${COCKPIT_HEIGHTS.CHART_LG} xl:col-span-4`}>
          <ProductionDonut centerValue={number(orders.length)} centerLabel="orders" segments={[
            { label: 'Completed', value: completed, color: '#14c987' },
            { label: 'In Progress', value: inProgress, color: '#06b6d4' },
            { label: 'Other', value: Math.max(0, orders.length - completed - inProgress), color: '#f59e0b' },
          ]} />
        </CockpitChartCard>
        <CockpitChartCard title="Luồng thép xưởng" subtitle="Issue / consume / reserve" className={`${COCKPIT_HEIGHTS.CHART_LG} xl:col-span-4`}>
          {hasMaterialFlow ? <ProductionMiniBars values={[issuedQty, consumedQty, reservedQty]} /> : (
            <ModuleEmptyState icon={<Boxes size={18} />} title="Chưa có luồng vật tư" description="Biểu đồ sẽ hiển thị khi có issue, consumption hoặc reservation thật." />
          )}
        </CockpitChartCard>
        <CockpitChartCard title="Hoạt động gần đây" subtitle="Production logs" className={`${COCKPIT_HEIGHTS.CHART_LG} xl:col-span-4`}>
          <div className="space-y-2">
            {logs.slice(0, 6).map((log) => (
              <div key={log.id} className="flex justify-between gap-2 rounded-lg border border-white/5 bg-white/[0.02] p-2 text-xs text-slate-300">
                <span className="truncate text-cyan-300 font-semibold">{log.type}</span>
                <span className="shrink-0 font-mono text-[10px] text-slate-400">{formatDateTime(log.createdAt)}</span>
              </div>
            ))}
            {!logs.length ? <ModuleEmptyState icon={<FileStack size={18} />} title="Chưa có log sản xuất" description="Báo cáo sẽ có hoạt động khi phát sinh log." /> : null}
          </div>
        </CockpitChartCard>
      </div>
    </div>
  )
}

function Overview({
  readModel,
  logs,
  onOpen,
  onPageChange,
}: {
  readModel: ProductionCockpitReadModel
  logs: ReturnType<typeof useProductionLogs>['data']
  onOpen: (row: ProductionOrder) => void
  onPageChange: (page: number) => void
}) {
  const navigate = useNavigate()
  const orders = readModel.data
  const { running, pending, completed } = readModel.overview.progress
  const { issued, waiting, shortage } = readModel.overview.material
  const stageRows = readModel.overview.stages.map(({ label, value }) => [label, value] as [string, number])
  const hasStageData = stageRows.some(([, value]) => value > 0)
  const summary = readModel.summary

  const issuedQty = issued
  const consumedQty = running
  const reservedQty = waiting

  const attentionRows = orders
    .map((order) => {
      const material = order.cockpit?.materialReadiness
      const progress = order.cockpit?.progress ?? orderProgress(order)
      const remainingQty = Number(material?.remainingQty ?? 0)
      const delayed = isDelayedOrder(order) || Boolean(order.cockpit?.delayed)
      const reason = delayed
        ? 'Trễ tiến độ'
        : remainingQty > 0
          ? `Thiếu ${formatQuantity(remainingQty, 1)} vật tư`
          : progress < 35 && ['RELEASED', 'IN_PROGRESS', 'READY'].includes(order.status)
            ? `Tiến độ ${formatQuantity(progress, 0)}%`
            : ''
      const severity = delayed ? 3 : remainingQty > 0 ? 2 : reason ? 1 : 0
      return { order, reason, severity, progress }
    })
    .filter((item) => item.severity > 0)
    .sort((a, b) => b.severity - a.severity || a.progress - b.progress)
    .slice(0, 5)

  return (
    <div className="w-full min-w-0 flex-1 space-y-3 text-xs">
      {/* 1. PRIMARY OPERATIONAL WORKSPACE: LỆNH SẢN XUẤT TABLE + PAGINATION */}
      <div className="w-full min-w-0">
        <Orders
          readModel={readModel}
          onOpen={onOpen}
          onPageChange={onPageChange}
          embedded
          maxRows={8}
          onViewAll={() => navigate('/production/orders')}
        />
      </div>

      {/* 2. ANALYTICS SECTION HEADER */}
      <div className="pt-2 border-t border-white/10 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
          Phân tích & Tải xưởng sản xuất (Production Analytics)
        </h3>
      </div>

      {/* ROW A: 8 cols Stage Workload, 4 cols Status Distribution */}
      <div className="grid grid-cols-1 gap-2 xl:grid-cols-12">
        <CockpitChartCard
          title="Tải xưởng theo Công đoạn"
          subtitle="Số lượng phân bổ theo từng bước công nghệ"
          className="h-[270px] xl:col-span-8"
        >
          {hasStageData ? (
            <div className="flex h-full flex-col justify-center space-y-3">
              <ProductionMiniBars values={stageRows.map(([, value]) => value)} />
              <div className="grid grid-cols-2 gap-2 text-xs md:grid-cols-5 pt-2 border-t border-white/10">
                {stageRows.map(([label, value]) => (
                  <Info key={label} k={label} v={formatQuantity(value, 0)} />
                ))}
              </div>
            </div>
          ) : (
            <ModuleEmptyState
              icon={<Factory size={20} />}
              title="Chưa có công đoạn sản xuất"
              description="Chưa có thông tin công đoạn được phân bổ cho các Lệnh sản xuất hiện tại."
            />
          )}
        </CockpitChartCard>

        <CockpitChartCard
          title="Trạng thái Lệnh sản xuất"
          subtitle="Phân bổ Running / Pending / Completed"
          className="h-[270px] xl:col-span-4"
        >
          <ProductionDonut
            centerValue={formatQuantity(orders.length, 0)}
            centerLabel="Lệnh MO"
            segments={[
              { label: 'Running', value: running, color: '#06b6d4' },
              { label: 'Pending', value: pending, color: '#f59e0b' },
              { label: 'Completed', value: completed, color: '#14c987' },
            ]}
          />
        </CockpitChartCard>
      </div>

      {/* ROW B: 6 cols Material Readiness, 6 cols Attention POs */}
      <div className="grid grid-cols-1 gap-2 xl:grid-cols-12">
        <CockpitChartCard
          title="Tình trạng sẵn sàng Vật tư"
          subtitle="Phân bổ Lệnh SX theo vật tư cấp phát"
          className="h-[260px] xl:col-span-6"
        >
          <ProductionDonut
            centerValue={formatQuantity(orders.length, 0)}
            centerLabel="Lệnh MO"
            segments={[
              { label: 'Đã cấp phát', value: issued, color: '#14c987' },
              { label: 'Chờ cấp phát', value: waiting, color: '#f59e0b' },
              { label: 'Thiếu vật tư', value: shortage, color: '#ef4444' },
            ]}
          />
        </CockpitChartCard>

        <CockpitChartCard
          title="Lệnh sản xuất cần chú ý"
          subtitle="Điểm nghẽn: Trễ tiến độ, thiếu vật tư, tiến độ thấp"
          className="h-[260px] xl:col-span-6"
        >
          {attentionRows.length ? (
            <div className="space-y-1.5 overflow-auto max-h-[190px] scrollbar-none">
              {attentionRows.map(({ order, reason }) => (
                <button
                  key={order.id}
                  type="button"
                  onClick={() => onOpen(order)}
                  className="grid w-full grid-cols-[1fr_auto] items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-left text-xs transition hover:border-cyan-400/35 hover:bg-white/[0.06]"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-mono font-semibold text-cyan-300">{order.orderNo}</span>
                    <span className="block truncate text-slate-400">{order.title}</span>
                  </span>
                  <span className="rounded-lg border border-amber-400/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-300">{reason}</span>
                </button>
              ))}
            </div>
          ) : (
            <ModuleEmptyState
              icon={<Wrench size={18} />}
              title="Không có điểm nghẽn nổi bật"
              description="Các lệnh trễ, thiếu vật tư hoặc tiến độ thấp sẽ xuất hiện tại đây."
            />
          )}
        </CockpitChartCard>
      </div>

      {/* ROW C: 12 cols Production Logs */}
      <div className="grid grid-cols-1 gap-2 xl:grid-cols-12">
        <CockpitChartCard
          title="Nhật ký vận hành sản xuất"
          subtitle="Nhật ký hoạt động mới nhất"
          className="h-[240px] xl:col-span-12"
        >
          {(logs ?? []).length ? (
            <ActivityList logs={(logs ?? []).slice(0, 5)} />
          ) : (
            <ModuleEmptyState
              icon={<Clock size={18} />}
              title="Chưa có nhật ký"
              description="Hoạt động sản xuất sẽ xuất hiện sau khi operator thao tác."
            />
          )}
        </CockpitChartCard>
      </div>
    </div>
  )
}

function ProductionSummaryTile({
  label,
  value,
  note,
  tone,
}: {
  label: string
  value: number
  note: string
  tone: string
}) {
  return (
    <div className="flex h-full min-h-[76px] flex-col justify-center">
      <div className={`text-2xl font-semibold leading-none ${tone}`}>{formatQuantity(value, 0)}</div>
      <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</div>
      <div className="mt-2 truncate text-xs text-slate-400">{note}</div>
    </div>
  )
}

function Orders({
  readModel,
  onOpen,
  onPageChange,
  embedded = false,
  maxRows,
  onViewAll,
}: {
  readModel: ProductionCockpitReadModel
  onOpen: (row: ProductionOrder) => void
  onPageChange: (page: number) => void
  embedded?: boolean
  maxRows?: number
  onViewAll?: () => void
}) {
  const [expandedModalOpen, setExpandedModalOpen] = useState(false)
  const rows = readModel.data
  const enriched = rows.map((row) => {
    const materialReadiness = row.cockpit?.materialReadiness ?? {
      hasBom: false,
      requiredQty: 0,
      issuedQty: 0,
      remainingQty: 0,
      readinessPercent: 0,
      label: 'Thiếu BOM',
    }
    const readiness = { readiness: materialReadiness, label: materialReadiness.label }
    const progress = row.cockpit?.progress ?? 0
    return {
      row,
      readiness,
      progress,
    }
  })

  const colors = ['#64748b', '#06b6d4', '#f59e0b', '#7c3aed', '#14c987']
  const progressSegments = readModel.orderAnalytics.progressSegments.map((segment, index) => ({ ...segment, color: colors[index] }))
  const readinessColors = ['#ef4444', '#f59e0b', '#06b6d4', '#14c987']
  const readinessSegments = readModel.orderAnalytics.readinessSegments.map((segment, index) => ({ ...segment, color: readinessColors[index] }))
  const readyToReleaseRows = enriched
    .filter(({ row, readiness }) => !['COMPLETED', 'CANCELLED'].includes(row.status) && readiness.readiness.readinessPercent >= 100)
    .slice(0, 5)

  const pagedRows = embedded && maxRows ? enriched.slice(0, maxRows) : enriched
  const { page, limit: pageSize, total, totalPages } = readModel.meta

  function projectLabel(row: ProductionOrder) {
    const proj = (row.component as Record<string, unknown> | undefined)?.project as { code?: string; name?: string } | undefined
    if (proj) {
      return [proj.code, proj.name].filter(Boolean).join(' - ')
    }
    if (row.projectId) {
      return row.projectId
    }
    return '-'
  }

  const grid = (
    <InventoryPanel className="rounded-xl p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-white">
            Lệnh sản xuất
          </h3>
          <span className="rounded-full bg-cyan-400/10 px-2 py-0.5 text-[10px] font-mono font-medium text-cyan-300 border border-cyan-400/20">
            {total} lệnh
          </span>
        </div>
        <button
          type="button"
          onClick={() => setExpandedModalOpen(true)}
          className="rounded-lg border border-cyan-400/30 bg-cyan-600/20 px-3 py-1 text-xs font-semibold text-cyan-300 hover:bg-cyan-600/30 transition"
        >
          Xem tất cả
        </button>
      </div>

      <div className="h-[360px] overflow-auto scrollbar-none rounded-lg border border-white/10">
        <table className="w-full min-w-[1100px] table-fixed text-xs border-collapse">
          <thead
            className={`${inventoryTableHead} text-slate-300 border-b border-cyan-400/10 sticky top-0 z-10`}
            style={{ backgroundColor: 'rgba(30, 41, 59, 1)' }}
          >
            <tr>
              <th className="w-[180px] px-3 py-2 text-left font-semibold text-slate-300">Lệnh SX (WO No)</th>
              <th className="w-[200px] px-3 py-2 text-left font-semibold text-slate-300">Cấu kiện</th>
              <th className="w-[170px] px-3 py-2 text-left font-semibold text-slate-300">Công trình</th>
              <th className="w-[90px] px-3 py-2 text-right font-semibold text-slate-300">Số lượng</th>
              <th className="w-[170px] px-3 py-2 text-left font-semibold text-slate-300">Vật tư sẵn sàng</th>
              <th className="w-[150px] px-3 py-2 text-left font-semibold text-slate-300">Tiến độ SX</th>
              <th className="w-[120px] px-3 py-2 text-left font-semibold text-slate-300">Kế hoạch</th>
              <th className="w-[110px] px-3 py-2 text-center font-semibold text-slate-300">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {pagedRows.length ? (
              pagedRows.map(({ row, readiness, progress }) => (
                <tr key={row.id} onClick={() => onOpen(row)} className={`cursor-pointer ${inventoryTableRow}`}>
                  <td className="px-3 py-1.5 min-w-0">
                    <div className="font-mono font-semibold text-cyan-300 truncate" title={row.orderNo}>{row.orderNo}</div>
                    <div className="text-[11px] font-medium text-slate-400 truncate" title={row.title}>{row.title}</div>
                  </td>
                  <td className="px-3 py-1.5 text-slate-200 font-medium truncate" title={row.component ? `${row.component.code} · ${row.component.name}` : row.bom?.productCode ?? '-'}>
                    {row.component ? `${row.component.code} · ${row.component.name}` : row.bom?.productCode ?? '-'}
                  </td>
                  <td className="px-3 py-1.5 text-slate-300 font-medium truncate" title={projectLabel(row)}>
                    {projectLabel(row)}
                  </td>
                  <td className="px-3 py-1.5 text-right font-mono tabular-nums text-white font-bold">{number(row.quantity)}</td>
                  <td className="px-3 py-1.5">
                    <Meter value={readiness.readiness.readinessPercent} tone={readinessBarClass(readiness.readiness.readinessPercent)} />
                    <div className={`mt-0.5 text-[10px] font-mono ${readiness.readiness.readinessPercent >= 100 ? 'text-emerald-300' : readiness.readiness.readinessPercent >= 80 ? 'text-cyan-300' : readiness.readiness.readinessPercent >= 50 ? 'text-amber-300' : 'text-red-300'}`}>
                      {formatQuantity(readiness.readiness.readinessPercent, 0)}% · {readiness.label}
                    </div>
                  </td>
                  <td className="px-3 py-1.5">
                    <Meter value={progress} tone={orderStatusTone(row)} />
                    <div className="mt-0.5 text-[10px] font-mono text-slate-400">{progress}%</div>
                  </td>
                  <td className="px-3 py-1.5 text-slate-300 font-mono text-xs">
                    {date(row.plannedEndAt)}
                    {row.cockpit?.delayed ? <div className="mt-0.5 text-[10px] text-red-300 font-medium">Trễ tiến độ</div> : null}
                  </td>
                  <td className="px-3 py-1.5 text-center"><StatusChip status={row.status} /></td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="px-3 py-10">
                  <ModuleEmptyState icon={<Factory size={18} />} title="Chưa có lệnh sản xuất" description="Tạo lệnh sản xuất để theo dõi tiến độ, vật tư và hoàn thành." />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <InventoryPagination
        page={page}
        pageSize={pageSize}
        pageCount={Math.max(1, totalPages ?? Math.ceil(total / pageSize))}
        total={total}
        onPageChange={onPageChange}
        containerClassName="border-t-0 pt-2"
      />

      {/* EXPANDED TABLE MODAL (LEVEL 2 WORKSPACE) */}
      {expandedModalOpen
        ? createPortal(
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className="flex w-[96vw] max-w-[1720px] h-[88vh] flex-col rounded-2xl border border-white/15 bg-[#08111f] p-5 shadow-2xl space-y-3 text-xs overflow-hidden">
                <div className="flex items-center justify-between border-b border-white/10 pb-3 shrink-0">
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      Toàn bộ danh sách lệnh sản xuất (Production Orders Workspace)
                    </h2>
                    <p className="text-xs text-slate-400">Tổng cộng {total} lệnh sản xuất trong hệ thống</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setExpandedModalOpen(false)}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition"
                  >
                    Đóng Workspace
                  </button>
                </div>

                <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-white/10">
                  <table className="w-full min-w-[1280px] text-xs table-fixed border-collapse">
                    <thead
                      className={`${inventoryTableHead} text-slate-300 border-b border-cyan-400/10 sticky top-0 z-10`}
                      style={{ backgroundColor: 'rgba(30, 41, 59, 1)' }}
                    >
                      <tr>
                        {['Lệnh SX (WO No)', 'Tiêu đề Lệnh', 'Cấu kiện', 'Công trình', 'Số lượng', 'Vật tư sẵn sàng', 'Tiến độ SX', 'Kế hoạch', 'Trạng thái'].map((x) => (
                          <th key={x} className="px-3 py-2.5 text-left font-semibold text-slate-300">{x}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {enriched.map(({ row, readiness, progress }) => (
                        <tr
                          key={row.id}
                          onClick={() => {
                            onOpen(row)
                            setExpandedModalOpen(false)
                          }}
                          className={`${inventoryTableRow} cursor-pointer`}
                        >
                          <td className="px-3 py-2 font-semibold text-cyan-300 font-mono truncate" title={row.orderNo}>{row.orderNo}</td>
                          <td className="px-3 py-2 font-medium text-slate-200 truncate" title={row.title}>{row.title || 'Lệnh sản xuất'}</td>
                          <td className="px-3 py-2 text-slate-200 truncate" title={row.component ? `${row.component.code} · ${row.component.name}` : row.bom?.productCode ?? '-'}>{row.component ? `${row.component.code} · ${row.component.name}` : row.bom?.productCode ?? '-'}</td>
                          <td className="px-3 py-2 text-slate-300 font-medium truncate" title={projectLabel(row)}>{projectLabel(row)}</td>
                          <td className="px-3 py-2 font-mono tabular-nums text-white text-right font-bold">{number(row.quantity)}</td>
                          <td className="w-44 px-3 py-2">
                            <Meter value={readiness.readiness.readinessPercent} tone={readinessBarClass(readiness.readiness.readinessPercent)} />
                            <div className={`mt-0.5 text-[10px] font-mono ${readiness.readiness.readinessPercent >= 100 ? 'text-emerald-300' : readiness.readiness.readinessPercent >= 80 ? 'text-cyan-300' : readiness.readiness.readinessPercent >= 50 ? 'text-amber-300' : 'text-red-300'}`}>
                              {formatQuantity(readiness.readiness.readinessPercent, 0)}% · {readiness.label}
                            </div>
                          </td>
                          <td className="w-40 px-3 py-2">
                            <Meter value={progress} tone={orderStatusTone(row)} />
                            <div className="mt-0.5 text-[10px] font-mono text-slate-400">{progress}%</div>
                          </td>
                          <td className="px-3 py-2 text-slate-300 font-mono text-xs">{date(row.plannedEndAt)}{row.cockpit?.delayed ? <div className="mt-0.5 text-[10px] text-red-300">Trễ tiến độ</div> : null}</td>
                          <td className="px-3 py-2 text-center"><StatusChip status={row.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="shrink-0 pt-2 border-t border-white/10">
                  <InventoryPagination
                    page={page}
                    pageSize={pageSize}
                    pageCount={Math.max(1, totalPages ?? Math.ceil(total / pageSize))}
                    total={total}
                    onPageChange={onPageChange}
                    containerClassName="border-t-0"
                  />
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </InventoryPanel>
  )

  if (embedded) return grid

  return (
    <div className="w-full min-w-0 flex-1 space-y-1">
      <div className="grid grid-cols-1 gap-1 xl:grid-cols-12">
        <div className="xl:col-span-9">{grid}</div>
        <aside className="space-y-1 xl:col-span-3">
          <CockpitChartCard title="Tiến độ sản xuất" subtitle="Planning → Finished" heightClass={COCKPIT_HEIGHTS.CHART_SM}>
            <ProductionDonut centerValue={formatQuantity(total, 0)} centerLabel="WO" segments={progressSegments} />
          </CockpitChartCard>
          <CockpitChartCard title="Material readiness" subtitle="Net issued / required" heightClass={COCKPIT_HEIGHTS.CHART_SM}>
            <ProductionDonut centerValue={formatQuantity(total, 0)} centerLabel="WO" segments={readinessSegments} />
          </CockpitChartCard>
          <CockpitChartCard title="WO sắp trễ" subtitle="Sắp xếp theo Due Date" heightClass={COCKPIT_HEIGHTS.CHART_SM}>
            <RankList rows={readModel.orderAnalytics.upcomingDelayed.map((item) => ({ id: item.id, title: item.orderNo, subtitle: item.title, value: date(item.plannedEndAt) }))} empty="Chưa có WO có hạn" />
          </CockpitChartCard>
        </aside>
      </div>
      <div className="grid grid-cols-1 gap-1 xl:grid-cols-3">
        <CockpitChartCard title="Top WO theo giá trị vật tư" subtitle="API chưa có unit cost, đang dùng required qty proxy" heightClass={COCKPIT_HEIGHTS.CHART_LG}>
          <RankList rows={readModel.orderAnalytics.topMaterial.map((item) => ({ id: item.id, title: item.orderNo, subtitle: item.title, value: number(item.value) }))} />
        </CockpitChartCard>
        <CockpitChartCard title="Top WO thiếu vật tư" subtitle="Remaining required qty" heightClass={COCKPIT_HEIGHTS.CHART_LG}>
          <RankList rows={readModel.orderAnalytics.topShortage.map((item) => ({ id: item.id, title: item.orderNo, subtitle: item.title, value: number(item.value) }))} empty="Không có WO thiếu vật tư" />
        </CockpitChartCard>
        <CockpitChartCard title="Sẵn sàng phát hành" subtitle="Material Readiness >= 100%" heightClass={COCKPIT_HEIGHTS.CHART_LG}>
          <RankList
            rows={readyToReleaseRows.map(({ row }) => ({ id: row.id, title: row.orderNo, subtitle: row.title, value: row.status }))}
            empty="Chưa có WO đủ vật tư"
          />
        </CockpitChartCard>
      </div>
    </div>
  )
}

function Boms({ rows, onOpen, onCreate }: { rows: ProductionBom[]; onOpen: (row: ProductionBom) => void; onCreate: () => void }) {
  const clone = useCloneProductionBom()
  const archive = useArchiveProductionBom()

  const cloneBom = async (id: string) => {
    try {
      const created = (await clone.mutateAsync(id)) as ProductionBom
      toast.success(`Đã sao chép thành BOM ${created.bomNo}`)
      onOpen(created)
    } catch {
      toast.error('Không thể sao chép BOM.')
    }
  }

  const archiveBom = async (id: string) => {
    try {
      await archive.mutateAsync(id)
      toast.success('Đã lưu trữ BOM.')
    } catch {
      toast.error('Không thể lưu trữ BOM.')
    }
  }

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [page, setPage] = useState(1)
  const [expandedModalOpen, setExpandedModalOpen] = useState(false)

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const matchSearch = !search || `${row.bomNo} ${row.productCode} ${row.productName} ${row.projectId}`.toLowerCase().includes(search.toLowerCase())
      const matchType = !typeFilter || row.structureType === typeFilter
      return matchSearch && matchType
    })
  }, [rows, search, typeFilter])

  const active = rows.filter((row) => row.status !== 'ARCHIVED').length
  const archived = rows.length - active
  const totalMaterials = rows.reduce((sum, row) => sum + row.items.length, 0)
  const totalWeight = rows.reduce((sum, row) => sum + Number(row.estimatedWeight ?? 0), 0)
  const projectCount = new Set(rows.map((r) => r.projectId).filter(Boolean)).size

  const pageSize = 14
  const pagedRows = filteredRows.slice((page - 1) * pageSize, page * pageSize)
  const statusSegments = [
    { label: 'Active', value: active, color: '#14c987' },
    { label: 'Archived', value: archived, color: '#64748b' },
  ]
  const typeSegments = Array.from(rows.reduce((map, row) => {
    const key = row.structureType ?? 'Chưa phân loại'
    map.set(key, (map.get(key) ?? 0) + 1)
    return map
  }, new Map<string, number>()).entries())
    .map(([label, value], index) => ({ label, value, color: ['#1d7cff', '#14c987', '#f59e0b', '#7c3aed', '#06b6d4'][index % 5] }))

  const availableTypes = Array.from(new Set(rows.map((r) => r.structureType).filter(Boolean))) as string[]

  useEffect(() => {
    setPage(1)
  }, [filteredRows.length, search, typeFilter])

  return (
    <div className="space-y-2 text-xs -mt-2">
      {/* Phase 1: KPI SECTION */}
      <div className="grid grid-cols-1 gap-1 md:grid-cols-2 xl:grid-cols-6">
        <EnterpriseKpiCard title="Tổng Production BOM" value={formatQuantity(rows.length, 0)} tone="blue" icon={<FileStack size={15} />} />
        <EnterpriseKpiCard title="BOM đang sử dụng" value={formatQuantity(active, 0)} tone="emerald" icon={<CheckCircle2 size={15} />} />
        <EnterpriseKpiCard title="Dòng định mức VT" value={formatQuantity(totalMaterials, 0)} tone="cyan" icon={<Boxes size={15} />} />
        <EnterpriseKpiCard title="Khối lượng ước tính" value={`${number(totalWeight)} kg`} tone="purple" icon={<Wrench size={15} />} />
        <EnterpriseKpiCard title="Dự án áp dụng" value={formatQuantity(projectCount, 0)} tone="blue" icon={<Factory size={15} />} />
        <EnterpriseKpiCard title="BOM đã lưu trữ" value={formatQuantity(archived, 0)} tone="amber" icon={<Archive size={15} />} />
      </div>

      {/* Phase 3: TOOLBAR */}
      <EnterprisePanel className="rounded-xl -mt-1">
        <div className="grid grid-cols-1 gap-1 xl:grid-cols-[180px_1fr_130px_120px]">
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value)
              setPage(1)
            }}
            className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:bg-[#08111f]"
          >
            <option value="">Tất cả phân loại BOM</option>
            {availableTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setPage(1)
            }}
            placeholder="Tìm theo mã BOM, mã cấu kiện, tên sản phẩm, dự án..."
            className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:bg-[#08111f]"
          />
          <button
            type="button"
            onClick={() => setPage(1)}
            className="h-9 self-end rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500"
          >
            Tìm kiếm
          </button>
          <button
            type="button"
            onClick={() => {
              setSearch('')
              setTypeFilter('')
              setPage(1)
            }}
            className="h-9 self-end rounded-lg border border-white/10 bg-white/[0.055] px-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
          >
            Làm mới
          </button>
        </div>
      </EnterprisePanel>

      <div className={`grid ${inventoryGridGap} xl:grid-cols-12`}>
        <div className="xl:col-span-9">
          <EnterprisePanel className="rounded-xl">
            <div className="mb-1 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-white">Danh sách định mức sản xuất (BOM)</h3>
                <span className="rounded-full bg-cyan-400/10 px-2 py-0.5 text-[10px] font-medium text-cyan-300 border border-cyan-400/20">
                  {filteredRows.length} BOM
                </span>
              </div>
              <button
                type="button"
                onClick={() => setExpandedModalOpen(true)}
                className="text-xs font-semibold text-cyan-300 hover:text-cyan-200 transition"
              >
                Xem tất cả
              </button>
            </div>

            <div className="h-[430px] overflow-auto scrollbar-none rounded-lg border border-white/10">
              <table className="w-full min-w-[1050px] table-fixed text-sm border-collapse">
                <thead
                  className={`${inventoryTableHead} text-slate-300 border-b border-cyan-400/10 sticky top-0 z-10`}
                  style={{ backgroundColor: 'rgba(30, 41, 59, 1)' }}
                >
                  <tr>{['STT','BOM Code','Structure Code','Structure Name','Type','Project','Unit','Materials','Weight','Status','Actions'].map((x)=><th className="px-2 py-2 text-left text-xs font-semibold text-slate-300" key={x}>{x}</th>)}</tr>
                </thead>
                <tbody>
                  {pagedRows.map((row, index) => (
                    <tr key={row.id} onClick={() => onOpen(row)} className={`cursor-pointer ${inventoryTableRow}`}>
                      <td className="px-2 py-1.5 font-mono text-slate-400 text-xs">{(page - 1) * pageSize + index + 1}</td>
                      <td className="px-2 py-1.5 font-semibold text-cyan-300 font-mono">{row.bomNo}</td>
                      <td className="px-2 py-1.5 text-slate-300 font-mono">{row.productCode}</td>
                      <td className="px-2 py-1.5 text-white font-medium truncate">{row.productName}</td>
                      <td className="px-2 py-1.5 text-slate-300 text-xs">{row.structureType ?? '-'}</td>
                      <td className="px-2 py-1.5 text-slate-300 font-mono">{row.projectId ?? '-'}</td>
                      <td className="px-2 py-1.5 text-slate-300 text-xs">{row.unit ?? '-'}</td>
                      <td className="px-2 py-1.5 font-mono tabular-nums text-slate-200">{row.items.length}</td>
                      <td className="px-2 py-1.5 font-mono tabular-nums text-cyan-300">{number(row.estimatedWeight)} kg</td>
                      <td className="px-2 py-1.5"><StatusChip status={row.status} /></td>
                      <td className="px-2 py-1.5">
                        <div className="flex gap-2 text-xs">
                          <button onClick={(event) => { event.stopPropagation(); onOpen(row) }} className="text-cyan-300 hover:underline">Xem</button>
                          <button onClick={(event) => { event.stopPropagation(); void cloneBom(row.id) }} className="text-blue-300 hover:underline">Clone</button>
                          {row.status !== 'ARCHIVED' && (
                            <button onClick={(event) => { event.stopPropagation(); void archiveBom(row.id) }} className="text-amber-300 hover:underline">Archive</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!pagedRows.length ? (
                    <tr>
                      <td colSpan={11} className="px-2 py-10">
                        <ModuleEmptyState icon={<FileStack size={18} />} title="Chưa có dữ liệu BOM" description="Tạo Production BOM để chuẩn hóa định mức vật tư cho sản xuất." />
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
            <DataTablePagination page={page} pageSize={pageSize} total={filteredRows.length} onPageChange={setPage} />
          </EnterprisePanel>
        </div>
        <aside className="space-y-1 xl:col-span-3">
          <CockpitChartCard title="Theo trạng thái" subtitle="Active / archived" heightClass={COCKPIT_HEIGHTS.CHART_SM}>
            <ProductionDonut centerValue={formatQuantity(rows.length, 0)} centerLabel="BOM" segments={statusSegments} />
          </CockpitChartCard>
          <CockpitChartCard title="Phân loại BOM" subtitle="Theo structureType" heightClass={COCKPIT_HEIGHTS.CHART_SM}>
            {typeSegments.length ? <ProductionDonut centerValue={formatQuantity(rows.length, 0)} centerLabel="BOM" segments={typeSegments} /> : (
              <ModuleEmptyState icon={<Factory size={18} />} title="Chưa có phân loại" description="Structure type sẽ hiển thị khi BOM có dữ liệu phân loại." />
            )}
          </CockpitChartCard>
        </aside>
      </div>

      {/* EXPANDED TABLE MODAL */}
      {expandedModalOpen
        ? createPortal(
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className="w-full max-w-7xl rounded-2xl border border-white/15 bg-[#08111f] p-5 shadow-2xl space-y-4 text-xs">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div>
                    <h2 className="text-base font-bold text-white">Toàn bộ danh sách định mức sản xuất (BOM)</h2>
                    <p className="text-xs text-slate-400">Tổng cộng {filteredRows.length} định mức sản xuất trong hệ thống</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setExpandedModalOpen(false)}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition"
                  >
                    Đóng
                  </button>
                </div>

                <div className="h-[640px] overflow-y-auto rounded-xl border border-white/10">
                  <table className="w-full min-w-[1050px] text-xs table-fixed border-collapse">
                    <thead
                      className={`${inventoryTableHead} text-slate-300 border-b border-cyan-400/10 sticky top-0 z-10`}
                      style={{ backgroundColor: 'rgba(30, 41, 59, 1)' }}
                    >
                      <tr>{['STT','BOM Code','Structure Code','Structure Name','Type','Project','Unit','Materials','Weight','Status','Actions'].map((x)=><th className="px-2 py-2 text-left font-semibold text-slate-300" key={x}>{x}</th>)}</tr>
                    </thead>
                    <tbody>
                      {filteredRows.map((row, index) => (
                        <tr
                          key={row.id}
                          onClick={() => {
                            onOpen(row)
                            setExpandedModalOpen(false)
                          }}
                          className={`${inventoryTableRow} cursor-pointer`}
                        >
                          <td className="px-2 py-2 font-mono text-slate-400">{index + 1}</td>
                          <td className="px-2 py-2 font-semibold text-cyan-300 font-mono">{row.bomNo}</td>
                          <td className="px-2 py-2 text-slate-300 font-mono">{row.productCode}</td>
                          <td className="px-2 py-2 text-white font-medium truncate">{row.productName}</td>
                          <td className="px-2 py-2 text-slate-300">{row.structureType ?? '-'}</td>
                          <td className="px-2 py-2 text-slate-300 font-mono">{row.projectId ?? '-'}</td>
                          <td className="px-2 py-2 text-slate-300">{row.unit ?? '-'}</td>
                          <td className="px-2 py-2 font-mono tabular-nums text-slate-200">{row.items.length}</td>
                          <td className="px-2 py-2 font-mono tabular-nums text-cyan-300">{number(row.estimatedWeight)} kg</td>
                          <td className="px-2 py-2"><StatusChip status={row.status} /></td>
                          <td className="px-2 py-2">
                            <div className="flex gap-2">
                              <button onClick={(event) => { event.stopPropagation(); onOpen(row); setExpandedModalOpen(false) }} className="text-cyan-300 hover:underline">Xem</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <DataTablePagination page={page} pageSize={pageSize} total={filteredRows.length} onPageChange={setPage} />
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  )
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
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [expandedModalOpen, setExpandedModalOpen] = useState(false)

  const rows = useMemo(
    () => buildProductionWarehouseRows({ inventoryItems, auditRows, orders, reservations }),
    [inventoryItems, auditRows, orders, reservations],
  )

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const matchSearch = !search || `${row.code} ${row.name} ${row.unit}`.toLowerCase().includes(search.toLowerCase())
      const matchStatus = !statusFilter || row.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [rows, search, statusFilter])

  const productionStock = rows.reduce((sum, row) => sum + row.productionStock, 0)
  const reserved = rows.reduce((sum, row) => sum + row.reserved, 0)
  const available = rows.reduce((sum, row) => sum + row.available, 0)
  const required = rows.reduce((sum, row) => sum + row.required, 0)
  const shortageRisk = rows.filter((row) => row.shortage > 0 || row.status === 'OUT').length
  const inventoryValue = rows.reduce((sum, row) => sum + row.inventoryValue, 0)
  const materialCount = rows.filter((row) => row.productionStock > 0).length

  const productionLocations = useMemo(() => {
    return rows.flatMap((row) =>
      row.locations.map((loc) => ({
        id: `${row.id}-${loc.zoneId}-${loc.slotId}-${loc.level}`,
        material: `${row.code} · ${row.name}`,
        location: productionLocationLabel(loc),
        quantity: numeric(loc.quantity),
        unit: row.unit,
        value: numeric(loc.quantity) * (row.averageCost ?? 0),
      }))
    )
  }, [rows])

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

  const shortageRows = rows.filter((row) => row.shortage > 0).sort((a, b) => b.shortage - a.shortage).slice(0, 8)
  const pageSize = 14
  const pagedRows = filteredRows.slice((page - 1) * pageSize, page * pageSize)

  const statusSegments = [
    { label: 'OUT', value: rows.filter((row) => row.status === 'OUT').length, color: '#ef4444' },
    { label: 'LOW', value: rows.filter((row) => row.status === 'LOW').length, color: '#f59e0b' },
    { label: 'NORMAL', value: rows.filter((row) => row.status === 'NORMAL').length, color: '#14c987' },
  ]

  useEffect(() => {
    setPage(1)
  }, [filteredRows.length, search, statusFilter])

  return (
    <div className="space-y-2 text-xs -mt-2">
      {/* Phase 1: KPI SECTION */}
      <div className="grid grid-cols-1 gap-1 md:grid-cols-2 xl:grid-cols-6">
        <EnterpriseKpiCard title="Tồn kho sản xuất" value={number(productionStock)} tone="blue" icon={<Boxes size={15} />} />
        <EnterpriseKpiCard title="Giá trị tồn kho SX" value={formatCurrencyVnd(inventoryValue)} tone="emerald" icon={<CheckCircle2 size={15} />} />
        <EnterpriseKpiCard title="Mã vật tư có tồn" value={formatQuantity(materialCount, 0)} tone="cyan" icon={<Package size={15} />} />
        <EnterpriseKpiCard title="Nhu cầu sản xuất" value={number(required)} tone="purple" icon={<Wrench size={15} />} />
        <EnterpriseKpiCard title="Vật tư giữ chỗ (Reserved)" value={number(reserved)} tone="blue" icon={<SlidersHorizontal size={15} />} />
        <EnterpriseKpiCard title="Cảnh báo thiếu hụt" value={formatQuantity(shortageRisk, 0)} tone="amber" icon={<AlertTriangle size={15} />} />
      </div>

      {/* Phase 3: TOOLBAR */}
      <EnterprisePanel className="rounded-xl -mt-1">
        <div className="grid grid-cols-1 gap-1 xl:grid-cols-[180px_1fr_130px_120px]">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(1)
            }}
            className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:bg-[#08111f]"
          >
            <option value="">Tất cả trạng thái kho</option>
            <option value="NORMAL">Khả dụng (NORMAL)</option>
            <option value="LOW">Sắp hết (LOW)</option>
            <option value="OUT">Hết hàng (OUT)</option>
          </select>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setPage(1)
            }}
            placeholder="Tìm theo mã vật tư, tên vật tư, đơn vị..."
            className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:bg-[#08111f]"
          />
          <button
            type="button"
            onClick={() => setPage(1)}
            className="h-9 self-end rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500"
          >
            Tìm kiếm
          </button>
          <button
            type="button"
            onClick={() => {
              setSearch('')
              setStatusFilter('')
              setPage(1)
            }}
            className="h-9 self-end rounded-lg border border-white/10 bg-white/[0.055] px-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
          >
            Làm mới
          </button>
        </div>
      </EnterprisePanel>

      <div className={`grid ${inventoryGridGap} xl:grid-cols-12`}>
        <div className="xl:col-span-9">
          <EnterprisePanel className="rounded-xl">
            <div className="mb-1 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-white">Bảng tồn kho sản xuất (Production Warehouse Grid)</h3>
                <span className="rounded-full bg-cyan-400/10 px-2 py-0.5 text-[10px] font-medium text-cyan-300 border border-cyan-400/20">
                  {filteredRows.length} vật tư
                </span>
              </div>
              <button
                type="button"
                onClick={() => setExpandedModalOpen(true)}
                className="text-xs font-semibold text-cyan-300 hover:text-cyan-200 transition"
              >
                Xem tất cả
              </button>
            </div>

            <div className="h-[430px] overflow-auto scrollbar-none rounded-lg border border-white/10">
              <table className="w-full min-w-[1150px] table-fixed text-sm border-collapse">
                <thead
                  className={`${inventoryTableHead} text-slate-300 border-b border-cyan-400/10 sticky top-0 z-10`}
                  style={{ backgroundColor: 'rgba(30, 41, 59, 1)' }}
                >
                  <tr>
                    {['Material Code', 'Material Name', 'Unit', 'Production Stock', 'Reserved', 'Available', 'Required', 'Shortage', 'Readiness', 'Status'].map((head) => (
                      <th key={head} className="px-2 py-2 text-left text-xs font-semibold text-slate-300">{head}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pagedRows.map((row) => (
                    <tr key={row.id} onClick={() => setSelectedRow(row)} className={`cursor-pointer ${inventoryTableRow}`}>
                      <td className="px-2 py-1.5 font-semibold text-cyan-300 font-mono">{row.code}</td>
                      <td className="truncate px-2 py-1.5 text-white font-medium">{row.name}</td>
                      <td className="px-2 py-1.5 text-slate-300 text-xs">{row.unit}</td>
                      <td className="px-2 py-1.5 font-mono tabular-nums text-slate-200">{number(row.productionStock)}</td>
                      <td className="px-2 py-1.5 font-mono tabular-nums text-amber-300">{number(row.reserved)}</td>
                      <td className="px-2 py-1.5 font-mono tabular-nums text-emerald-300">{number(row.available)}</td>
                      <td className="px-2 py-1.5 font-mono tabular-nums text-cyan-300">{number(row.required)}</td>
                      <td className={row.shortage > 0 ? 'px-2 py-1.5 font-mono tabular-nums text-red-300 font-bold' : 'px-2 py-1.5 font-mono tabular-nums text-slate-400'}>{number(row.shortage)}</td>
                      <td className="w-32 px-2 py-1.5">
                        <Meter value={row.readiness} tone={row.readiness >= 100 ? 'bg-emerald-500' : row.readiness >= 50 ? 'bg-cyan-500' : 'bg-amber-500'} />
                        <div className="mt-0.5 text-[10px] font-mono text-slate-400">{formatQuantity(row.readiness, 0)}%</div>
                      </td>
                      <td className="px-2 py-1.5"><StatusChip status={row.status} /></td>
                    </tr>
                  ))}
                  {!pagedRows.length ? (
                    <tr>
                      <td colSpan={10} className="px-2 py-10">
                        <ModuleEmptyState icon={<Boxes size={18} />} title="Chưa có dữ liệu vật tư" description="Kho sản xuất chưa có tồn, nhu cầu BOM hoặc reservation đang mở." />
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
            <DataTablePagination page={page} pageSize={pageSize} total={filteredRows.length} onPageChange={setPage} />
          </EnterprisePanel>
        </div>

        <aside className="space-y-1 xl:col-span-3">
          <CockpitChartCard title="Tồn sản xuất" subtitle="Production stock" heightClass={COCKPIT_HEIGHTS.CHART_SM}>
            <div className="space-y-2 text-xs text-slate-300">
              <Info k="Production Stock" v={number(productionStock)} />
              <Info k="Materials" v={formatQuantity(materialCount, 0)} />
              <Info k="Inventory Value" v={formatCurrencyVnd(inventoryValue)} />
            </div>
          </CockpitChartCard>
          <CockpitChartCard title="Theo trạng thái" subtitle="Available status" heightClass={COCKPIT_HEIGHTS.CHART_SM}>
            <ProductionDonut centerValue={formatQuantity(rows.length, 0)} centerLabel="VT" segments={statusSegments} />
          </CockpitChartCard>
          <CockpitChartCard title="Gần đây" subtitle="Shortage board" heightClass={COCKPIT_HEIGHTS.CHART_SM}>
            <RankList rows={shortageRows.map((row) => ({ id: row.id, title: row.code, subtitle: `${row.name} · Available ${number(row.available)}`, value: number(row.shortage) }))} empty="Không có thiếu hụt" />
          </CockpitChartCard>
        </aside>
      </div>

      <div className="grid grid-cols-1 gap-1 xl:grid-cols-3">
        <CockpitChartCard title="Top WO tiêu thụ vật tư" subtitle="Consumed + Scrap" heightClass={COCKPIT_HEIGHTS.CHART_LG}>
          <RankList rows={topWoConsumption.map((row) => ({ id: row.id, title: row.title, subtitle: row.subtitle, value: number(row.value) }))} empty="Chưa có tiêu hao vật tư" />
        </CockpitChartCard>
      </div>

      <CockpitChartCard title="Production Zone / Slot / Level Detail" subtitle="Nhóm tồn Kho vật tư SX theo vị trí" heightClass={COCKPIT_HEIGHTS.TABLE_SM}>
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
  const [selectedIssue, setSelectedIssue] = useState<IssueControlRow | null>(null)
  const [returnTarget, setReturnTarget] = useState<IssueControlRow | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [expandedModalOpen, setExpandedModalOpen] = useState(false)

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

  const filteredIssueRows = useMemo(() => {
    return issueRows.filter((row) => {
      const matchSearch = !search || `${row.issueNo} ${row.orderNo} ${row.component} ${row.material}`.toLowerCase().includes(search.toLowerCase())
      const matchStatus = !statusFilter || row.issue.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [issueRows, search, statusFilter])

  const issuedTotal = (rows ?? []).reduce((sum, row) => sum + Number(row.issuedQty ?? 0), 0)
  const returnedTotal = (rows ?? []).reduce((sum, row) => sum + Number(row.returnedQty ?? 0), 0)
  const returnableTotal = (rows ?? []).reduce((sum, row) => sum + getIssueReturnableQty(row, remainingByMaterial), 0)
  const requiredTotal = issueRows.reduce((sum, row) => sum + row.requiredQty, 0)
  const remainingTotal = issueRows.reduce((sum, row) => sum + row.remainingQty, 0)
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

  const pageSize = 14
  const pagedRows = filteredIssueRows.slice((page - 1) * pageSize, page * pageSize)

  useEffect(() => {
    setPage(1)
  }, [filteredIssueRows.length, search, statusFilter])

  return (
    <div className="space-y-2 text-xs -mt-2">
      {/* Phase 1: KPI SECTION */}
      <div className="grid grid-cols-1 gap-1 md:grid-cols-2 xl:grid-cols-6">
        <EnterpriseKpiCard title="Tổng số phiếu cấp" value={formatQuantity(issueRows.length, 0)} tone="blue" icon={<Package size={15} />} />
        <EnterpriseKpiCard title="Nhu cầu cấp phát" value={number(requiredTotal)} tone="emerald" icon={<Boxes size={15} />} />
        <EnterpriseKpiCard title="Khối lượng đã cấp" value={number(issuedTotal)} tone="cyan" icon={<Wrench size={15} />} />
        <EnterpriseKpiCard title="Khối lượng hoàn trả" value={number(returnedTotal)} tone="purple" icon={<RotateCcw size={15} />} />
        <EnterpriseKpiCard title="Khối lượng còn thiếu" value={number(remainingTotal)} tone="red" icon={<AlertTriangle size={15} />} />
        <EnterpriseKpiCard title="Tỷ lệ hoàn thành cấp" value={`${formatQuantity(completionRate, 0)}%`} tone="blue" icon={<CheckCircle2 size={15} />} />
      </div>

      {/* Phase 3: TOOLBAR */}
      <EnterprisePanel className="rounded-xl -mt-1">
        <div className="grid grid-cols-1 gap-1 xl:grid-cols-[180px_1fr_130px_120px]">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(1)
            }}
            className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:bg-[#08111f]"
          >
            <option value="">Tất cả trạng thái phiếu</option>
            <option value="COMPLETED">Hoàn tất (COMPLETED)</option>
            <option value="ISSUED">Đã cấp (ISSUED)</option>
            <option value="PARTIAL">Cấp 1 phần (PARTIAL)</option>
          </select>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setPage(1)
            }}
            placeholder="Tìm theo mã phiếu cấp, WO, cấu kiện, vật tư..."
            className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:bg-[#08111f]"
          />
          <button
            type="button"
            onClick={() => setPage(1)}
            className="h-9 self-end rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500"
          >
            Tìm kiếm
          </button>
          <button
            type="button"
            onClick={() => {
              setSearch('')
              setStatusFilter('')
              setPage(1)
            }}
            className="h-9 self-end rounded-lg border border-white/10 bg-white/[0.055] px-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
          >
            Làm mới
          </button>
        </div>
      </EnterprisePanel>

      <div className={`grid ${inventoryGridGap} xl:grid-cols-12`}>
        <div className="xl:col-span-9">
          <EnterprisePanel className="rounded-xl">
            <div className="mb-1 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-white">Trung tâm kiểm soát cấp phát vật tư (Material Issues)</h3>
                <span className="rounded-full bg-cyan-400/10 px-2 py-0.5 text-[10px] font-medium text-cyan-300 border border-cyan-400/20">
                  {filteredIssueRows.length} phiếu cấp
                </span>
              </div>
              <button
                type="button"
                onClick={() => setExpandedModalOpen(true)}
                className="text-xs font-semibold text-cyan-300 hover:text-cyan-200 transition"
              >
                Xem tất cả
              </button>
            </div>

            <div className="h-[430px] overflow-auto scrollbar-none rounded-lg border border-white/10">
              <table className="w-full min-w-[1320px] table-fixed text-sm border-collapse">
                <thead
                  className={`${inventoryTableHead} text-slate-300 border-b border-cyan-400/10 sticky top-0 z-10`}
                  style={{ backgroundColor: 'rgba(30, 41, 59, 1)' }}
                >
                  <tr>{['Issue No','Date','Work Order','Component','Required','Issued','Returned','Remaining','Readiness','Status','Action'].map(x=><th className="px-2 py-2 text-left text-xs font-semibold text-slate-300" key={x}>{x}</th>)}</tr>
                </thead>
                <tbody>
                  {pagedRows.map((row) => {
                    const issue = row.issue
                    return (
                      <tr className={`cursor-pointer ${inventoryTableRow}`} key={issue.id} onClick={() => setSelectedIssue(row)}>
                        <td className="px-2 py-1.5 font-semibold text-cyan-300 font-mono">{row.issueNo}</td>
                        <td className="px-2 py-1.5 font-mono text-slate-300 text-xs">{date(issue.issuedDate)}</td>
                        <td className="px-2 py-1.5 font-mono text-xs">{row.orderNo}<div className="mt-0.5 truncate text-[10px] text-slate-400 font-normal">{row.orderTitle}</div></td>
                        <td className="px-2 py-1.5 text-white font-medium truncate">{row.component}</td>
                        <td className="px-2 py-1.5 font-mono tabular-nums text-slate-200">{number(row.requiredQty)}</td>
                        <td className="px-2 py-1.5 font-mono tabular-nums text-cyan-300">{number(row.issuedQty)}</td>
                        <td className="px-2 py-1.5 font-mono tabular-nums text-amber-300">{number(row.returnedQty)}</td>
                        <td className={row.remainingQty > 0 ? 'px-2 py-1.5 font-mono tabular-nums text-red-300 font-bold' : 'px-2 py-1.5 font-mono tabular-nums text-emerald-300 font-bold'}>{number(row.remainingQty)}</td>
                        <td className="w-44 px-2 py-1.5">
                          <Meter value={row.readinessPercent} tone={readinessBarClass(row.readinessPercent)} />
                          <div className={`mt-0.5 text-[10px] font-mono ${row.readinessPercent >= 100 ? 'text-emerald-300' : row.readinessPercent >= 80 ? 'text-cyan-300' : row.readinessPercent >= 50 ? 'text-amber-300' : 'text-red-300'}`}>{formatQuantity(row.readinessPercent, 0)}%</div>
                        </td>
                        <td className="px-2 py-1.5"><StatusChip status={issue.status} /></td>
                        <td className="px-2 py-1.5">
                          {row.returnableQty > 0 ? (
                            <button type="button" onClick={(event) => { event.stopPropagation(); setReturnTarget(row) }} className="text-amber-300 hover:underline text-xs font-semibold">Return</button>
                          ) : (
                            <span className="text-slate-500 text-xs">Đã cân bằng</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                  {!pagedRows.length ? (
                    <tr>
                      <td colSpan={11} className="px-2 py-10">
                        <ModuleEmptyState icon={<Package size={18} />} title="Chưa có dữ liệu vật tư" description="Phiếu cấp phát vật tư sản xuất sẽ hiển thị tại đây." />
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
            <DataTablePagination page={page} pageSize={pageSize} total={filteredIssueRows.length} onPageChange={setPage} />
          </EnterprisePanel>
        </div>

        <aside className="space-y-1 xl:col-span-3">
          <CockpitChartCard title="Thiếu vật tư" subtitle="Remaining = Required - NetIssued" heightClass={COCKPIT_HEIGHTS.CHART_SM}>
            <RankList rows={shortageWorkOrders.map((row) => ({ id: row.id, title: row.title, subtitle: row.subtitle, value: number(row.value) }))} empty="Không có WO thiếu vật tư" />
          </CockpitChartCard>
          <CockpitChartCard title="Gần đây" subtitle="Phiếu cấp mới nhất" heightClass={COCKPIT_HEIGHTS.CHART_SM}>
            <RankList rows={issueRows.slice(0, 5).map((row) => ({ id: row.issue.id, title: row.issueNo, subtitle: row.orderNo, value: date(row.issue.issuedDate) }))} empty="Chưa có phiếu cấp phát" />
          </CockpitChartCard>
        </aside>
      </div>

      <div className="grid grid-cols-1 gap-1 xl:grid-cols-5">
        <CockpitChartCard title="Top vật tư cấp phát" subtitle="Xếp theo issued qty" heightClass={COCKPIT_HEIGHTS.CHART_LG}>
          <RankList rows={topIssuedMaterials.map((row) => ({ id: row.id, title: row.title, subtitle: row.subtitle, value: number(row.value) }))} />
        </CockpitChartCard>
        <CockpitChartCard title="Top vật tư hoàn trả" subtitle="Xếp theo returned qty" heightClass={COCKPIT_HEIGHTS.CHART_LG}>
          <RankList rows={topReturnedMaterials.map((row) => ({ id: row.id, title: row.title, subtitle: row.subtitle, value: number(row.value) }))} empty="Chưa có vật tư hoàn trả" />
        </CockpitChartCard>
        <CockpitChartCard title="Readiness theo WO" subtitle="NetIssued / Required" heightClass={COCKPIT_HEIGHTS.CHART_LG}>
          <RankList rows={readinessByWorkOrder.map((row) => ({ id: row.id, title: row.title, subtitle: row.subtitle, value: `${formatQuantity(row.value, 0)}%` }))} empty="Chưa có dữ liệu readiness" />
        </CockpitChartCard>
        <CockpitChartCard title="Nguồn xuất kho SX" subtitle="Warehouse / Zone / Slot" heightClass={COCKPIT_HEIGHTS.CHART_LG}>
          <RankList rows={sourceLocations.map((row) => ({ id: row.id, title: row.title, subtitle: row.subtitle, value: number(row.value) }))} empty="Chưa có vị trí xuất" />
        </CockpitChartCard>
        <CockpitChartCard title="Readiness distribution" subtitle="Theo dòng cấp phát" heightClass={COCKPIT_HEIGHTS.CHART_LG}>
          <ProductionDonut centerValue={`${formatQuantity(completionRate, 0)}%`} centerLabel="ready" segments={readinessSegments} />
        </CockpitChartCard>
      </div>

      {/* EXPANDED TABLE MODAL */}
      {expandedModalOpen
        ? createPortal(
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className="w-full max-w-7xl rounded-2xl border border-white/15 bg-[#08111f] p-5 shadow-2xl space-y-4 text-xs">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div>
                    <h2 className="text-base font-bold text-white">Toàn bộ danh sách cấp phát vật tư (Material Issues)</h2>
                    <p className="text-xs text-slate-400">Tổng cộng {filteredIssueRows.length} phiếu cấp phát trong hệ thống</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setExpandedModalOpen(false)}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition"
                  >
                    Đóng
                  </button>
                </div>

                <div className="h-[640px] overflow-y-auto rounded-xl border border-white/10">
                  <table className="w-full min-w-[1320px] text-xs table-fixed border-collapse">
                    <thead
                      className={`${inventoryTableHead} text-slate-300 border-b border-cyan-400/10 sticky top-0 z-10`}
                      style={{ backgroundColor: 'rgba(30, 41, 59, 1)' }}
                    >
                      <tr>{['Issue No','Date','Work Order','Component','Required','Issued','Returned','Remaining','Readiness','Status','Action'].map(x=><th className="px-2 py-2 text-left font-semibold text-slate-300" key={x}>{x}</th>)}</tr>
                    </thead>
                    <tbody>
                      {filteredIssueRows.map((row) => {
                        const issue = row.issue
                        return (
                          <tr className={`cursor-pointer ${inventoryTableRow}`} key={issue.id} onClick={() => { setSelectedIssue(row); setExpandedModalOpen(false) }}>
                            <td className="px-2 py-2 font-semibold text-cyan-300 font-mono">{row.issueNo}</td>
                            <td className="px-2 py-2 font-mono text-slate-300 text-xs">{date(issue.issuedDate)}</td>
                            <td className="px-2 py-2 font-mono text-xs">{row.orderNo}<div className="mt-0.5 truncate text-[10px] text-slate-400 font-normal">{row.orderTitle}</div></td>
                            <td className="px-2 py-2 text-white font-medium truncate">{row.component}</td>
                            <td className="px-2 py-2 font-mono tabular-nums text-slate-200">{number(row.requiredQty)}</td>
                            <td className="px-2 py-2 font-mono tabular-nums text-cyan-300">{number(row.issuedQty)}</td>
                            <td className="px-2 py-2 font-mono tabular-nums text-amber-300">{number(row.returnedQty)}</td>
                            <td className={row.remainingQty > 0 ? 'px-2 py-2 font-mono tabular-nums text-red-300 font-bold' : 'px-2 py-2 font-mono tabular-nums text-emerald-300 font-bold'}>{number(row.remainingQty)}</td>
                            <td className="w-44 px-2 py-2">
                              <Meter value={row.readinessPercent} tone={readinessBarClass(row.readinessPercent)} />
                              <div className={`mt-0.5 text-[10px] font-mono ${row.readinessPercent >= 100 ? 'text-emerald-300' : row.readinessPercent >= 80 ? 'text-cyan-300' : row.readinessPercent >= 50 ? 'text-amber-300' : 'text-red-300'}`}>{formatQuantity(row.readinessPercent, 0)}%</div>
                            </td>
                            <td className="px-2 py-2"><StatusChip status={issue.status} /></td>
                            <td className="px-2 py-2">
                              {row.returnableQty > 0 ? (
                                <button type="button" onClick={(event) => { event.stopPropagation(); setReturnTarget(row); setExpandedModalOpen(false) }} className="text-amber-300 hover:underline text-xs font-semibold">Return</button>
                              ) : (
                                <span className="text-slate-500 text-xs">Đã cân bằng</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                <DataTablePagination page={page} pageSize={pageSize} total={filteredIssueRows.length} onPageChange={setPage} />
              </div>
            </div>,
            document.body,
          )
        : null}

      <IssueDetailDrawer row={selectedIssue} onClose={() => setSelectedIssue(null)} />
      {returnTarget ? <ProductionMaterialReturnModal issue={returnTarget.issue} returnableQty={returnTarget.returnableQty} onClose={() => setReturnTarget(null)} /> : null}
    </div>
  )
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
  const [consumeTarget, setConsumeTarget] = useState<ProductionConsumptionTarget | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [expandedModalOpen, setExpandedModalOpen] = useState(false)

  const rows = useMemo(() => buildConsumptionRows(issues, consumptions), [issues, consumptions])

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      return !search || `${row.orderNo} ${row.title} ${row.material}`.toLowerCase().includes(search.toLowerCase())
    })
  }, [rows, search])

  const issued = rows.reduce((sum, row) => sum + row.issuedQty, 0)
  const returned = rows.reduce((sum, row) => sum + row.returnedQty, 0)
  const consumed = rows.reduce((sum, row) => sum + row.consumedQty, 0)
  const scrap = rows.reduce((sum, row) => sum + row.scrapQty, 0)
  const remaining = rows.reduce((sum, row) => sum + row.remainingQty, 0)

  const pageSize = 14
  const pagedRows = filteredRows.slice((page - 1) * pageSize, page * pageSize)

  useEffect(() => {
    setPage(1)
  }, [filteredRows.length, search])

  return (
    <div className="space-y-2 text-xs -mt-2">
      {/* Phase 1: KPI SECTION */}
      <div className="grid grid-cols-1 gap-1 md:grid-cols-2 xl:grid-cols-6">
        <EnterpriseKpiCard title="Tổng dòng tiêu hao" value={formatQuantity(rows.length, 0)} tone="blue" icon={<Boxes size={15} />} />
        <EnterpriseKpiCard title="Khối lượng đã cấp" value={number(issued)} tone="cyan" icon={<Package size={15} />} />
        <EnterpriseKpiCard title="Khối lượng hoàn trả" value={number(returned)} tone="amber" icon={<RotateCcw size={15} />} />
        <EnterpriseKpiCard title="Khối lượng tiêu hao" value={number(consumed)} tone="emerald" icon={<Wrench size={15} />} />
        <EnterpriseKpiCard title="Khối lượng phế phẩm" value={number(scrap)} tone="red" icon={<AlertTriangle size={15} />} />
        <EnterpriseKpiCard title="Còn treo tại SX" value={number(remaining)} tone="purple" icon={<FileStack size={15} />} />
      </div>

      {/* Phase 3: TOOLBAR */}
      <EnterprisePanel className="rounded-xl -mt-1">
        <div className="grid grid-cols-1 gap-1 xl:grid-cols-[1fr_130px_120px]">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setPage(1)
            }}
            placeholder="Tìm theo mã lệnh SX (MO), tên sản phẩm, tên/mã vật tư..."
            className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:bg-[#08111f]"
          />
          <button
            type="button"
            onClick={() => setPage(1)}
            className="h-9 self-end rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500"
          >
            Tìm kiếm
          </button>
          <button
            type="button"
            onClick={() => {
              setSearch('')
              setPage(1)
            }}
            className="h-9 self-end rounded-lg border border-white/10 bg-white/[0.055] px-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
          >
            Làm mới
          </button>
        </div>
      </EnterprisePanel>

      <div className={`grid ${inventoryGridGap} xl:grid-cols-12`}>
        <div className="xl:col-span-9">
          <EnterprisePanel className="rounded-xl">
            <div className="mb-1 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-white">Bảng tiêu hao vật tư sản xuất (Production Consumption)</h3>
                <span className="rounded-full bg-cyan-400/10 px-2 py-0.5 text-[10px] font-medium text-cyan-300 border border-cyan-400/20">
                  {filteredRows.length} dòng
                </span>
              </div>
              <button
                type="button"
                onClick={() => setExpandedModalOpen(true)}
                className="text-xs font-semibold text-cyan-300 hover:text-cyan-200 transition"
              >
                Xem tất cả
              </button>
            </div>

            <div className="h-[430px] overflow-auto scrollbar-none rounded-lg border border-white/10">
              <table className="w-full min-w-[1080px] table-fixed text-sm border-collapse">
                <thead
                  className={`${inventoryTableHead} text-slate-300 border-b border-cyan-400/10 sticky top-0 z-10`}
                  style={{ backgroundColor: 'rgba(30, 41, 59, 1)' }}
                >
                  <tr>{['MO Number','Material','Issued','Returned','Consumed','Scrap','Remaining','Unit','Action'].map(x=><th className="px-2 py-2 text-left text-xs font-semibold text-slate-300" key={x}>{x}</th>)}</tr>
                </thead>
                <tbody>
                  {pagedRows.map((row) => (
                    <tr className={inventoryTableRow} key={`${row.productionOrderId}-${row.inventoryItemId}`}>
                      <td className="px-2 py-1.5 font-semibold text-cyan-300 font-mono">{row.orderNo}<div className="mt-0.5 truncate text-[10px] text-slate-400 font-normal">{row.title}</div></td>
                      <td className="px-2 py-1.5 text-white font-medium truncate">{row.material}</td>
                      <td className="px-2 py-1.5 font-mono tabular-nums text-slate-200">{number(row.issuedQty)}</td>
                      <td className="px-2 py-1.5 font-mono tabular-nums text-amber-300">{number(row.returnedQty)}</td>
                      <td className="px-2 py-1.5 font-mono tabular-nums text-emerald-300 font-semibold">{number(row.consumedQty)}</td>
                      <td className="px-2 py-1.5 font-mono tabular-nums text-red-300">{number(row.scrapQty)}</td>
                      <td className={`px-2 py-1.5 font-mono tabular-nums ${row.remainingQty > 0 ? 'text-amber-300 font-semibold' : 'text-slate-500'}`}>{number(row.remainingQty)}</td>
                      <td className="px-2 py-1.5 text-slate-300 text-xs">{row.unit ?? '-'}</td>
                      <td className="px-2 py-1.5">
                        {row.remainingQty > 0 ? (
                          <button type="button" onClick={() => setConsumeTarget(row)} className="text-cyan-300 hover:underline text-xs font-semibold">Consume</button>
                        ) : (
                          <span className="text-slate-500 text-xs">Đã cân bằng</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {!pagedRows.length ? (
                    <tr>
                      <td colSpan={9} className="px-2 py-10">
                        <ModuleEmptyState icon={<Boxes size={18} />} title="Chưa có dữ liệu tiêu hao" description="Consumption sẽ hiển thị khi vật tư đã issue được consume hoặc scrap." />
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
            <DataTablePagination page={page} pageSize={pageSize} total={filteredRows.length} onPageChange={setPage} />
          </EnterprisePanel>
        </div>

        <aside className="space-y-1 xl:col-span-3">
          <CockpitChartCard title="Nguyên tắc tiêu hao" subtitle="Production consumption rule" heightClass={COCKPIT_HEIGHTS.CHART_SM}>
            <div className="space-y-3 text-xs text-slate-300">
              <div>Chỉ consume vật tư đã issue cho MO.</div>
              <div className="text-cyan-300 font-mono">Remaining = Issued - Returned - Consumed - Scrap.</div>
              <div>Ghi consume sẽ tạo ledger event CONSUME.</div>
            </div>
          </CockpitChartCard>
          <CockpitChartCard title="Phân bổ tiêu hao" subtitle="Returned / Consumed / Scrap / Remaining" heightClass={COCKPIT_HEIGHTS.CHART_SM}>
            {issued > 0 ? (
              <ProductionDonut centerValue={number(issued)} centerLabel="issued" segments={[
                { label: 'Returned', value: returned, color: '#f59e0b' },
                { label: 'Consumed', value: consumed, color: '#14c987' },
                { label: 'Scrap', value: scrap, color: '#ef4444' },
                { label: 'Remaining', value: remaining, color: '#7c3aed' },
              ]} />
            ) : (
              <ModuleEmptyState icon={<Boxes size={18} />} title="Chưa có phân bổ tiêu hao" description="Biểu đồ sẽ hiển thị khi có vật tư đã issue." />
            )}
          </CockpitChartCard>
          <CockpitChartCard title="Cân bằng vật tư" subtitle="Issued - Returned - Consumed - Scrap" heightClass={COCKPIT_HEIGHTS.CHART_SM}>
            <div className="space-y-2 text-xs text-slate-300">
              <Info k="Issued" v={number(issued)} />
              <Info k="Settled" v={number(returned + consumed + scrap)} />
              <Info k="Remaining" v={number(remaining)} />
            </div>
          </CockpitChartCard>
        </aside>
      </div>

      {/* EXPANDED TABLE MODAL */}
      {expandedModalOpen
        ? createPortal(
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className="w-full max-w-7xl rounded-2xl border border-white/15 bg-[#08111f] p-5 shadow-2xl space-y-4 text-xs">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div>
                    <h2 className="text-base font-bold text-white">Toàn bộ bảng tiêu hao vật tư (Material Consumptions)</h2>
                    <p className="text-xs text-slate-400">Tổng cộng {filteredRows.length} dòng tiêu hao trong hệ thống</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setExpandedModalOpen(false)}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition"
                  >
                    Đóng
                  </button>
                </div>

                <div className="h-[640px] overflow-y-auto rounded-xl border border-white/10">
                  <table className="w-full min-w-[1080px] text-xs table-fixed border-collapse">
                    <thead
                      className={`${inventoryTableHead} text-slate-300 border-b border-cyan-400/10 sticky top-0 z-10`}
                      style={{ backgroundColor: 'rgba(30, 41, 59, 1)' }}
                    >
                      <tr>{['MO Number','Material','Issued','Returned','Consumed','Scrap','Remaining','Unit','Action'].map(x=><th className="px-2 py-2 text-left font-semibold text-slate-300" key={x}>{x}</th>)}</tr>
                    </thead>
                    <tbody>
                      {filteredRows.map((row) => (
                        <tr className={inventoryTableRow} key={`${row.productionOrderId}-${row.inventoryItemId}`}>
                          <td className="px-2 py-2 font-semibold text-cyan-300 font-mono">{row.orderNo}<div className="mt-0.5 truncate text-[10px] text-slate-400 font-normal">{row.title}</div></td>
                          <td className="px-2 py-2 text-white font-medium truncate">{row.material}</td>
                          <td className="px-2 py-2 font-mono tabular-nums text-slate-200">{number(row.issuedQty)}</td>
                          <td className="px-2 py-2 font-mono tabular-nums text-amber-300">{number(row.returnedQty)}</td>
                          <td className="px-2 py-2 font-mono tabular-nums text-emerald-300 font-semibold">{number(row.consumedQty)}</td>
                          <td className="px-2 py-2 font-mono tabular-nums text-red-300">{number(row.scrapQty)}</td>
                          <td className={`px-2 py-2 font-mono tabular-nums ${row.remainingQty > 0 ? 'text-amber-300 font-semibold' : 'text-slate-500'}`}>{number(row.remainingQty)}</td>
                          <td className="px-2 py-2 text-slate-300 text-xs">{row.unit ?? '-'}</td>
                          <td className="px-2 py-2">
                            {row.remainingQty > 0 ? (
                              <button type="button" onClick={() => { setConsumeTarget(row); setExpandedModalOpen(false) }} className="text-cyan-300 hover:underline text-xs font-semibold">Consume</button>
                            ) : (
                              <span className="text-slate-500 text-xs">Đã cân bằng</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <DataTablePagination page={page} pageSize={pageSize} total={filteredRows.length} onPageChange={setPage} />
              </div>
            </div>,
            document.body,
          )
        : null}

      {consumeTarget ? <ProductionConsumptionModal target={consumeTarget} onClose={() => setConsumeTarget(null)} /> : null}
    </div>
  )
}

function Reservations({ rows, orders, onOpen }: { rows: ProductionReservation[]; orders: ProductionOrder[]; onOpen: (row: ProductionOrder) => void }) {
  const reserve = useReserveProductionReservation()
  const issue = useIssueProductionReservation()
  const release = useReleaseProductionReservation()
  const expire = useExpireProductionReservation()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [expandedModalOpen, setExpandedModalOpen] = useState(false)

  async function run(action: () => Promise<unknown>, message: string) {
    try {
      await action()
      toast.success(message)
    } catch (error) {
      const raw = (error as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message
      toast.error(Array.isArray(raw) ? raw.join(', ') : raw || 'Không thể cập nhật giữ chỗ vật tư')
    }
  }

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const matchSearch = !search || `${row.reservationNo} ${row.productionOrder?.orderNo} ${row.bom?.bomNo}`.toLowerCase().includes(search.toLowerCase())
      const matchStatus = !statusFilter || row.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [rows, search, statusFilter])

  const requiredTotal = rows.reduce((sum, row) => sum + row.lines.reduce((lineSum, line) => lineSum + Number(line.requiredQty ?? 0), 0), 0)
  const reservedTotal = rows.reduce((sum, row) => sum + row.lines.reduce((lineSum, line) => lineSum + Number(line.reservedQty ?? 0), 0), 0)
  const issuedTotal = rows.reduce((sum, row) => sum + row.lines.reduce((lineSum, line) => lineSum + Number(line.issuedQty ?? 0), 0), 0)
  const reservedCount = rows.filter((row) => row.status === 'RESERVED').length
  const draftCount = rows.filter((row) => row.status === 'DRAFT').length
  const expiredCount = rows.filter((row) => row.status === 'EXPIRED').length

  const pageSize = 14
  const pagedRows = filteredRows.slice((page - 1) * pageSize, page * pageSize)

  const statusSegments = [
    { label: 'Reserved', value: reservedCount, color: '#14c987' },
    { label: 'Draft', value: draftCount, color: '#1d7cff' },
    { label: 'Cancelled', value: rows.filter((row) => row.status === 'CANCELLED').length, color: '#f59e0b' },
    { label: 'Expired', value: expiredCount, color: '#ef4444' },
  ]

  useEffect(() => {
    setPage(1)
  }, [filteredRows.length, search, statusFilter])

  return (
    <div className="space-y-2 text-xs -mt-2">
      {/* Phase 1: KPI SECTION */}
      <div className="grid grid-cols-1 gap-1 md:grid-cols-2 xl:grid-cols-6">
        <EnterpriseKpiCard title="Tổng số Reservation" value={formatQuantity(rows.length, 0)} tone="blue" icon={<SlidersHorizontal size={15} />} />
        <EnterpriseKpiCard title="Đang giữ chỗ (Reserved)" value={formatQuantity(reservedCount, 0)} tone="emerald" icon={<CheckCircle2 size={15} />} />
        <EnterpriseKpiCard title="Khối lượng nhu cầu VT" value={number(requiredTotal)} tone="cyan" icon={<Boxes size={15} />} />
        <EnterpriseKpiCard title="Khối lượng đã giữ chỗ" value={number(reservedTotal)} tone="purple" icon={<FileStack size={15} />} />
        <EnterpriseKpiCard title="Khối lượng đã cấp phát" value={number(issuedTotal)} tone="blue" icon={<Wrench size={15} />} />
        <EnterpriseKpiCard title="Giữ chỗ hết hạn/hủy" value={formatQuantity(expiredCount, 0)} tone="amber" icon={<AlertTriangle size={15} />} />
      </div>

      {/* Phase 3: TOOLBAR */}
      <EnterprisePanel className="rounded-xl -mt-1">
        <div className="grid grid-cols-1 gap-1 xl:grid-cols-[180px_1fr_130px_120px]">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(1)
            }}
            className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:bg-[#08111f]"
          >
            <option value="">Tất cả trạng thái giữ chỗ</option>
            <option value="RESERVED">Đã giữ chỗ (RESERVED)</option>
            <option value="DRAFT">Nháp (DRAFT)</option>
            <option value="PARTIALLY_ISSUED">Cấp phát 1 phần</option>
            <option value="EXPIRED">Hết hạn (EXPIRED)</option>
          </select>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setPage(1)
            }}
            placeholder="Tìm theo mã Reservation, mã lệnh sản xuất, BOM..."
            className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:bg-[#08111f]"
          />
          <button
            type="button"
            onClick={() => setPage(1)}
            className="h-9 self-end rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500"
          >
            Tìm kiếm
          </button>
          <button
            type="button"
            onClick={() => {
              setSearch('')
              setStatusFilter('')
              setPage(1)
            }}
            className="h-9 self-end rounded-lg border border-white/10 bg-white/[0.055] px-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
          >
            Làm mới
          </button>
        </div>
      </EnterprisePanel>

      <div className={`grid ${inventoryGridGap} xl:grid-cols-12`}>
        <div className="xl:col-span-9">
          <EnterprisePanel className="rounded-xl">
            <div className="mb-1 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-white">Danh sách giữ chỗ vật tư sản xuất (Reservations)</h3>
                <span className="rounded-full bg-cyan-400/10 px-2 py-0.5 text-[10px] font-medium text-cyan-300 border border-cyan-400/20">
                  {filteredRows.length} giữ chỗ
                </span>
              </div>
              <button
                type="button"
                onClick={() => setExpandedModalOpen(true)}
                className="text-xs font-semibold text-cyan-300 hover:text-cyan-200 transition"
              >
                Xem tất cả
              </button>
            </div>

            <div className="h-[430px] overflow-auto scrollbar-none rounded-lg border border-white/10">
              <table className="w-full min-w-[1120px] table-fixed text-sm border-collapse">
                <thead
                  className={`${inventoryTableHead} text-slate-300 border-b border-cyan-400/10 sticky top-0 z-10`}
                  style={{ backgroundColor: 'rgba(30, 41, 59, 1)' }}
                >
                  <tr>{['Reservation','MO Number','BOM','Dòng VT','Required','Reserved','Issued','Vị trí','Ngày giữ','Trạng thái','Thao tác'].map((x)=><th className="px-2 py-2 text-left text-xs font-semibold text-slate-300" key={x}>{x}</th>)}</tr>
                </thead>
                <tbody>
                  {pagedRows.map((row) => {
                    const requiredQty = row.lines.reduce((sum, line) => sum + Number(line.requiredQty ?? 0), 0)
                    const reservedQty = row.lines.reduce((sum, line) => sum + Number(line.reservedQty ?? 0), 0)
                    const issuedQty = row.lines.reduce((sum, line) => sum + Number(line.issuedQty ?? 0), 0)
                    const locations = new Set(row.lines.map((line) => [line.warehouse?.code, line.zone?.code, line.slotId, line.level].filter(Boolean).join('/')).filter(Boolean))
                    const order = orders.find((item) => item.id === row.productionOrderId)
                    return (
                      <tr className={inventoryTableRow} key={row.id}>
                        <td className="px-2 py-1.5 font-semibold text-cyan-300 font-mono">{row.reservationNo}</td>
                        <td className="px-2 py-1.5 font-mono text-xs">{order ? <button className="text-left text-cyan-300 hover:underline font-mono" onClick={() => onOpen(order)}>{row.productionOrder?.orderNo ?? order.orderNo}</button> : row.productionOrder?.orderNo}</td>
                        <td className="px-2 py-1.5 font-mono text-slate-300 text-xs">{row.bom?.bomNo ?? '-'}</td>
                        <td className="px-2 py-1.5 font-mono tabular-nums text-slate-300 text-xs">{row.lines.length}</td>
                        <td className="px-2 py-1.5 font-mono tabular-nums text-slate-200">{number(requiredQty)}</td>
                        <td className="px-2 py-1.5 font-mono tabular-nums text-emerald-300">{number(reservedQty)}</td>
                        <td className="px-2 py-1.5 font-mono tabular-nums text-cyan-300">{number(issuedQty)}</td>
                        <td className="px-2 py-1.5 text-slate-300 text-xs truncate">{locations.size ? Array.from(locations).slice(0,2).join(', ') : '-'}</td>
                        <td className="px-2 py-1.5 text-slate-300 font-mono text-xs">{row.reservedAt ? formatDateTime(row.reservedAt) : '-'}</td>
                        <td className="px-2 py-1.5"><StatusChip status={row.status} /></td>
                        <td className="px-2 py-1.5">
                          <div className="flex flex-wrap gap-1.5 text-xs font-semibold">
                            {row.status === 'DRAFT' && <button className="text-cyan-300 hover:underline" onClick={() => run(() => reserve.mutateAsync({ id: row.id }), 'Đã giữ chỗ vật tư')}>Reserve</button>}
                            {['RESERVED','PARTIALLY_ISSUED'].includes(row.status) && <button className="text-emerald-300 hover:underline" onClick={() => run(() => issue.mutateAsync({ id: row.id }), 'Đã issue vật tư từ reservation')}>Issue</button>}
                            {['RESERVED','PARTIALLY_ISSUED'].includes(row.status) && <button className="text-amber-300 hover:underline" onClick={() => run(() => release.mutateAsync({ id: row.id }), 'Đã hủy giữ chỗ')}>Release</button>}
                            {['DRAFT','RESERVED','PARTIALLY_ISSUED'].includes(row.status) && <button className="text-red-300 hover:underline" onClick={() => run(() => expire.mutateAsync({ id: row.id }), 'Đã hết hạn giữ chỗ')}>Expire</button>}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {!pagedRows.length ? (
                    <tr>
                      <td colSpan={11} className="px-2 py-10">
                        <ModuleEmptyState icon={<SlidersHorizontal size={18} />} title="Chưa có dữ liệu giữ chỗ" description="Reservation vật tư sản xuất sẽ hiển thị khi tạo giữ chỗ cho WO." />
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
            <DataTablePagination page={page} pageSize={pageSize} total={filteredRows.length} onPageChange={setPage} />
          </EnterprisePanel>
        </div>

        <aside className="space-y-1 xl:col-span-3">
          <CockpitChartCard title="Chờ cấp vật tư" subtitle="Reserved chưa issue" heightClass={COCKPIT_HEIGHTS.CHART_SM}>
            <div className="space-y-2 text-xs text-slate-300">
              <Info k="Required" v={number(requiredTotal)} />
              <Info k="Reserved" v={number(reservedTotal)} />
              <Info k="Issued" v={number(issuedTotal)} />
            </div>
          </CockpitChartCard>
          <CockpitChartCard title="Theo trạng thái" subtitle="Reservation status" heightClass={COCKPIT_HEIGHTS.CHART_SM}>
            <ProductionDonut centerValue={formatQuantity(rows.length, 0)} centerLabel="RSV" segments={statusSegments} />
          </CockpitChartCard>
          <CockpitChartCard title="Gần đây" subtitle="Reservation mới nhất" heightClass={COCKPIT_HEIGHTS.CHART_SM}>
            <RankList rows={rows.slice(0, 5).map((row) => ({ id: row.id, title: row.reservationNo, subtitle: row.productionOrder?.orderNo ?? row.productionOrderId, value: row.status }))} empty="Chưa có reservation" />
          </CockpitChartCard>
        </aside>
      </div>

      {/* EXPANDED TABLE MODAL */}
      {expandedModalOpen
        ? createPortal(
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className="w-full max-w-7xl rounded-2xl border border-white/15 bg-[#08111f] p-5 shadow-2xl space-y-4 text-xs">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div>
                    <h2 className="text-base font-bold text-white">Toàn bộ danh sách giữ chỗ vật tư (Reservations)</h2>
                    <p className="text-xs text-slate-400">Tổng cộng {filteredRows.length} lượt giữ chỗ trong hệ thống</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setExpandedModalOpen(false)}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition"
                  >
                    Đóng
                  </button>
                </div>

                <div className="h-[640px] overflow-y-auto rounded-xl border border-white/10">
                  <table className="w-full min-w-[1120px] text-xs table-fixed border-collapse">
                    <thead
                      className={`${inventoryTableHead} text-slate-300 border-b border-cyan-400/10 sticky top-0 z-10`}
                      style={{ backgroundColor: 'rgba(30, 41, 59, 1)' }}
                    >
                      <tr>{['Reservation','MO Number','BOM','Dòng VT','Required','Reserved','Issued','Vị trí','Ngày giữ','Trạng thái','Thao tác'].map((x)=><th className="px-2 py-2 text-left font-semibold text-slate-300" key={x}>{x}</th>)}</tr>
                    </thead>
                    <tbody>
                      {filteredRows.map((row) => {
                        const requiredQty = row.lines.reduce((sum, line) => sum + Number(line.requiredQty ?? 0), 0)
                        const reservedQty = row.lines.reduce((sum, line) => sum + Number(line.reservedQty ?? 0), 0)
                        const issuedQty = row.lines.reduce((sum, line) => sum + Number(line.issuedQty ?? 0), 0)
                        const locations = new Set(row.lines.map((line) => [line.warehouse?.code, line.zone?.code, line.slotId, line.level].filter(Boolean).join('/')).filter(Boolean))
                        const order = orders.find((item) => item.id === row.productionOrderId)
                        return (
                          <tr className={inventoryTableRow} key={row.id}>
                            <td className="px-2 py-2 font-semibold text-cyan-300 font-mono">{row.reservationNo}</td>
                            <td className="px-2 py-2 font-mono text-xs">{order ? <button className="text-left text-cyan-300 hover:underline font-mono" onClick={() => { onOpen(order); setExpandedModalOpen(false) }}>{row.productionOrder?.orderNo ?? order.orderNo}</button> : row.productionOrder?.orderNo}</td>
                            <td className="px-2 py-2 font-mono text-slate-300">{row.bom?.bomNo ?? '-'}</td>
                            <td className="px-2 py-2 font-mono tabular-nums text-slate-300">{row.lines.length}</td>
                            <td className="px-2 py-2 font-mono tabular-nums text-slate-200">{number(requiredQty)}</td>
                            <td className="px-2 py-2 font-mono tabular-nums text-emerald-300">{number(reservedQty)}</td>
                            <td className="px-2 py-2 font-mono tabular-nums text-cyan-300">{number(issuedQty)}</td>
                            <td className="px-2 py-2 text-slate-300 truncate">{locations.size ? Array.from(locations).slice(0,2).join(', ') : '-'}</td>
                            <td className="px-2 py-2 text-slate-300 font-mono">{row.reservedAt ? formatDateTime(row.reservedAt) : '-'}</td>
                            <td className="px-2 py-2"><StatusChip status={row.status} /></td>
                            <td className="px-2 py-2">
                              <div className="flex flex-wrap gap-1.5 text-xs font-semibold">
                                {row.status === 'DRAFT' && <button className="text-cyan-300 hover:underline" onClick={() => run(() => reserve.mutateAsync({ id: row.id }), 'Đã giữ chỗ vật tư')}>Reserve</button>}
                                {['RESERVED','PARTIALLY_ISSUED'].includes(row.status) && <button className="text-emerald-300 hover:underline" onClick={() => run(() => issue.mutateAsync({ id: row.id }), 'Đã issue vật tư từ reservation')}>Issue</button>}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                <DataTablePagination page={page} pageSize={pageSize} total={filteredRows.length} onPageChange={setPage} />
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  )
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
  const issueQty = rows.filter((row) => row.eventType === 'ISSUE').reduce((sum, row) => sum + Number(row.quantity ?? 0), 0)
  const consumeQty = rows.filter((row) => row.eventType === 'CONSUME').reduce((sum, row) => sum + Number(row.quantity ?? 0), 0)
  const netQty = rows.reduce((sum, row) => sum + Number(row.quantity ?? 0), 0)
  const eventTypes: Array<ProductionMaterialLedger['eventType']> = ['RESERVE', 'RELEASE', 'ISSUE', 'RETURN', 'CONSUME', 'ADJUST']

  const [page, setPage] = useState(1)
  const [expandedModalOpen, setExpandedModalOpen] = useState(false)
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
    setPage(1)
  }

  return (
    <div className="space-y-2 text-xs -mt-2">
      {/* Phase 1: KPI SECTION */}
      <div className="grid grid-cols-1 gap-1 md:grid-cols-2 xl:grid-cols-6">
        <EnterpriseKpiCard title="Tổng dòng Ledger" value={formatQuantity(rows.length, 0)} tone="blue" icon={<FileText size={15} />} />
        <EnterpriseKpiCard title="Biến động ròng (Net)" value={number(netQty)} tone="emerald" icon={<Boxes size={15} />} />
        <EnterpriseKpiCard title="Khối lượng Reserve" value={number(reserveQty)} tone="cyan" icon={<SlidersHorizontal size={15} />} />
        <EnterpriseKpiCard title="Khối lượng Release" value={number(releaseQty)} tone="amber" icon={<RotateCcw size={15} />} />
        <EnterpriseKpiCard title="Khối lượng Issue" value={number(issueQty)} tone="blue" icon={<Package size={15} />} />
        <EnterpriseKpiCard title="Khối lượng Consume" value={number(consumeQty)} tone="purple" icon={<Wrench size={15} />} />
      </div>

      {/* Phase 3: TOOLBAR */}
      <EnterprisePanel className="rounded-xl -mt-1">
        <div className="grid grid-cols-1 gap-1 xl:grid-cols-[180px_180px_180px_1fr_120px]">
          <select
            value={filters.productionOrderId ?? ''}
            onChange={(event) => update('productionOrderId', event.target.value)}
            className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:bg-[#08111f]"
          >
            <option value="">Tất cả lệnh SX</option>
            {orders.map((order) => (
              <option key={order.id} value={order.id}>{order.orderNo} · {order.title}</option>
            ))}
          </select>
          <select
            value={filters.inventoryItemId ?? ''}
            onChange={(event) => update('inventoryItemId', event.target.value)}
            className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:bg-[#08111f]"
          >
            <option value="">Tất cả vật tư</option>
            {materials.map((material) => (
              <option key={material.id} value={material.id}>{material.code} · {material.name}</option>
            ))}
          </select>
          <select
            value={filters.eventType ?? ''}
            onChange={(event) => update('eventType', event.target.value)}
            className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:bg-[#08111f]"
          >
            <option value="">Tất cả Event</option>
            {eventTypes.map((eventType) => (
              <option key={eventType} value={eventType}>{eventType}</option>
            ))}
          </select>
          <div className="flex gap-1">
            <input
              type="date"
              value={filters.fromDate ?? ''}
              onChange={(event) => update('fromDate', event.target.value)}
              className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:bg-[#08111f]"
            />
            <input
              type="date"
              value={filters.toDate ?? ''}
              onChange={(event) => update('toDate', event.target.value)}
              className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:bg-[#08111f]"
            />
          </div>
          <button
            type="button"
            onClick={() => onFiltersChange({})}
            className="h-9 self-end rounded-lg border border-white/10 bg-white/[0.055] px-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
          >
            Làm mới
          </button>
        </div>
      </EnterprisePanel>

      <div className={`grid ${inventoryGridGap} xl:grid-cols-12`}>
        <div className="xl:col-span-9">
          <EnterprisePanel className="rounded-xl">
            <div className="mb-1 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-white">Sổ vật tư sản xuất (Production Material Ledger)</h3>
                <span className="rounded-full bg-cyan-400/10 px-2 py-0.5 text-[10px] font-medium text-cyan-300 border border-cyan-400/20">
                  {rows.length} dòng
                </span>
              </div>
              <button
                type="button"
                onClick={() => setExpandedModalOpen(true)}
                className="text-xs font-semibold text-cyan-300 hover:text-cyan-200 transition"
              >
                Xem tất cả
              </button>
            </div>

            <div className="h-[430px] overflow-auto scrollbar-none rounded-lg border border-white/10">
              <table className="w-full min-w-[1060px] table-fixed text-sm border-collapse">
                <thead
                  className={`${inventoryTableHead} text-slate-300 border-b border-cyan-400/10 sticky top-0 z-10`}
                  style={{ backgroundColor: 'rgba(30, 41, 59, 1)' }}
                >
                  <tr>{['Thời gian','Event','MO','Reservation','Material','Vị trí','Quantity','Created By','Remark'].map((x)=><th className="px-2 py-2 text-left text-xs font-semibold text-slate-300" key={x}>{x}</th>)}</tr>
                </thead>
                <tbody>
                  {pagedRows.map((row) => (
                    <tr key={row.id} className={inventoryTableRow}>
                      <td className="px-2 py-1.5 font-mono text-slate-300 text-xs">{formatDateTime(row.eventDate)}</td>
                      <td className="px-2 py-1.5"><StatusChip status={row.eventType} /></td>
                      <td className="px-2 py-1.5 font-semibold text-cyan-300 font-mono">{row.productionOrder?.orderNo ?? row.productionOrderId}</td>
                      <td className="px-2 py-1.5 font-mono text-slate-300 text-xs">{row.reservation?.reservationNo ?? '-'}</td>
                      <td className="px-2 py-1.5 text-white font-medium truncate">{row.inventoryItem ? `${row.inventoryItem.code} · ${row.inventoryItem.name}` : row.inventoryItemId}</td>
                      <td className="px-2 py-1.5 text-slate-300 font-mono text-xs truncate">{[row.warehouse?.code, row.zone?.code, row.slotId, row.level ? `L${row.level}` : undefined].filter(Boolean).join('/') || '-'}</td>
                      <td className={Number(row.quantity) < 0 ? 'px-2 py-1.5 font-mono tabular-nums text-amber-300 font-semibold' : 'px-2 py-1.5 font-mono tabular-nums text-emerald-300 font-semibold'}>{number(row.quantity)}</td>
                      <td className="px-2 py-1.5 text-slate-300 text-xs">{row.createdBy ?? '-'}</td>
                      <td className="px-2 py-1.5 text-slate-400 text-xs truncate">{row.remark ?? '-'}</td>
                    </tr>
                  ))}
                  {!pagedRows.length ? (
                    <tr>
                      <td colSpan={9} className="px-2 py-10">
                        <ModuleEmptyState icon={<FileText size={18} />} title="Chưa có dữ liệu vật tư" description="Ledger sẽ có dữ liệu khi reservation, issue, return, consume hoặc adjust phát sinh." />
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
            <DataTablePagination page={page} pageSize={pageSize} total={rows.length} onPageChange={setPage} />
          </EnterprisePanel>
        </div>

        <aside className="space-y-1 xl:col-span-3">
          <CockpitChartCard title="Giá trị xuất" subtitle="Ledger chưa có unit cost" heightClass={COCKPIT_HEIGHTS.CHART_SM}>
            <ModuleEmptyState icon={<Boxes size={18} />} title="Chưa có giá trị xuất" description="Cần cost trên ledger/material issue để hiển thị giá trị." />
          </CockpitChartCard>
          <CockpitChartCard title="Theo kho" subtitle="Quantity movement" heightClass={COCKPIT_HEIGHTS.CHART_SM}>
            <RankList rows={warehouseRows.slice(0, 5)} empty="Chưa có dữ liệu kho" />
          </CockpitChartCard>
          <CockpitChartCard title="Gần đây" subtitle="Event mới nhất" heightClass={COCKPIT_HEIGHTS.CHART_SM}>
            <RankList rows={rows.slice(0, 5).map((row) => ({ id: row.id, title: row.eventType, subtitle: row.productionOrder?.orderNo ?? row.productionOrderId, value: formatDateTime(row.eventDate) }))} empty="Chưa có ledger event" />
          </CockpitChartCard>
        </aside>
      </div>

      {/* EXPANDED TABLE MODAL */}
      {expandedModalOpen
        ? createPortal(
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className="w-full max-w-7xl rounded-2xl border border-white/15 bg-[#08111f] p-5 shadow-2xl space-y-4 text-xs">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div>
                    <h2 className="text-base font-bold text-white">Toàn bộ sổ vật tư sản xuất (Material Ledger)</h2>
                    <p className="text-xs text-slate-400">Tổng cộng {rows.length} nhật ký biến động vật tư</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setExpandedModalOpen(false)}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition"
                  >
                    Đóng
                  </button>
                </div>

                <div className="h-[640px] overflow-y-auto rounded-xl border border-white/10">
                  <table className="w-full min-w-[1060px] text-xs table-fixed border-collapse">
                    <thead
                      className={`${inventoryTableHead} text-slate-300 border-b border-cyan-400/10 sticky top-0 z-10`}
                      style={{ backgroundColor: 'rgba(30, 41, 59, 1)' }}
                    >
                      <tr>{['Thời gian','Event','MO','Reservation','Material','Vị trí','Quantity','Created By','Remark'].map((x)=><th className="px-2 py-2 text-left font-semibold text-slate-300" key={x}>{x}</th>)}</tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => (
                        <tr key={row.id} className={inventoryTableRow}>
                          <td className="px-2 py-2 font-mono text-slate-300 text-xs">{formatDateTime(row.eventDate)}</td>
                          <td className="px-2 py-2"><StatusChip status={row.eventType} /></td>
                          <td className="px-2 py-2 font-semibold text-cyan-300 font-mono">{row.productionOrder?.orderNo ?? row.productionOrderId}</td>
                          <td className="px-2 py-2 font-mono text-slate-300">{row.reservation?.reservationNo ?? '-'}</td>
                          <td className="px-2 py-2 text-white font-medium truncate">{row.inventoryItem ? `${row.inventoryItem.code} · ${row.inventoryItem.name}` : row.inventoryItemId}</td>
                          <td className="px-2 py-2 text-slate-300 font-mono text-xs truncate">{[row.warehouse?.code, row.zone?.code, row.slotId, row.level ? `L${row.level}` : undefined].filter(Boolean).join('/') || '-'}</td>
                          <td className={Number(row.quantity) < 0 ? 'px-2 py-2 font-mono tabular-nums text-amber-300 font-semibold' : 'px-2 py-2 font-mono tabular-nums text-emerald-300 font-semibold'}>{number(row.quantity)}</td>
                          <td className="px-2 py-2 text-slate-300">{row.createdBy ?? '-'}</td>
                          <td className="px-2 py-2 text-slate-400 truncate">{row.remark ?? '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <DataTablePagination page={page} pageSize={pageSize} total={rows.length} onPageChange={setPage} />
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}

function Logs({ rows }: { rows: ReturnType<typeof useProductionLogs>['data'] }) {
  const logs = rows ?? []
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [page, setPage] = useState(1)
  const [expandedModalOpen, setExpandedModalOpen] = useState(false)

  const filteredRows = useMemo(() => {
    return logs.filter((row) => {
      const matchSearch = !search || `${row.productionOrder.orderNo} ${row.productionOrder.title} ${row.message} ${row.workerId}`.toLowerCase().includes(search.toLowerCase())
      const matchType = !typeFilter || row.type === typeFilter
      return matchSearch && matchType
    })
  }, [logs, search, typeFilter])

  const pageSize = 14
  const pagedRows = filteredRows.slice((page - 1) * pageSize, page * pageSize)
  const todayRows = logs.filter((row) => sameDay(row.createdAt))
  const typeRows = Array.from(logs.reduce((map, row) => {
    map.set(row.type, (map.get(row.type) ?? 0) + 1)
    return map
  }, new Map<string, number>()).entries())
    .map(([id, value]) => ({ id, title: id, subtitle: 'Log type', value: formatQuantity(value, 0) }))

  const logTypes = Array.from(new Set(logs.map((log) => log.type)))

  useEffect(() => {
    setPage(1)
  }, [filteredRows.length, search, typeFilter])

  return (
    <div className="space-y-2 text-xs -mt-2">
      {/* Phase 1: KPI SECTION */}
      <div className="grid grid-cols-1 gap-1 md:grid-cols-2 xl:grid-cols-6">
        <EnterpriseKpiCard title="Tổng số nhật ký (Logs)" value={formatQuantity(logs.length, 0)} tone="blue" icon={<FileText size={15} />} />
        <EnterpriseKpiCard title="Hoạt động hôm nay" value={formatQuantity(todayRows.length, 0)} tone="emerald" icon={<Clock size={15} />} />
        <EnterpriseKpiCard title="Phân loại nhật ký" value={formatQuantity(typeRows.length, 0)} tone="cyan" icon={<Layers size={15} />} />
        <EnterpriseKpiCard title="Lệnh SX liên quan" value={formatQuantity(new Set(logs.map((l) => l.productionOrder.orderNo)).size, 0)} tone="purple" icon={<Factory size={15} />} />
        <EnterpriseKpiCard title="Công đoạn vận hành" value={formatQuantity(new Set(logs.map((l) => l.stage?.name).filter(Boolean)).size, 0)} tone="blue" icon={<Cpu size={15} />} />
        <EnterpriseKpiCard title="Trạng thái hệ thống" value="Live Streaming" tone="emerald" icon={<Activity size={15} />} />
      </div>

      {/* Phase 3: TOOLBAR */}
      <EnterprisePanel className="rounded-xl -mt-1">
        <div className="grid grid-cols-1 gap-1 xl:grid-cols-[180px_1fr_130px_120px]">
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value)
              setPage(1)
            }}
            className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:bg-[#08111f]"
          >
            <option value="">Tất cả loại Log</option>
            {logTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setPage(1)
            }}
            placeholder="Tìm theo mã MO, tiêu đề, nội dung ghi nhận, operator..."
            className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:bg-[#08111f]"
          />
          <button
            type="button"
            onClick={() => setPage(1)}
            className="h-9 self-end rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500"
          >
            Tìm kiếm
          </button>
          <button
            type="button"
            onClick={() => {
              setSearch('')
              setTypeFilter('')
              setPage(1)
            }}
            className="h-9 self-end rounded-lg border border-white/10 bg-white/[0.055] px-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
          >
            Làm mới
          </button>
        </div>
      </EnterprisePanel>

      <div className={`grid ${inventoryGridGap} xl:grid-cols-12`}>
        <div className="xl:col-span-9">
          <EnterprisePanel className="rounded-xl">
            <div className="mb-1 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-white">Nhật ký thực thi sản xuất (Machine / Production Logs)</h3>
                <span className="rounded-full bg-cyan-400/10 px-2 py-0.5 text-[10px] font-medium text-cyan-300 border border-cyan-400/20">
                  {filteredRows.length} nhật ký
                </span>
              </div>
              <button
                type="button"
                onClick={() => setExpandedModalOpen(true)}
                className="text-xs font-semibold text-cyan-300 hover:text-cyan-200 transition"
              >
                Xem tất cả
              </button>
            </div>

            <div className="h-[430px] overflow-auto scrollbar-none rounded-lg border border-white/10">
              <table className="w-full min-w-[900px] table-fixed text-sm border-collapse">
                <thead
                  className={`${inventoryTableHead} text-slate-300 border-b border-cyan-400/10 sticky top-0 z-10`}
                  style={{ backgroundColor: 'rgba(30, 41, 59, 1)' }}
                >
                  <tr>{['Timestamp','MO','Structure','Operation','Operator','Workshop','Status','Remarks'].map(x=><th className="px-2 py-2 text-left text-xs font-semibold text-slate-300" key={x}>{x}</th>)}</tr>
                </thead>
                <tbody>
                  {pagedRows.map((row) => (
                    <tr className={inventoryTableRow} key={row.id}>
                      <td className="px-2 py-1.5 font-mono text-slate-300 text-xs">{formatDateTime(row.createdAt)}</td>
                      <td className="px-2 py-1.5 font-semibold text-cyan-300 font-mono">{row.productionOrder.orderNo}</td>
                      <td className="px-2 py-1.5 text-white font-medium truncate">{row.productionOrder.title}</td>
                      <td className="px-2 py-1.5 text-slate-300 truncate">{row.stage?.name ?? row.type}</td>
                      <td className="px-2 py-1.5 text-slate-300 font-mono text-xs">{row.workerId ?? '-'}</td>
                      <td className="px-2 py-1.5 text-slate-300 text-xs">{row.stage?.name ?? '-'}</td>
                      <td className="px-2 py-1.5"><StatusChip status={row.type} /></td>
                      <td className="px-2 py-1.5 text-slate-400 text-xs truncate">{row.message}</td>
                    </tr>
                  ))}
                  {!pagedRows.length ? (
                    <tr>
                      <td colSpan={8} className="px-2 py-10">
                        <ModuleEmptyState icon={<FileText size={18} />} title="Chưa có nhật ký" description="Nhật ký sản xuất sẽ hiển thị khi có thao tác production." />
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
            <DataTablePagination page={page} pageSize={pageSize} total={filteredRows.length} onPageChange={setPage} />
          </EnterprisePanel>
        </div>

        <aside className="space-y-1 xl:col-span-3">
          <CockpitChartCard title="Hoạt động hôm nay" subtitle="Log count" heightClass={COCKPIT_HEIGHTS.CHART_SM}>
            <div className="space-y-2 text-xs text-slate-300">
              <Info k="Hôm nay" v={formatQuantity(todayRows.length, 0)} />
              <Info k="Tổng log" v={formatQuantity(logs.length, 0)} />
              <Info k="Operator" v="API chưa có user profile" />
            </div>
          </CockpitChartCard>
          <CockpitChartCard title="Theo loại" subtitle="Log type" heightClass={COCKPIT_HEIGHTS.CHART_SM}>
            <RankList rows={typeRows.slice(0, 5)} empty="Chưa có loại nhật ký" />
          </CockpitChartCard>
          <CockpitChartCard title="Gần đây" subtitle="Logs mới nhất" heightClass={COCKPIT_HEIGHTS.CHART_SM}>
            <RankList rows={logs.slice(0, 5).map((row) => ({ id: row.id, title: row.productionOrder.orderNo, subtitle: row.message, value: formatDateTime(row.createdAt) }))} empty="Chưa có nhật ký gần đây" />
          </CockpitChartCard>
        </aside>
      </div>

      {/* EXPANDED TABLE MODAL */}
      {expandedModalOpen
        ? createPortal(
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className="w-full max-w-7xl rounded-2xl border border-white/15 bg-[#08111f] p-5 shadow-2xl space-y-4 text-xs">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div>
                    <h2 className="text-base font-bold text-white">Toàn bộ nhật ký thực thi sản xuất (Machine Logs)</h2>
                    <p className="text-xs text-slate-400">Tổng cộng {filteredRows.length} dòng nhật ký vận hành</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setExpandedModalOpen(false)}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition"
                  >
                    Đóng
                  </button>
                </div>

                <div className="h-[640px] overflow-y-auto rounded-xl border border-white/10">
                  <table className="w-full min-w-[900px] text-xs table-fixed border-collapse">
                    <thead
                      className={`${inventoryTableHead} text-slate-300 border-b border-cyan-400/10 sticky top-0 z-10`}
                      style={{ backgroundColor: 'rgba(30, 41, 59, 1)' }}
                    >
                      <tr>{['Timestamp','MO','Structure','Operation','Operator','Workshop','Status','Remarks'].map(x=><th className="px-2 py-2 text-left font-semibold text-slate-300" key={x}>{x}</th>)}</tr>
                    </thead>
                    <tbody>
                      {filteredRows.map((row) => (
                        <tr className={inventoryTableRow} key={row.id}>
                          <td className="px-2 py-2 font-mono text-slate-300 text-xs">{formatDateTime(row.createdAt)}</td>
                          <td className="px-2 py-2 font-semibold text-cyan-300 font-mono">{row.productionOrder.orderNo}</td>
                          <td className="px-2 py-2 text-white font-medium truncate">{row.productionOrder.title}</td>
                          <td className="px-2 py-2 text-slate-300 truncate">{row.stage?.name ?? row.type}</td>
                          <td className="px-2 py-2 text-slate-300 font-mono">{row.workerId ?? '-'}</td>
                          <td className="px-2 py-2 text-slate-300">{row.stage?.name ?? '-'}</td>
                          <td className="px-2 py-2"><StatusChip status={row.type} /></td>
                          <td className="px-2 py-2 text-slate-400 truncate">{row.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <DataTablePagination page={page} pageSize={pageSize} total={filteredRows.length} onPageChange={setPage} />
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}

function OrderWorkspace({ order, onClose }: { order: ProductionOrder; onClose: () => void }) {
  const { data: latest = order } = useProductionOrder(order.id)
  const { data: requirements = [] } = useMaterialRequirements(order.id)
  const { data: reservationPreview } = useReservationPreview(order.id)
  const { data: orderReservations = [] } = useProductionReservations(order.id)
  const { data: instancesReadModel } = useProductionComponentInstances({ productionOrderId: order.id, limit: 200 }, Boolean(order.id))
  const componentInstances = instancesReadModel?.data ?? []
  const { data: slots = [] } = useYardSlots()
  const start = useStartProductionOrder()
  const releaseCanonical = useReleaseCanonicalProductionOrder()
  const createReservation = useCreateProductionReservation()
  const complete = useCompleteProductionStage()
  const stage = useStageComponentInstanceToYard()
  const [slotId, setSlotId] = useState('')
  const [selectedYardInstanceId, setSelectedYardInstanceId] = useState('')
  const [weight, setWeight] = useState('1')
  const [actionError, setActionError] = useState('')
  const [actionMessage, setActionMessage] = useState('')
  const activeStage = latest.stages?.find((item) => item.status === 'IN_PROGRESS' || item.status === 'READY')
  const allStagesCompleted = Boolean(latest.stages?.length) && latest.stages!.every((item) => item.status === 'COMPLETED')
  const canStageToYard = latest.status === 'COMPLETED' || allStagesCompleted
  const availableSlots = slots.filter((slot) => slot.status !== 'BLOCKED' && slot.currentStackLevel < slot.maxStackLevel)
  const targetSlot = availableSlots.find((slot) => slot.id === slotId)
  const instanceIds = new Set(componentInstances.map((instance) => instance.id))
  const stagedInstanceIds = new Set(
    slots
      .flatMap((slot) => slot.placements ?? [])
      .filter((placement) => placement.componentInstanceId && instanceIds.has(placement.componentInstanceId))
      .map((placement) => placement.componentInstanceId as string),
  )
  const yardEligibleInstances = componentInstances.filter(
    (instance) =>
      (instance.state === 'QC_PASSED' || instance.state === 'USE_AS_IS') &&
      !stagedInstanceIds.has(instance.id),
  )
  const selectedYardInstance = yardEligibleInstances.find((instance) => instance.id === selectedYardInstanceId)
  const stagedQuantity = stagedInstanceIds.size
  const remainingQuantity = yardEligibleInstances.length
  const stageInvalid = !slotId || !selectedYardInstance
  const materialReadiness = workOrderReadiness(latest)
  const orderIssueRows = latest.materialIssues ?? []
  const reservedQty = orderReservations.reduce((sum, row) => sum + row.lines.reduce((lineSum, line) => lineSum + Number(line.reservedQty ?? 0), 0), 0)
  const reservationIssuedQty = orderReservations.reduce((sum, row) => sum + row.lines.reduce((lineSum, line) => lineSum + Number(line.issuedQty ?? 0), 0), 0)
  const availableQty = reservationPreview?.totalAvailableQty ?? 0
  const instanceSummary = componentInstances.reduce(
    (summary, instance) => {
      if (instance.state === 'PLANNED') summary.planned += 1
      if (instance.state === 'IN_PRODUCTION') summary.running += 1
      if (instance.state === 'PRODUCED_WAITING_QC') summary.waitingQc += 1
      if (instance.state === 'QC_PASSED') summary.qcPassed += 1
      if (instance.state === 'QC_FAILED') summary.qcFailed += 1
      if (instance.executions?.some((execution) => execution.status === 'COMPLETED')) summary.operationsCompleted += 1
      return summary
    },
    { planned: 0, running: 0, waitingQc: 0, qcPassed: 0, qcFailed: 0, operationsCompleted: 0 },
  )
  const stageDisabledReason = !slotId
    ? 'Chọn slot còn tầng trống trước khi chuyển bãi.'
    : !selectedYardInstance
      ? 'Chọn ComponentInstance finished goods để chuyển bãi.'
      : ''
  const canonicalReleaseWorkOrders = latest.bom?.routingSteps?.map((step) => ({
    routingOperationId: step.id,
    productCode: latest.component?.code ?? latest.orderNo,
    quantity: Number(latest.quantity ?? 0),
    sequence: step.stepNo,
    plannedStart: latest.plannedStartAt ? new Date(latest.plannedStartAt).toISOString() : undefined,
    plannedEnd: latest.plannedEndAt ? new Date(latest.plannedEndAt).toISOString() : undefined,
  })) ?? []
  const canReleaseCanonicalOrder = latest.status === 'DRAFT' && Boolean(latest.componentRequirementId) && canonicalReleaseWorkOrders.length > 0

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
          <InventoryChartCard title="Physical Component Instances" note="Canonical instance execution progress">
            <div className="mb-3 grid gap-3 md:grid-cols-5">
              <InventoryKpi title="Planned" value={formatQuantity(instanceSummary.planned, 0)} note="Chờ sản xuất" tone="blue" />
              <InventoryKpi title="Running" value={formatQuantity(instanceSummary.running, 0)} note="Đang sản xuất" tone="cyan" />
              <InventoryKpi title="Waiting QC" value={formatQuantity(instanceSummary.waitingQc, 0)} note="Chờ kiểm tra" tone="amber" />
              <InventoryKpi title="QC Passed" value={formatQuantity(instanceSummary.qcPassed, 0)} note="Đủ điều kiện FG" tone="emerald" />
              <InventoryKpi title="QC Failed" value={formatQuantity(instanceSummary.qcFailed, 0)} note="Không nhập kho TP" tone="red" />
            </div>
            <ModuleDataGrid>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[920px] text-left text-xs">
                  <thead className={inventoryTableHead}>
                    <tr>{['Instance', 'Physical state', 'Operation', 'Execution', 'Started', 'Completed', 'QC readiness'].map((head) => <th key={head} className="px-3 py-2 text-left font-medium">{head}</th>)}</tr>
                  </thead>
                  <tbody>
                    {componentInstances.length ? componentInstances.slice(0, 12).map((instance) => {
                      const operation = currentInstanceOperation(instance)
                      const waitingQc = instance.state === 'PRODUCED_WAITING_QC'
                      const firstStartedExecution = instance.executions?.find((item) => item.startedAt)
                      const lastCompletedExecution = [...(instance.executions ?? [])].reverse().find((item) => item.completedAt)
                      return (
                        <tr key={instance.id} className={inventoryTableRow}>
                          <td className="px-3 py-3 font-mono text-cyan-300">{instance.instanceNo}</td>
                          <td className="px-3 py-3"><StatusChip status={instanceStateLabel(instance.state)} /></td>
                          <td className="px-3 py-3 text-slate-300">{operation.label}</td>
                          <td className="px-3 py-3"><StatusChip status={operation.status} /></td>
                          <td className="px-3 py-3 text-slate-400">{date(firstStartedExecution?.startedAt)}</td>
                          <td className="px-3 py-3 text-slate-400">{date(lastCompletedExecution?.completedAt)}</td>
                          <td className={`px-3 py-3 ${waitingQc ? 'text-amber-300' : instance.state === 'QC_PASSED' ? 'text-emerald-300' : 'text-slate-500'}`}>{waitingQc ? 'Sẵn sàng bàn giao QC' : instanceStateLabel(instance.state)}</td>
                        </tr>
                      )
                    }) : <tr><td colSpan={7} className="px-3 py-5 text-center text-slate-500">Chưa có ComponentInstance. Release Production Order canonical sẽ tạo instance vật lý theo số lượng PO.</td></tr>}
                  </tbody>
                </table>
              </div>
            </ModuleDataGrid>
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
            <table className="w-full min-w-[900px] text-left text-xs">
              <thead className="text-[10px] uppercase text-slate-500">
                <tr>{['Material','Required','On hand SX','Reserved','Available SX','Issued','Shortage','Unit'].map(x=><th className="pb-3" key={x}>{x}</th>)}</tr>
              </thead>
              <tbody>{requirements.map(row=><tr className="border-t border-slate-800" key={row.materialId}>
                <td className="py-3 text-cyan-300">{row.materialCode} · {row.materialName}</td>
                <td>{number(row.requiredQty)}</td>
                <td>{number(row.onHandQty ?? row.availableQty)}</td>
                <td>{number(row.reservedQty ?? 0)}</td>
                <td>{number(row.availableQty)}</td>
                <td>{number(row.issuedQty)}</td>
                <td className={row.shortageQty?'text-red-300':'text-emerald-300'}>{number(row.shortageQty)}</td>
                <td>{row.unit}</td>
              </tr>)}</tbody>
            </table>
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
              <Info k="Requirement" v={latest.componentRequirementId ?? '-'}/>
              <Info k="BOM" v={latest.bom?.bomNo??'-'}/>
              <Info k="Số lượng MO" v={number(latest.quantity)}/>
              <Info k="Physical instances" v={formatQuantity(componentInstances.length, 0)}/>
              <Info k="Đã nhập bãi" v={number(stagedQuantity)}/>
              <Info k="FG chờ Yard" v={number(remainingQuantity)}/>
              <Info k="Ưu tiên" v={latest.priority}/>
              <Info k="Bắt đầu" v={date(latest.plannedStartAt)}/>
              <Info k="Đến hạn" v={date(latest.plannedEndAt)}/>
            </div>
          </ProductionPanel>
          <ProductionPanel title="Thao tác thực thi">
            <div className="space-y-2">
              {canReleaseCanonicalOrder ? (
                <button
                  onClick={() => run(
                    () => releaseCanonical.mutateAsync({
                      id: latest.id,
                      payload: {
                        expectedVersion: latest.aggregateVersion ?? 1,
                        reason: 'Release from canonical Production UI',
                        workOrders: canonicalReleaseWorkOrders,
                      },
                    }),
                    'Đã phát hành PO và tạo ComponentInstance',
                  )}
                  disabled={releaseCanonical.isPending}
                  className="w-full rounded bg-blue-600 px-3 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Phát hành PO canonical
                </button>
              ) : null}
              {latest.status === 'DRAFT' && latest.componentRequirementId && !canonicalReleaseWorkOrders.length ? <p className="rounded border border-amber-900 bg-amber-950/30 p-2 text-xs text-amber-300">Chưa có routing/work order basis từ BOM materialized để phát hành PO.</p> : null}
              {latest.status !== 'IN_PROGRESS' && !canStageToYard && <button onClick={() => run(() => start.mutateAsync(latest.id), 'Đã bắt đầu sản xuất')} className="w-full rounded bg-cyan-600 px-3 py-2 text-xs font-semibold">Bắt đầu sản xuất</button>}
              {!componentInstances.length ? <p className="rounded border border-amber-900 bg-amber-950/30 p-2 text-xs text-amber-300">Chưa có instance vật lý. Release Production Order canonical sẽ tạo ComponentInstance theo quantity của PO.</p> : null}
              {latest.status === 'IN_PROGRESS' && activeStage && <button onClick={() => run(() => complete.mutateAsync(activeStage.id), `Đã hoàn tất ${activeStage.name}`)} className="w-full rounded bg-emerald-600 px-3 py-2 text-xs font-semibold">Hoàn tất bước: {activeStage.name}</button>}
              {canStageToYard && <p className="rounded border border-emerald-800 bg-emerald-950/30 p-2 text-xs text-emerald-300">Tất cả công đoạn đã hoàn tất. Có thể chuyển thành phẩm ra bãi.</p>}
              <p className="text-xs text-slate-400">Mỗi lần hoàn tất sẽ chuyển trạng thái cấu kiện sang công đoạn kế tiếp.</p>
            </div>
          </ProductionPanel>
          {canStageToYard && <ProductionPanel title="Chuyển thành phẩm ra bãi">
            <div className="space-y-2 text-xs">
              <EnterpriseFormGrid columns={1}>
                <EnterpriseField label="Vị trí bãi" required htmlFor="production-yard-slot">
                  <EnterpriseSelect id="production-yard-slot" value={slotId} onChange={(e)=>{ setSlotId(e.target.value); setActionError(''); setActionMessage('') }}>
                    <option value="">Chọn slot còn tầng trống</option>
                    {availableSlots.map(slot=><option key={slot.id} value={slot.id}>{slot.zone.code} / {slot.code} · tầng kế tiếp L{slot.currentStackLevel + 1}/{slot.maxStackLevel}</option>)}
                  </EnterpriseSelect>
                </EnterpriseField>
                <EnterpriseField label="ComponentInstance" required htmlFor="production-yard-instance">
                  <EnterpriseSelect id="production-yard-instance" value={selectedYardInstanceId} onChange={(e)=>{ setSelectedYardInstanceId(e.target.value); setActionError(''); setActionMessage('') }}>
                    <option value="">Chọn instance QC PASS</option>
                    {yardEligibleInstances.map((instance) => <option key={instance.id} value={instance.id}>{instance.instanceNo} · {instanceStateLabel(instance.state)}</option>)}
                  </EnterpriseSelect>
                </EnterpriseField>
                <EnterpriseField label="Khối lượng" htmlFor="production-yard-weight">
                  <EnterpriseNumberField id="production-yard-weight" value={weight} onFocus={(e)=>setWeight(formatQuantityInput(e.target.value))} onBlur={(e)=>setWeight(formatQuantity(e.target.value))} onChange={(e)=>setWeight(formatQuantityInput(e.target.value))} />
                </EnterpriseField>
              </EnterpriseFormGrid>
              {!availableSlots.length ? <p className="rounded border border-amber-900 bg-amber-950/30 p-2 text-amber-300">Bãi không còn slot có tầng trống.</p> : null}
              <div className="rounded border border-slate-800 bg-slate-950/70 p-2 text-slate-300">
                <div>Slot đích: <b className="text-cyan-300">{targetSlot ? `${targetSlot.zone.code}/${targetSlot.code}` : '--'}</b></div>
                <div className="mt-1">Tầng xếp tự động: <b className="text-cyan-300">L{targetSlot ? targetSlot.currentStackLevel + 1 : '--'}</b></div>
                <div className="mt-1">Instance: <b className={stageInvalid ? 'text-red-300' : 'text-emerald-300'}>{selectedYardInstance?.instanceNo ?? '--'}</b></div>
              </div>
              {stageDisabledReason ? <p className="rounded border border-amber-900 bg-amber-950/30 p-2 text-amber-300">{stageDisabledReason}</p> : null}
              {actionError ? <p className="rounded border border-red-900 bg-red-950/40 p-2 text-red-200">{actionError}</p> : null}
              {actionMessage ? <p className="rounded border border-emerald-900 bg-emerald-950/40 p-2 text-emerald-200">{actionMessage}</p> : null}
              <button type="button" onClick={() => selectedYardInstance ? run(() => stage.mutateAsync({ componentInstanceId: selectedYardInstance.id, slotId, weight: parseLocaleNumber(weight) || 0 }), 'Đã chuyển ComponentInstance ra bãi') : undefined} disabled={stageInvalid || stage.isPending} className={`${enterprisePrimaryButton} w-full bg-amber-600 hover:bg-amber-500`}>Chuyển instance ra bãi</button>
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

function ProductionAdvancedWorkspace() {
  const navigate = useNavigate()

  const operations = [
    {
      title: 'Điều độ & Máy móc (OEE)',
      path: '/production/machines',
      icon: Cpu,
      desc: 'Quản lý máy móc, trung tâm gia công (Work Centers), chỉ số utilization và OEE xưởng.',
      tone: 'text-cyan-300 border-cyan-500/20 bg-cyan-500/5',
    },
    {
      title: 'Kho sản xuất',
      path: '/production/warehouse',
      icon: Boxes,
      desc: 'Tồn kho vật tư sản xuất tại xưởng, theo dõi kiểm kê và cân bằng hạn mức.',
      tone: 'text-blue-300 border-blue-500/20 bg-blue-500/5',
    },
    {
      title: 'Giữ chỗ vật tư (Reservations)',
      path: '/production/reservations',
      icon: Archive,
      desc: 'Đặt giữ trước vật tư cho lệnh sản xuất trước khi chính thức phát hành cấp phát.',
      tone: 'text-amber-300 border-amber-500/20 bg-amber-500/5',
    },
    {
      title: 'Sổ vật tư sản xuất (Ledger)',
      path: '/production/material-ledger',
      icon: FileStack,
      desc: 'Nhật ký biến động nhập - xuất - cấp phát - hoàn trả vật tư sản xuất.',
      tone: 'text-purple-300 border-purple-500/20 bg-purple-500/5',
    },
    {
      title: 'Cấp phát vật tư (Issues)',
      path: '/production/material-issues',
      icon: ClipboardList,
      desc: 'Quản lý danh sách phiếu cấp phát vật tư trực tiếp cho các công đoạn sản xuất.',
      tone: 'text-emerald-300 border-emerald-500/20 bg-emerald-500/5',
    },
    {
      title: 'Tiêu hao vật tư (Consumptions)',
      path: '/production/consumptions',
      icon: Activity,
      desc: 'Theo dõi lượng vật tư thực tế tiêu hao so với định mức BOM của lệnh sản xuất.',
      tone: 'text-cyan-300 border-cyan-500/20 bg-cyan-500/5',
    },
    {
      title: 'Sự cố & Rework',
      path: '/production/incidents',
      icon: AlertTriangle,
      desc: 'Ghi nhận sự cố kỹ thuật, hư hỏng thiết bị và theo dõi lệnh sửa chữa/làm lại.',
      tone: 'text-red-300 border-red-500/20 bg-red-500/5',
    },
    {
      title: 'Nhật ký vận hành',
      path: '/production/logs',
      icon: Clock,
      desc: 'Tra cứu toàn bộ timeline lịch sử thao tác, sự kiện và biến động trong xưởng.',
      tone: 'text-slate-300 border-white/10 bg-white/[0.03]',
    },
    {
      title: 'Báo cáo nâng cao',
      path: '/production/reports',
      icon: BarChart3,
      desc: 'Báo cáo tổng hợp hiệu suất sản xuất, tiến độ WO và thống kê phân bổ vật tư.',
      tone: 'text-blue-300 border-blue-500/20 bg-blue-500/5',
    },
  ]

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Wrench className="text-cyan-400" size={18} />
          Nghiệp vụ nâng cao (Advanced Operations)
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          Khu vực tập trung các chức năng điều độ, quản lý vật tư chuyên sâu, theo dõi thiết bị OEE, nhật ký vận hành và báo cáo nâng cao.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {operations.map((op) => {
          const Icon = op.icon
          return (
            <div
              key={op.path}
              onClick={() => navigate(op.path)}
              className={`group flex cursor-pointer flex-col justify-between rounded-xl border p-4 transition hover:border-cyan-400/40 hover:bg-white/[0.06] ${op.tone}`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-semibold text-white">
                    <Icon size={16} />
                    <span>{op.title}</span>
                  </div>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{op.desc}</p>
              </div>
              <div className="mt-3 flex items-center justify-end text-xs font-semibold text-cyan-300 group-hover:text-cyan-200">
                <span>Truy cập nghiệp vụ →</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
