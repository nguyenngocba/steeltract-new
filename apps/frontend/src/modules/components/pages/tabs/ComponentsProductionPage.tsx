import { useMemo, useState } from 'react'
import { Activity, AlertTriangle, CheckCircle2, Clock, Eye, Layers, Package, Search, Settings, Wrench } from 'lucide-react'

import { EnterpriseModulePage } from '@/shared/runtime-tabs/EnterpriseModulePage'
import { ModuleDetailDrawer, ModuleEmptyState, ModuleLoadingState } from '../../../../shared/ui/modules'
import { CockpitKpiCard, EnterpriseKpiCard } from '../../../../shared/ui/cockpit'
import {
  InventoryChartCard,
  InventoryPagination,
  InventoryPanel,
  inventoryTableHead,
  inventoryTableRow,
} from '../../../inventory/components/InventoryVisuals'
import { useComponentsProductionWorkspace } from '../../hooks/queries/useComponents'
import { formatQuantity } from '@/shared/utils/number-format'
import type { ProductionOrder, ProductionOrderCanonicalRead } from '../../../production/api/production.api'

const statusLabel: Record<string, string> = {
  DRAFT: 'Nháp',
  PLANNED: 'Chờ sản xuất',
  RELEASED: 'Đã phát hành',
  IN_PROGRESS: 'Đang sản xuất',
  DELAYED: 'Quá hạn',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
}

const statusBadgeTone: Record<string, string> = {
  DRAFT: 'border-slate-400/20 bg-slate-400/10 text-slate-300',
  PLANNED: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
  RELEASED: 'border-blue-400/30 bg-blue-400/10 text-blue-300',
  IN_PROGRESS: 'border-cyan-400/30 bg-cyan-400/10 text-cyan-300',
  DELAYED: 'border-red-400/30 bg-red-400/10 text-red-300',
  COMPLETED: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
  CANCELLED: 'border-slate-500/20 bg-slate-500/10 text-slate-400',
}

const detailTabs = [
  { key: 'overview', label: 'Tổng quan' },
  { key: 'materials', label: 'Vật tư' },
  { key: 'instances', label: 'Instance' },
  { key: 'execution', label: 'Thực thi' },
  { key: 'qc', label: 'QC' },
  { key: 'history', label: 'Lịch sử' },
] as const

type DetailTab = (typeof detailTabs)[number]['key']

const date = (value?: string | null) => value ? new Date(value).toLocaleDateString('vi-VN') : '-'
const dateTime = (value?: string | null) => value ? new Date(value).toLocaleString('vi-VN') : '-'
const percent = (value?: number | null) => `${formatQuantity(Number(value ?? 0), 1)}%`

function orderCanonical(row: ProductionOrder): ProductionOrderCanonicalRead {
  return row.canonical ?? {
    productionOrder: {
      id: row.id,
      componentRequirementId: row.componentRequirementId ?? null,
      projectId: row.projectId ?? null,
      updatedAt: null,
    },
    project: null,
    requirement: null,
    componentDefinition: row.component
      ? {
          id: row.component.id,
          code: row.component.code,
          name: row.component.name,
          componentType: null,
          profile: null,
          lifecycleState: null,
        }
      : null,
    revision: null,
    bomDefinition: null,
    bom: row.bom
      ? {
          id: row.bom.id,
          bomNo: row.bom.bomNo,
          productCode: row.bom.productCode,
          version: row.bom.version,
          status: row.bom.status,
        }
      : null,
    plannedQuantity: Number(row.quantity ?? 0),
    allocatedQuantity: Number(row.quantity ?? 0),
    componentInstances: { total: 0, stateCounts: {}, rows: [] },
    execution: { assigned: 0, running: 0, completed: 0, cancelled: 0, rows: [] },
    qc: { passed: 0, failed: 0, approved: 0, rejected: 0, rows: [] },
    materialReadiness: row.cockpit?.materialReadiness ?? {
      hasBom: Boolean(row.bom),
      requiredQty: 0,
      issuedQty: 0,
      remainingQty: 0,
      readinessPercent: 0,
      label: row.bom ? 'Chưa cấp vật tư' : 'Thiếu BOM',
    },
    material: { reservations: [], issues: row.materialIssues ?? [] },
    updatedAt: null,
  }
}

function orderTitle(row: ProductionOrder) {
  const canonical = orderCanonical(row)
  const component = canonical.componentDefinition
  return component ? `${component.code} - ${component.name}` : row.title
}

function projectTitle(canonical: ProductionOrderCanonicalRead) {
  if (!canonical.project) return '-'
  return `${canonical.project.code} - ${canonical.project.name}`
}

function qcSummary(canonical: ProductionOrderCanonicalRead) {
  const total = canonical.qc.passed + canonical.qc.failed + canonical.qc.approved + canonical.qc.rejected
  if (!total) return 'Chưa QC'
  const passed = canonical.qc.passed + canonical.qc.approved
  return `${formatQuantity(passed, 0)} đạt / ${formatQuantity(total, 0)} kiểm`
}

function executionSummary(canonical: ProductionOrderCanonicalRead) {
  const total = canonical.execution.assigned + canonical.execution.running + canonical.execution.completed + canonical.execution.cancelled
  if (!total) return 'Chưa phân công'
  return `${formatQuantity(canonical.execution.completed, 0)}/${formatQuantity(total, 0)} hoàn tất`
}

function TableEmptyRows({ count, colSpan }: { count: number; colSpan: number }) {
  if (count <= 0) return null
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <tr key={`empty-${index}`} className="h-9 border-t border-cyan-300/5">
          <td colSpan={colSpan} className="px-3 py-1.5 text-slate-700">.</td>
        </tr>
      ))}
    </>
  )
}

export function ComponentsProductionPage() {
  const [query, setQuery] = useState('')
  const [searchDraft, setSearchDraft] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [selectedOrder, setSelectedOrder] = useState<ProductionOrder | null>(null)
  const [activeTab, setActiveTab] = useState<DetailTab>('overview')
  const [expandedModalOpen, setExpandedModalOpen] = useState(false)
  const pageSize = 14

  const { data: readModel, isLoading, isError, refetch } = useComponentsProductionWorkspace({
    search: query || undefined,
    status: status || undefined,
    page,
    limit: pageSize,
  })

  const rows = readModel?.data ?? []
  const meta = readModel?.meta ?? { page, limit: pageSize, total: 0, totalPages: 1 }
  const summary = readModel?.summary
  const delayedOrders = readModel?.orderAnalytics.upcomingDelayed ?? []
  const shortageOrders = readModel?.orderAnalytics.topShortage ?? []
  const readinessSegments = readModel?.orderAnalytics.readinessSegments ?? []
  const selectedCanonical = selectedOrder ? orderCanonical(selectedOrder) : null

  const statusRows = useMemo(
    () => [
      { key: 'PLANNED', label: 'Chờ sản xuất', count: summary?.planned ?? 0 },
      { key: 'RELEASED', label: 'Đã phát hành', count: summary?.released ?? 0 },
      { key: 'IN_PROGRESS', label: 'Đang sản xuất', count: summary?.inProgress ?? 0 },
      { key: 'COMPLETED', label: 'Hoàn thành', count: summary?.completed ?? 0 },
      { key: 'DELAYED', label: 'Quá hạn', count: summary?.delayed ?? 0 },
    ].filter((item) => item.count > 0),
    [summary],
  )

  function applySearch() {
    setQuery(searchDraft.trim())
    setPage(1)
  }

  function resetFilters() {
    setSearchDraft('')
    setQuery('')
    setStatus('')
    setPage(1)
  }

  function openDetail(row: ProductionOrder) {
    setSelectedOrder(row)
    setActiveTab('overview')
  }

  return (
    <EnterpriseModulePage>
      <div className="w-full min-w-0 flex-1 space-y-1 -mt-2">
        <div className="grid grid-cols-1 gap-1 md:grid-cols-2 xl:grid-cols-6">
          <EnterpriseKpiCard title="Tổng lệnh SX" value={formatQuantity(summary?.total ?? 0, 0)} tone="blue" icon={<Layers size={15} />} isLoading={isLoading} />
          <EnterpriseKpiCard title="Đang sản xuất" value={formatQuantity(summary?.inProgress ?? 0, 0)} tone="purple" icon={<Wrench size={15} />} isLoading={isLoading} />
          <EnterpriseKpiCard title="Hoàn thành" value={formatQuantity(summary?.completed ?? 0, 0)} tone="emerald" icon={<CheckCircle2 size={15} />} isLoading={isLoading} />
          <EnterpriseKpiCard title="Physical instances" value={formatQuantity(summary?.componentInstances ?? 0, 0)} tone="cyan" icon={<Package size={15} />} isLoading={isLoading} />
          <EnterpriseKpiCard title="Chờ QC" value={formatQuantity(summary?.waitingQc ?? 0, 0)} tone="amber" icon={<Clock size={15} />} isLoading={isLoading} />
          <EnterpriseKpiCard title="Thiếu vật tư" value={formatQuantity(summary?.waitingMaterial ?? 0, 0)} tone="red" icon={<AlertTriangle size={15} />} isLoading={isLoading} />
        </div>

        <InventoryPanel className="rounded-xl -mt-1">
          <div className="grid grid-cols-1 gap-1 xl:grid-cols-[1fr_220px_130px_120px]">
            <div className="relative">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                value={searchDraft}
                onChange={(event) => setSearchDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') applySearch()
                }}
                placeholder="Tìm mã lệnh, cấu kiện, dự án..."
                className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 pl-9 pr-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:bg-[#08111f]"
              />
            </div>
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value)
                setPage(1)
              }}
              className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:bg-[#08111f]"
            >
              <option value="">Tất cả trạng thái</option>
              {Object.entries(statusLabel).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <button type="button" onClick={applySearch} className="h-9 rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500">
              Tìm kiếm
            </button>
            <button type="button" onClick={resetFilters} className="h-9 rounded-lg border border-white/10 bg-white/[0.055] px-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10">
              Làm mới
            </button>
          </div>
        </InventoryPanel>

        <div className="grid grid-cols-1 gap-1 xl:grid-cols-12 items-start">
          <div className="col-span-12 xl:col-span-9">
            <InventoryPanel className="rounded-xl">
              <div className="mb-1 flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <h3 className="truncate text-xs font-bold uppercase tracking-[0.12em] text-white">Lệnh sản xuất theo requirement</h3>
                  <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2 py-0.5 text-[10px] font-medium text-cyan-300">
                    {formatQuantity(meta.total, 0)} lệnh
                  </span>
                </div>
                <button type="button" onClick={() => setExpandedModalOpen(true)} className="shrink-0 text-xs font-semibold text-cyan-300 transition hover:text-cyan-200">
                  Xem tất cả
                </button>
              </div>

              <div className="h-[430px] overflow-auto scrollbar-none rounded-lg border border-white/10">
                <table className="w-full min-w-[1180px] table-fixed text-sm">
                  <thead className={`${inventoryTableHead} sticky top-0 z-10 border-b border-cyan-400/10 text-slate-300`} style={{ backgroundColor: 'rgba(30, 41, 59, 1)' }}>
                    <tr>
                      {['Lệnh SX', 'Cấu kiện', 'Công trình', 'SL kế hoạch', 'Physical instances', 'QC', 'Vật tư', 'Trạng thái', 'Thao tác'].map((heading) => (
                        <th key={heading} className="px-3 py-2 text-left text-xs font-semibold text-slate-300">{heading}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr><td colSpan={9} className="px-4 py-6 text-center"><ModuleLoadingState label="Đang tải production read-model..." /></td></tr>
                    ) : rows.map((row) => {
                      const canonical = orderCanonical(row)
                      return (
                        <tr key={row.id} onClick={() => openDetail(row)} className={`cursor-pointer ${inventoryTableRow}`}>
                          <td className="truncate px-3 py-1.5 text-cyan-300 font-mono font-medium">{row.orderNo}</td>
                          <td className="truncate px-3 py-1.5 text-white font-medium">{orderTitle(row)}</td>
                          <td className="truncate px-3 py-1.5 text-slate-300">{projectTitle(canonical)}</td>
                          <td className="px-3 py-1.5 font-mono tabular-nums text-cyan-300">{formatQuantity(canonical.plannedQuantity, 0)}</td>
                          <td className="px-3 py-1.5 font-mono tabular-nums text-slate-200">{formatQuantity(canonical.componentInstances.total, 0)}</td>
                          <td className="truncate px-3 py-1.5 text-slate-300">{qcSummary(canonical)}</td>
                          <td className="truncate px-3 py-1.5 text-slate-300">{canonical.materialReadiness.label} · {percent(canonical.materialReadiness.readinessPercent)}</td>
                          <td className="px-3 py-1.5">
                            <span className={`inline-flex rounded-lg border px-2 py-0.5 text-xs ${statusBadgeTone[row.status] ?? 'border-slate-400/20 bg-slate-400/10 text-slate-300'}`}>
                              {statusLabel[row.status] ?? row.status}
                            </span>
                          </td>
                          <td className="px-3 py-1.5">
                            <button type="button" onClick={(event) => { event.stopPropagation(); openDetail(row) }} className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-cyan-300/15 bg-white/[0.04] text-cyan-300 transition hover:bg-cyan-300/10">
                              <Eye size={14} />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                    {!isLoading ? <TableEmptyRows count={Math.max(0, pageSize - rows.length)} colSpan={9} /> : null}
                  </tbody>
                </table>
              </div>
              {!isLoading && !rows.length ? (
                <div className="p-3">
                  <ModuleEmptyState icon={<Settings size={18} />} title={isError ? 'Không tải được dữ liệu sản xuất' : 'Chưa có dữ liệu sản xuất'} description={isError ? 'Production read-model chưa phản hồi. Kiểm tra kết nối hoặc thử tải lại.' : 'Các lệnh sản xuất gắn với requirement sẽ hiển thị tại đây.'} action={isError ? <button type="button" onClick={() => refetch()} className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white">Thử lại</button> : undefined} />
                </div>
              ) : null}
              <InventoryPagination page={page} pageSize={pageSize} pageCount={Math.max(1, meta.totalPages)} total={meta.total} onPageChange={setPage} containerClassName="border-t-0" />
            </InventoryPanel>
          </div>

          <div className="col-span-12 space-y-1 xl:col-span-3">
            <InventoryChartCard title="Tiến độ tổng thể" className="h-[170px]">
              <div className="grid grid-cols-3 gap-1 text-center">
                <MetricBlock label="Chạy" value={readModel?.overview.progress.running ?? 0} tone="text-cyan-300" />
                <MetricBlock label="Chờ" value={readModel?.overview.progress.pending ?? 0} tone="text-amber-300" />
                <MetricBlock label="Xong" value={readModel?.overview.progress.completed ?? 0} tone="text-emerald-300" />
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-cyan-400" style={{ width: `${Math.min(100, ((summary?.completed ?? 0) / Math.max(1, summary?.total ?? 0)) * 100)}%` }} />
              </div>
            </InventoryChartCard>
            <InventoryChartCard title="Sẵn sàng vật tư" className="h-[170px]">
              <div className="space-y-1.5 text-xs text-slate-300">
                {readinessSegments.map((segment) => (
                  <div key={segment.label} className="grid grid-cols-[64px_1fr_36px] items-center gap-2">
                    <span className="truncate">{segment.label}</span>
                    <div className="h-2 rounded-full bg-white/10"><div className="h-full rounded-full bg-emerald-400" style={{ width: `${Math.min(100, segment.value * 18)}%` }} /></div>
                    <b className="text-right font-mono text-cyan-300">{formatQuantity(segment.value, 0)}</b>
                  </div>
                ))}
                {!readinessSegments.length ? <ModuleEmptyState icon={<Package size={18} />} title="Chưa có dữ liệu vật tư" description="Read-model chưa có nhóm sẵn sàng vật tư." /> : null}
              </div>
            </InventoryChartCard>
            <InventoryChartCard title="Cần chú ý" className="h-[170px]">
              <div className="space-y-1 text-xs text-slate-300">
                {shortageOrders.slice(0, 3).map((order) => <RailRow key={order.id} label={`${order.orderNo} - ${order.title}`} value={`${formatQuantity(order.value, 0)} thiếu`} tone="text-red-300" />)}
                {!shortageOrders.length ? delayedOrders.slice(0, 3).map((order) => <RailRow key={order.id} label={`${order.orderNo} - ${order.title}`} value={date(order.plannedEndAt)} tone="text-amber-300" />) : null}
                {!shortageOrders.length && !delayedOrders.length ? <ModuleEmptyState icon={<Clock size={18} />} title="Không có cảnh báo" description="Chưa có thiếu vật tư hoặc lệnh gần hạn trong read-model." /> : null}
              </div>
            </InventoryChartCard>
          </div>
        </div>
      </div>

      <ModuleDetailDrawer
        open={expandedModalOpen}
        title="Toàn bộ lệnh sản xuất"
        subtitle={`Nguồn: Production canonical read-model · ${formatQuantity(meta.total, 0)} lệnh`}
        onClose={() => setExpandedModalOpen(false)}
        placement="center"
        widthClass="w-[96vw] max-w-[1720px]"
        maxHeightClass="h-[88vh]"
      >
        <div className="h-[calc(88vh-150px)] overflow-auto rounded-xl border border-white/10">
          <table className="w-full min-w-[1500px] table-fixed text-xs">
            <thead className={`${inventoryTableHead} sticky top-0 z-10 border-b border-cyan-400/10 text-slate-300`} style={{ backgroundColor: 'rgba(30, 41, 59, 1)' }}>
              <tr>
                {['Order', 'Requirement', 'Project', 'Component', 'Revision', 'BOM', 'Planned Qty', 'Instances', 'Execution', 'QC', 'Material', 'Updated', 'Actions'].map((heading) => (
                  <th key={heading} className="px-3 py-2 text-left font-semibold text-slate-300">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const canonical = orderCanonical(row)
                return (
                  <tr key={row.id} onClick={() => { openDetail(row); setExpandedModalOpen(false) }} className={`${inventoryTableRow} cursor-pointer`}>
                    <td className="truncate px-3 py-2 font-mono text-cyan-300">{row.orderNo}</td>
                    <td className="truncate px-3 py-2 text-slate-300">{canonical.requirement?.requirementNo ?? '-'}</td>
                    <td className="truncate px-3 py-2 text-slate-300">{projectTitle(canonical)}</td>
                    <td className="truncate px-3 py-2 text-white">{orderTitle(row)}</td>
                    <td className="truncate px-3 py-2 text-slate-300">{canonical.revision?.revisionNo ?? '-'}</td>
                    <td className="truncate px-3 py-2 text-slate-300">{canonical.bom?.bomNo ?? canonical.bomDefinition?.state ?? '-'}</td>
                    <td className="px-3 py-2 font-mono text-cyan-300">{formatQuantity(canonical.plannedQuantity, 0)}</td>
                    <td className="px-3 py-2 font-mono text-slate-200">{formatQuantity(canonical.componentInstances.total, 0)}</td>
                    <td className="truncate px-3 py-2 text-slate-300">{executionSummary(canonical)}</td>
                    <td className="truncate px-3 py-2 text-slate-300">{qcSummary(canonical)}</td>
                    <td className="truncate px-3 py-2 text-slate-300">{canonical.materialReadiness.label}</td>
                    <td className="px-3 py-2 text-slate-300">{dateTime(canonical.updatedAt)}</td>
                    <td className="px-3 py-2 text-cyan-300">Chi tiết</td>
                  </tr>
                )
              })}
              <TableEmptyRows count={Math.max(0, pageSize - rows.length)} colSpan={13} />
            </tbody>
          </table>
        </div>
        <InventoryPagination page={page} pageSize={pageSize} pageCount={Math.max(1, meta.totalPages)} total={meta.total} onPageChange={setPage} containerClassName="border-t-0" />
      </ModuleDetailDrawer>

      <ModuleDetailDrawer
        open={Boolean(selectedOrder)}
        title={selectedOrder ? `${selectedOrder.orderNo} · ${orderTitle(selectedOrder)}` : ''}
        subtitle={selectedOrder && selectedCanonical ? `${projectTitle(selectedCanonical)} · ${statusLabel[selectedOrder.status] ?? selectedOrder.status}` : undefined}
        onClose={() => setSelectedOrder(null)}
        widthClass="w-screen md:w-[64vw] md:min-w-[860px] md:max-w-[1280px]"
        tabs={detailTabs.map((tab) => ({ id: tab.key, label: tab.label }))}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as DetailTab)}
      >
        {selectedOrder && selectedCanonical ? (
          <div className="space-y-3">
            <DetailTabPanel tab={activeTab} order={selectedOrder} canonical={selectedCanonical} />
          </div>
        ) : null}
      </ModuleDetailDrawer>
    </EnterpriseModulePage>
  )
}

function MetricBlock({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.035] p-2">
      <div className={`font-mono text-xl font-bold ${tone}`}>{formatQuantity(value, 0)}</div>
      <div className="mt-1 text-[10px] uppercase tracking-[0.08em] text-slate-500">{label}</div>
    </div>
  )
}

function RailRow({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/[0.035] px-2 py-1.5">
      <span className="min-w-0 truncate">{label}</span>
      <b className={`shrink-0 font-mono ${tone}`}>{value}</b>
    </div>
  )
}

function DetailTabPanel({ tab, order, canonical }: { tab: DetailTab; order: ProductionOrder; canonical: ProductionOrderCanonicalRead }) {
  if (tab === 'overview') {
    return (
      <div className="space-y-2">
        <div className="grid grid-cols-1 gap-1 md:grid-cols-4">
          <CockpitKpiCard title="SL kế hoạch" value={formatQuantity(canonical.plannedQuantity, 0)} state="normal" tone="blue" />
          <CockpitKpiCard title="Physical instances" value={formatQuantity(canonical.componentInstances.total, 0)} state="normal" tone="cyan" />
          <CockpitKpiCard title="Thực thi" value={executionSummary(canonical)} state="normal" tone="emerald" />
          <CockpitKpiCard title="Vật tư" value={percent(canonical.materialReadiness.readinessPercent)} state="normal" tone="amber" />
        </div>
        <InventoryChartCard title="Thông tin canonical" className="min-h-[220px]">
          <div className="grid gap-2 text-xs text-slate-300 md:grid-cols-2">
            <InfoLine label="Production Order" value={`${order.orderNo} · ${statusLabel[order.status] ?? order.status}`} />
            <InfoLine label="Requirement" value={canonical.requirement?.requirementNo ?? '-'} />
            <InfoLine label="Component Definition" value={canonical.componentDefinition ? `${canonical.componentDefinition.code} · ${canonical.componentDefinition.name}` : '-'} />
            <InfoLine label="Project" value={projectTitle(canonical)} />
            <InfoLine label="Revision" value={canonical.revision?.revisionNo ?? '-'} />
            <InfoLine label="BOM" value={canonical.bom?.bomNo ?? canonical.bomDefinition?.state ?? '-'} />
            <InfoLine label="Ngày bắt đầu" value={date(order.plannedStartAt)} />
            <InfoLine label="Dự kiến hoàn thành" value={date(order.plannedEndAt)} />
          </div>
        </InventoryChartCard>
      </div>
    )
  }

  if (tab === 'materials') {
    const lines = canonical.material.reservations.flatMap((reservation) =>
      reservation.lines.map((line) => ({ ...line, reservationNo: reservation.reservationNo, reservationStatus: reservation.status })),
    )
    return (
      <CanonicalTable
        title="Vật tư sản xuất"
        emptyTitle="Chưa có dữ liệu vật tư sản xuất"
        emptyDescription="Tab này chỉ hiển thị Reservation/Issue/Return từ production custody, không dùng MAIN stock."
        headers={['Reservation', 'Vật tư', 'Kho SX', 'Zone', 'Yêu cầu', 'Đã giữ', 'Đã cấp', 'Trả', 'Trạng thái']}
        rows={lines.map((line) => [
          line.reservationNo,
          `${line.inventoryItem.code} - ${line.inventoryItem.name}`,
          line.warehouse ? `${line.warehouse.code} - ${line.warehouse.name}` : '-',
          line.zone?.code ?? '-',
          formatQuantity(line.requiredQty, 2),
          formatQuantity(line.reservedQty, 2),
          formatQuantity(line.issuedQty, 2),
          formatQuantity(line.returnedQty, 2),
          line.status,
        ])}
      />
    )
  }

  if (tab === 'instances') {
    return (
      <CanonicalTable
        title="Physical ComponentInstances"
        emptyTitle="Chưa có physical instance"
        emptyDescription="Instance chỉ được tạo bởi luồng Production canonical, không suy luận từ quantity."
        headers={['Instance', 'State', 'Produced', 'QC Passed', 'Updated']}
        rows={canonical.componentInstances.rows.map((instance) => [
          instance.instanceNo ?? instance.id,
          instance.state,
          dateTime(instance.producedAt),
          dateTime(instance.qcPassedAt),
          dateTime(instance.updatedAt),
        ])}
      />
    )
  }

  if (tab === 'execution') {
    return (
      <CanonicalTable
        title="ComponentInstanceExecution"
        emptyTitle="Chưa có execution instance"
        emptyDescription="Chỉ hiển thị ASSIGNED/RUNNING/COMPLETED/CANCELLED từ ComponentInstanceExecution."
        headers={['Instance', 'Work Order', 'Execution', 'Status', 'Start', 'Complete']}
        rows={canonical.execution.rows.map((run) => [
          run.instanceNo,
          run.workOrder?.workOrderNo ?? '-',
          run.productionExecution?.state ?? '-',
          run.status,
          dateTime(run.startedAt),
          dateTime(run.completedAt),
        ])}
      />
    )
  }

  if (tab === 'qc') {
    const ncrRows = canonical.componentInstances.rows.flatMap((instance) =>
      instance.ncrs.map((ncr) => [
        instance.instanceNo ?? instance.id,
        ncr.ncrNo,
        ncr.status,
        ncr.disposition ?? '-',
        dateTime(ncr.updatedAt),
      ]),
    )
    return (
      <div className="space-y-2">
        <CanonicalTable
          title="QC Inspection"
          emptyTitle="Chưa có dữ liệu QC"
          emptyDescription="QC canonical phải gắn với ComponentInstance."
          headers={['Instance', 'Inspection', 'Status', 'Completed', 'Approved', 'Rejected']}
          rows={canonical.qc.rows.map((qc) => [qc.instanceNo, qc.inspectionNo, qc.status, dateTime(qc.completedAt), dateTime(qc.approvedAt), dateTime(qc.rejectedAt)])}
        />
        <CanonicalTable
          title="NCR / Disposition"
          emptyTitle="Chưa có NCR"
          emptyDescription="NCR sẽ hiển thị khi QC phát hiện lỗi trên physical instance."
          headers={['Instance', 'NCR', 'Status', 'Disposition', 'Updated']}
          rows={ncrRows}
        />
      </div>
    )
  }

  return (
    <CanonicalTable
      title="Lịch sử sản xuất"
      emptyTitle="Chưa có lịch sử authoritative"
      emptyDescription="History chỉ dùng production log/activity có nguồn authoritative."
      headers={['Thời gian', 'Loại', 'Nội dung']}
      rows={(order as ProductionOrder & { logs?: Array<{ id: string; createdAt?: string; type?: string; message?: string }> }).logs?.map((log) => [
        dateTime(log.createdAt),
        log.type ?? '-',
        log.message ?? '-',
      ]) ?? []}
    />
  )
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2">
      <div className="text-[10px] uppercase tracking-[0.1em] text-slate-500">{label}</div>
      <div className="mt-1 truncate font-medium text-slate-100">{value}</div>
    </div>
  )
}

function CanonicalTable({
  title,
  emptyTitle,
  emptyDescription,
  headers,
  rows,
}: {
  title: string
  emptyTitle: string
  emptyDescription: string
  headers: string[]
  rows: string[][]
}) {
  return (
    <InventoryChartCard title={title} className="min-h-[260px]">
      {rows.length ? (
        <div className="overflow-auto rounded-lg border border-white/10">
          <table className="w-full min-w-[760px] table-fixed text-xs">
            <thead className={`${inventoryTableHead} border-b border-cyan-400/10 text-slate-300`} style={{ backgroundColor: 'rgba(30, 41, 59, 1)' }}>
              <tr>
                {headers.map((header) => <th key={header} className="px-3 py-2 text-left font-semibold text-slate-300">{header}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={`${title}-${index}`} className={inventoryTableRow}>
                  {row.map((cell, cellIndex) => <td key={`${title}-${index}-${cellIndex}`} className="truncate px-3 py-2 text-slate-300">{cell}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <ModuleEmptyState icon={<Package size={18} />} title={emptyTitle} description={emptyDescription} />
      )}
    </InventoryChartCard>
  )
}
