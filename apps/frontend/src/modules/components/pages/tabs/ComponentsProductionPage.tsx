import { useEffect, useMemo, useState } from 'react'
import { Activity, AlertTriangle, CheckCircle2, Clock, Eye, Layers, Package, Settings, Truck, Wrench } from 'lucide-react'

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
import { useProductionOrders } from '../../hooks/queries/useComponents'
import { componentsInput, componentsMutedButton } from './ComponentsCockpitShared'
import { formatQuantity } from '@/shared/utils/number-format'

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

const date = (value?: string) => value ? new Date(value).toLocaleDateString('vi-VN') : '-'

export function ComponentsProductionPage() {
  const { data: productionOrders = [], isLoading } = useProductionOrders()
  const [query, setQuery] = useState('')
  const [searchDraft, setSearchDraft] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null)
  const [expandedModalOpen, setExpandedModalOpen] = useState(false)

  function applySearch() {
    setQuery(searchDraft)
    setPage(1)
  }

  function resetFilters() {
    setSearchDraft('')
    setQuery('')
    setStatus('')
    setPage(1)
  }

  const rows = useMemo(() => {
    return productionOrders.filter((order) => {
      if (status && order.status !== status) return false
      if (query && !`${order.orderNo} ${order.title}`.toLowerCase().includes(query.toLowerCase())) return false
      return true
    })
  }, [productionOrders, query, status])

  const completed = productionOrders.filter((order) => order.status === 'COMPLETED').length
  const running = productionOrders.filter((order) => ['RELEASED', 'IN_PROGRESS'].includes(order.status)).length
  const waiting = productionOrders.filter((order) => ['DRAFT', 'PLANNED'].includes(order.status)).length
  const delayed = productionOrders.filter((order) => order.status === 'DELAYED').length
  const completionRate = productionOrders.length ? (completed / productionOrders.length) * 100 : 0
  const pageSize = 14
  const paginatedRows = rows.slice((page - 1) * pageSize, page * pageSize)
  const recentOrders = productionOrders.slice(0, 5)
  const statusRows = Object.entries(statusLabel)
    .map(([key, label]) => ({
      key,
      label,
      count: productionOrders.filter((order) => order.status === key).length,
    }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  return (
    <EnterpriseModulePage>
      <div className="w-full min-w-0 flex-1 space-y-1 -mt-2">
        {/* Phase 1: KPI Cards */}
        <div className="grid grid-cols-1 gap-1 md:grid-cols-2 xl:grid-cols-6">
          <EnterpriseKpiCard
            title="Tổng lệnh SX"
            value={formatQuantity(productionOrders.length, 0)}
            tone="blue"
            icon={<Layers size={15} />}
            isLoading={isLoading}
          />
          <EnterpriseKpiCard
            title="Đang sản xuất"
            value={formatQuantity(running, 0)}
            tone="purple"
            icon={<Wrench size={15} />}
            isLoading={isLoading}
          />
          <EnterpriseKpiCard
            title="Chờ sản xuất"
            value={formatQuantity(waiting, 0)}
            tone="amber"
            icon={<Clock size={15} />}
            isLoading={isLoading}
          />
          <EnterpriseKpiCard
            title="Hoàn thành"
            value={formatQuantity(completed, 0)}
            tone="emerald"
            icon={<CheckCircle2 size={15} />}
            isLoading={isLoading}
          />
          <EnterpriseKpiCard
            title="Quá hạn"
            value={formatQuantity(delayed, 0)}
            tone="red"
            icon={<AlertTriangle size={15} />}
            isLoading={isLoading}
          />
          <EnterpriseKpiCard
            title="Tỷ lệ hoàn thành"
            value={`${formatQuantity(completionRate, 1)}%`}
            tone="cyan"
            icon={<Activity size={15} />}
            isLoading={isLoading}
          />
        </div>

        {/* Phase 3: Search & Refresh Toolbar (Golden Reference Match) */}
        <InventoryPanel className="rounded-xl -mt-1">
          <div className="grid grid-cols-1 gap-1 xl:grid-cols-[1fr_220px_130px_120px]">
            <input
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') applySearch()
              }}
              placeholder="Tìm theo mã lệnh, cấu kiện, dự án..."
              className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:bg-[#08111f]"
            />
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value)
                setPage(1)
              }}
              className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:bg-[#08111f]"
            >
              <option value="">Tất cả trạng thái</option>
              {Object.entries(statusLabel).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={applySearch}
              className="h-9 self-end rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500"
            >
              Tìm kiếm
            </button>
            <button
              type="button"
              onClick={resetFilters}
              className="h-9 self-end rounded-lg border border-white/10 bg-white/[0.055] px-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
            >
              Làm mới
            </button>
          </div>
        </InventoryPanel>

        {/* Phase 4: Production Orders Hero Table */}
        <div className="grid grid-cols-1 gap-1 xl:grid-cols-12 items-start">
          <div className="col-span-12 xl:col-span-9">
            <InventoryPanel className="rounded-xl">
              <div className="mb-1 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-white">Danh sách lệnh sản xuất</h3>
                  <span className="rounded-full bg-cyan-400/10 px-2 py-0.5 text-[10px] font-medium text-cyan-300 border border-cyan-400/20">
                    {rows.length} lệnh
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
                <table className="w-full min-w-[1100px] table-fixed text-sm">
                  <thead
                    className={`${inventoryTableHead} text-slate-300 border-b border-cyan-400/10 sticky top-0 z-10`}
                    style={{ backgroundColor: 'rgba(30, 41, 59, 1)' }}
                  >
                    <tr>
                      {['Mã lệnh SX', 'Tên cấu kiện', 'Xưởng', 'Số lượng', 'Công đoạn', 'Trạng thái', 'Ngày bắt đầu', 'Dự kiến HT', 'Bãi đích', 'Zone / Slot / Tầng'].map((heading) => (
                        <th key={heading} className="px-3 py-2 text-left text-xs font-semibold text-slate-300">{heading}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr><td colSpan={10} className="px-4 py-6 text-center"><ModuleLoadingState label="Đang tải lệnh sản xuất..." /></td></tr>
                    ) : paginatedRows.map((row) => (
                      <tr key={row.id} onClick={() => setSelectedOrder(row)} className={`cursor-pointer ${inventoryTableRow}`}>
                        <td className="truncate px-3 py-1.5 text-cyan-300 font-mono font-medium">{row.orderNo}</td>
                        <td className="truncate px-3 py-1.5 text-white font-medium">{row.title}</td>
                        <td className="truncate px-3 py-1.5 text-slate-300">{row.metadata?.workshop ?? '-'}</td>
                        <td className="px-3 py-1.5 font-mono tabular-nums text-cyan-300">{formatQuantity(row.quantity, 0)}</td>
                        <td className="truncate px-3 py-1.5 text-slate-300">{row.currentStageCode ?? 'Chờ phân công'}</td>
                        <td className="px-3 py-1.5">
                          <span className={`inline-flex rounded-lg border px-2 py-0.5 text-xs ${statusBadgeTone[row.status] ?? 'border-slate-400/20 bg-slate-400/10 text-slate-300'}`}>
                            {statusLabel[row.status] ?? row.status}
                          </span>
                        </td>
                        <td className="px-3 py-1.5 text-slate-300">{date(row.plannedStartAt)}</td>
                        <td className="px-3 py-1.5 text-slate-300">{date(row.plannedEndAt)}</td>
                        <td className="truncate px-3 py-1.5 text-slate-300">{row.metadata?.destinationYard ?? '-'}</td>
                        <td className="truncate px-3 py-1.5 text-slate-300">{[row.metadata?.destinationZone, row.metadata?.destinationSlot, row.metadata?.destinationLevel].filter(Boolean).join(' / ') || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!isLoading && !rows.length ? (
                <div className="p-3">
                  <ModuleEmptyState icon={<Settings size={18} />} title="Chưa có dữ liệu sản xuất" description="Các lệnh sản xuất cấu kiện sẽ hiển thị tại đây." />
                </div>
              ) : null}
              <InventoryPagination page={page} pageSize={pageSize} pageCount={Math.max(1, Math.ceil(rows.length / pageSize))} total={rows.length} onPageChange={setPage} containerClassName="border-t-0" />
            </InventoryPanel>
          </div>

          {/* Phase 2: Right Analytics Rail */}
          <div className="col-span-12 space-y-1 xl:col-span-3">
            <InventoryChartCard title="Tiến độ tổng thể" className="h-[170px]">
              <div className="text-[38px] font-bold leading-none text-cyan-300 font-mono tabular-nums">{formatQuantity(completionRate, 1)}%</div>
              <div className="mt-2 text-xs text-slate-400">Tỷ lệ lệnh SX hoàn thành</div>
            </InventoryChartCard>
            <InventoryChartCard title="Phân bố trạng thái" className="h-[170px]">
              <div className="space-y-1.5 text-xs text-slate-300">
                {statusRows.map((row) => (
                  <div key={row.key} className="flex items-center justify-between gap-2">
                    <span className="truncate">{row.label}</span>
                    <b className="font-mono text-cyan-300">{formatQuantity(row.count, 0)}</b>
                  </div>
                ))}
                {!statusRows.length ? <ModuleEmptyState icon={<Clock size={18} />} title="Chưa có dữ liệu trạng thái" description="Trạng thái lệnh sản xuất sẽ hiển thị khi có dữ liệu." /> : null}
              </div>
            </InventoryChartCard>
            <InventoryChartCard title="Hoạt động gần đây" className="h-[170px]">
              <div className="space-y-1 text-xs text-slate-300">
                {productionOrders.filter((order) => order.status === 'DELAYED').slice(0, 4).map((order) => (
                  <div key={order.id} className="truncate text-red-300 font-mono">{order.orderNo} - {order.title}</div>
                ))}
                {delayed === 0 ? recentOrders.map((order) => <div key={order.id} className="truncate font-mono">{order.orderNo} - {order.title}</div>) : null}
                {!productionOrders.length ? <ModuleEmptyState icon={<Clock size={18} />} title="Chưa có hoạt động gần đây" description="Lệnh sản xuất mới sẽ hiển thị tại đây." /> : null}
              </div>
            </InventoryChartCard>
          </div>
        </div>
      </div>

      {/* Phase 5: EXPANDED TABLE MODAL ("Xem tất cả" interaction matching Inventory Golden Reference) */}
      {expandedModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-7xl rounded-2xl border border-white/15 bg-[#08111f] p-5 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h2 className="text-base font-bold text-white">Toàn bộ danh sách lệnh sản xuất</h2>
                <p className="text-xs text-slate-400">Tổng cộng {rows.length} lệnh sản xuất trong hệ thống</p>
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
              <table className="w-full min-w-[1200px] text-xs table-fixed border-collapse">
                <thead
                  className={`${inventoryTableHead} text-slate-300 border-b border-cyan-400/10 sticky top-0 z-10`}
                  style={{ backgroundColor: 'rgba(30, 41, 59, 1)' }}
                >
                  <tr>
                    {['Mã lệnh SX', 'Tên cấu kiện', 'Xưởng', 'Số lượng', 'Công đoạn', 'Trạng thái', 'Ngày bắt đầu', 'Dự kiến HT', 'Bãi đích', 'Zone / Slot / Tầng'].map((heading) => (
                      <th key={heading} className="px-3 py-2 text-left font-semibold text-slate-300">{heading}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={row.id}
                      onClick={() => {
                        setSelectedOrder(row)
                        setExpandedModalOpen(false)
                      }}
                      className={`${inventoryTableRow} cursor-pointer`}
                    >
                      <td className="truncate px-3 py-2 text-cyan-300 font-mono font-medium">{row.orderNo}</td>
                      <td className="truncate px-3 py-2 text-white font-medium">{row.title}</td>
                      <td className="truncate px-3 py-2 text-slate-300">{row.metadata?.workshop ?? '-'}</td>
                      <td className="px-3 py-2 font-mono tabular-nums text-cyan-300">{formatQuantity(row.quantity, 0)}</td>
                      <td className="truncate px-3 py-2 text-slate-300">{row.currentStageCode ?? 'Chờ phân công'}</td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex rounded-lg border px-2 py-0.5 text-xs ${statusBadgeTone[row.status] ?? 'border-slate-400/20 bg-slate-400/10 text-slate-300'}`}>
                          {statusLabel[row.status] ?? row.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-300">{date(row.plannedStartAt)}</td>
                      <td className="px-3 py-2 text-slate-300">{date(row.plannedEndAt)}</td>
                      <td className="truncate px-3 py-2 text-slate-300">{row.metadata?.destinationYard ?? '-'}</td>
                      <td className="truncate px-3 py-2 text-slate-300">{[row.metadata?.destinationZone, row.metadata?.destinationSlot, row.metadata?.destinationLevel].filter(Boolean).join(' / ') || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <InventoryPagination
              page={page}
              pageSize={pageSize}
              pageCount={Math.max(1, Math.ceil(rows.length / pageSize))}
              total={rows.length}
              onPageChange={setPage}
              containerClassName="border-t-0"
            />
          </div>
        </div>
      ) : null}

      {/* Phase 6: Standardized Row Detail Drawer */}
      <ModuleDetailDrawer
        open={Boolean(selectedOrder)}
        title={selectedOrder ? `${selectedOrder.orderNo} · ${selectedOrder.title}` : ''}
        subtitle={selectedOrder ? `Trạng thái: ${statusLabel[selectedOrder.status] ?? selectedOrder.status}` : undefined}
        onClose={() => setSelectedOrder(null)}
      >
        {selectedOrder ? (
          <>
            <div className="grid grid-cols-1 gap-1 md:grid-cols-4">
              <CockpitKpiCard title="Số lượng" value={formatQuantity(selectedOrder.quantity ?? 0, 0)} state="normal" tone="blue" />
              <CockpitKpiCard title="Công đoạn hiện tại" value={selectedOrder.currentStageCode ?? 'Hoàn tất'} state="normal" tone="cyan" />
              <CockpitKpiCard title="Bắt đầu" value={date(selectedOrder.plannedStartAt)} state="normal" tone="emerald" />
              <CockpitKpiCard title="Dự kiến HT" value={date(selectedOrder.plannedEndAt)} state="normal" tone="amber" />
            </div>
            <InventoryChartCard title="Tiến độ công đoạn" className="mt-1 min-h-[260px]">
              <div className="grid gap-1 md:grid-cols-4">
                {(selectedOrder.stages ?? []).map((stage: any) => (
                  <div key={stage.id} className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
                    <div className="text-xs text-slate-500">Bước {stage.sequence}</div>
                    <div className="mt-1 text-sm text-slate-100">{stage.name}</div>
                    <div className="mt-2 text-xs text-cyan-300">{stage.status}</div>
                  </div>
                ))}
                {!(selectedOrder.stages ?? []).length ? <ModuleEmptyState icon={<Package size={18} />} title="Chưa có dữ liệu công đoạn" description="Lệnh chưa có dữ liệu stage chi tiết." /> : null}
              </div>
            </InventoryChartCard>
          </>
        ) : null}
      </ModuleDetailDrawer>
    </EnterpriseModulePage>
  )
}
