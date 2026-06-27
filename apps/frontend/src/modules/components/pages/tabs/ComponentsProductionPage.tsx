import { useEffect, useMemo, useState } from 'react'
import { Clock, Package, Settings } from 'lucide-react'

import { EnterpriseModulePage } from '../../../../shared/runtime-tabs/EnterpriseModulePage'
import { ModuleDetailDrawer, ModuleEmptyState, ModuleFilterBar, ModuleLoadingState } from '../../../../shared/ui/modules'
import { CockpitChartCard, CockpitKpiCard, CockpitTableShell, COCKPIT_HEIGHTS, DataTablePagination } from '../../../../shared/ui/cockpit'
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

const date = (value?: string) => value ? new Date(value).toLocaleDateString('vi-VN') : '-'

export function ComponentsProductionPage() {
  const { data: productionOrders = [], isLoading } = useProductionOrders()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null)

  useEffect(() => {
    setPage(1)
  }, [query, status])

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

  return (
    <EnterpriseModulePage>
      <div className="w-full min-w-0 flex-1 space-y-1">
        <div className="grid grid-cols-1 gap-1 md:grid-cols-2 xl:grid-cols-6">
          <CockpitKpiCard title="Tổng lệnh SX" value={formatQuantity(productionOrders.length, 0)} note="Tất cả lệnh" tone="blue" state="normal" trendData={[1, 2, 3, 5, productionOrders.length]} />
          <CockpitKpiCard title="Đang sản xuất" value={formatQuantity(running, 0)} note="RELEASED / IN_PROGRESS" tone="cyan" state="normal" trendData={[1, 2, 2, 3, running]} />
          <CockpitKpiCard title="Chờ sản xuất" value={formatQuantity(waiting, 0)} note="DRAFT / PLANNED" tone="amber" state="normal" trendData={[2, 2, 3, 3, waiting]} />
          <CockpitKpiCard title="Hoàn thành" value={formatQuantity(completed, 0)} note="COMPLETED" tone="emerald" state="normal" trendData={[1, 2, 4, 5, completed]} />
          <CockpitKpiCard title="Quá hạn" value={formatQuantity(delayed, 0)} note="Cần xử lý" tone="red" state="normal" trendData={[0, 1, 1, 2, delayed]} />
          <CockpitKpiCard title="Tỷ lệ hoàn thành" value={`${formatQuantity(completionRate, 1)}%`} note="Đồng bộ realtime" tone="purple" state="normal" trendData={[20, 35, 48, 62, completionRate]} />
        </div>

        <ModuleFilterBar>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm theo mã lệnh, cấu kiện, dự án..." className={`${componentsInput} xl:col-span-4`} />
          <select value={status} onChange={(event) => setStatus(event.target.value)} className={`${componentsInput} xl:col-span-2`}>
            <option value="">Tất cả trạng thái</option>
            {Object.entries(statusLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <button onClick={() => { setQuery(''); setStatus('') }} className={`${componentsMutedButton} xl:col-span-2`}>Làm mới</button>
        </ModuleFilterBar>

        <div className="grid grid-cols-12 gap-1">
          <div className="col-span-12 xl:col-span-9">
            <CockpitChartCard title={`Danh sách lệnh sản xuất (${rows.length})`} className={COCKPIT_HEIGHTS.TABLE_MD}>
              <CockpitTableShell className="h-full">
                <table className="w-full min-w-[1100px] table-fixed text-[13px]">
                  <thead className="border-b border-cyan-400/10 bg-transparent text-slate-350">
                    <tr>
                      {['Mã lệnh SX', 'Tên cấu kiện', 'Xưởng', 'Số lượng', 'Công đoạn', 'Trạng thái', 'Ngày bắt đầu', 'Dự kiến HT', 'Bãi đích', 'Zone / Slot / Tầng'].map((heading) => (
                        <th key={heading} className="px-4 py-2.5 text-left text-xs font-semibold text-slate-300 border-b border-cyan-400/10">{heading}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr><td colSpan={10} className="px-4 py-6"><ModuleLoadingState label="Đang tải lệnh sản xuất..." /></td></tr>
                    ) : paginatedRows.map((row) => (
                      <tr key={row.id} onClick={() => setSelectedOrder(row)} className="cursor-pointer border-b border-white/[0.04] text-slate-200 transition hover:bg-cyan-400/[0.04]">
                        <td className="truncate px-4 py-2.5 text-cyan-300 font-mono">{row.orderNo}</td>
                        <td className="truncate px-4 py-2.5 text-white">{row.title}</td>
                        <td className="truncate px-4 py-2.5 text-slate-300">{row.metadata?.workshop ?? '-'}</td>
                        <td className="px-4 py-2.5 font-mono tabular-nums text-cyan-300">{formatQuantity(row.quantity, 0)}</td>
                        <td className="truncate px-4 py-2.5 text-slate-300">{row.currentStageCode ?? 'Chờ phân công'}</td>
                        <td className="truncate px-4 py-2.5 text-slate-300">{statusLabel[row.status] ?? row.status}</td>
                        <td className="px-4 py-2.5 text-slate-300">{date(row.plannedStartAt)}</td>
                        <td className="px-4 py-2.5 text-slate-300">{date(row.plannedEndAt)}</td>
                        <td className="truncate px-4 py-2.5 text-slate-300">{row.metadata?.destinationYard ?? '-'}</td>
                        <td className="truncate px-4 py-2.5 text-slate-300">{[row.metadata?.destinationZone, row.metadata?.destinationSlot, row.metadata?.destinationLevel].filter(Boolean).join(' / ') || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CockpitTableShell>
              {!isLoading && !rows.length ? (
                <div className="p-3">
                  <ModuleEmptyState icon={<Settings size={18} />} title="Chưa có dữ liệu sản xuất" description="Các lệnh sản xuất cấu kiện sẽ hiển thị tại đây." />
                </div>
              ) : null}
            </CockpitChartCard>
            <DataTablePagination page={page} pageSize={pageSize} total={rows.length} onPageChange={setPage} />
          </div>

          <div className="col-span-12 space-y-1 xl:col-span-3">
            <CockpitChartCard title="Tiến độ" className={COCKPIT_HEIGHTS.CHART_SM}>
              <div className="text-[38px] font-bold leading-none text-white tabular-nums">{formatQuantity(completionRate, 1)}%</div>
              <div className="mt-1 text-[11px] text-slate-400">Hoàn thành</div>
            </CockpitChartCard>
            <CockpitChartCard title="Theo dự án" className={COCKPIT_HEIGHTS.CHART_SM}>
              <div className="space-y-1 text-xs text-slate-300">
                <div>Kho vật tư SX → Xưởng gia công</div>
                <div>QC nội bộ → Kho cấu kiện</div>
                <div>Hoàn thành → Bãi tập kết</div>
              </div>
            </CockpitChartCard>
            <CockpitChartCard title="Gần đây" className={COCKPIT_HEIGHTS.CHART_SM}>
              <div className="space-y-1 text-xs text-slate-300">
                {productionOrders.filter((order) => order.status === 'DELAYED').slice(0, 4).map((order) => (
                  <div key={order.id} className="truncate text-red-300">{order.orderNo} - {order.title}</div>
                ))}
                {delayed === 0 ? recentOrders.map((order) => <div key={order.id} className="truncate">{order.orderNo} - {order.title}</div>) : null}
                {!productionOrders.length ? <ModuleEmptyState icon={<Clock size={18} />} title="Chưa có hoạt động gần đây" description="Lệnh sản xuất mới sẽ hiển thị tại đây." /> : null}
              </div>
            </CockpitChartCard>
          </div>
        </div>
      </div>

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
            <CockpitChartCard title="Tiến độ công đoạn" className={`${COCKPIT_HEIGHTS.CHART_LG} mt-1`}>
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
            </CockpitChartCard>
          </>
        ) : null}
      </ModuleDetailDrawer>
    </EnterpriseModulePage>
  )
}
