import { useMemo, useState } from 'react'

import { EnterpriseModulePage } from '../../../../shared/runtime-tabs/EnterpriseModulePage'
import { EnterpriseTabBar } from '../../../../shared/runtime-tabs/EnterpriseTabBar'
import { SectionHeader } from '../../../../shared/ui/enterprise'
import { componentsTabs } from '../../config/components-tabs'
import { useProductionOrders } from '../../hooks/queries/useComponents'
import { ComponentsFilterBar, ComponentsKpiCard, ComponentsPanel } from './ComponentsCockpitShared'

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
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null)

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

  return (
    <EnterpriseModulePage>
      <SectionHeader title="Cấu kiện > Sản xuất (Lệnh SX)" description="Theo dõi lệnh sản xuất cấu kiện từ kho vật tư SX sang xưởng và vị trí bãi tập kết sau hoàn thành." />
      <EnterpriseTabBar tabs={componentsTabs} />

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-6">
          <ComponentsKpiCard title="Tổng lệnh SX" value={productionOrders.length.toLocaleString('vi-VN')} />
          <ComponentsKpiCard title="Đang sản xuất" value={running.toLocaleString('vi-VN')} />
          <ComponentsKpiCard title="Chờ sản xuất" value={waiting.toLocaleString('vi-VN')} />
          <ComponentsKpiCard title="Hoàn thành" value={completed.toLocaleString('vi-VN')} />
          <ComponentsKpiCard title="Quá hạn" value={delayed.toLocaleString('vi-VN')} />
          <ComponentsKpiCard title="Tỷ lệ hoàn thành" value={`${completionRate.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}%`} sub="đồng bộ realtime" />
        </div>

        <ComponentsFilterBar>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm theo mã lệnh, cấu kiện, dự án..." className="h-10 rounded-lg border border-slate-700 bg-[#050d18] px-3 text-sm text-slate-100 xl:col-span-4" />
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-10 rounded-lg border border-slate-700 bg-[#050d18] px-3 text-sm text-slate-100 xl:col-span-2">
            <option value="">Tất cả trạng thái</option>
            {Object.entries(statusLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <button onClick={() => { setQuery(''); setStatus('') }} className="h-10 rounded-lg border border-slate-700 bg-[#050d18] px-3 text-sm text-slate-200 xl:col-span-2">Làm mới</button>
        </ComponentsFilterBar>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <div className="xl:col-span-9">
            <ComponentsPanel title={`Danh sách lệnh sản xuất (${rows.length})`}>
              <div className="overflow-auto">
                <table className="w-full min-w-[1100px] text-sm">
                  <thead className="text-xs uppercase text-slate-400">
                    <tr>
                      {['Mã lệnh SX', 'Tên cấu kiện', 'Xưởng', 'Số lượng', 'Công đoạn', 'Trạng thái', 'Ngày bắt đầu', 'Dự kiến HT', 'Bãi đích', 'Zone / Slot / Tầng'].map((heading) => (
                        <th key={heading} className="px-2 py-2 text-left font-medium">{heading}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr><td colSpan={10} className="px-2 py-6 text-center text-slate-400">Đang tải lệnh sản xuất...</td></tr>
                    ) : rows.map((row) => (
                      <tr key={row.id} onClick={() => setSelectedOrder(row)} className="cursor-pointer border-t border-slate-800/80 text-slate-200 hover:bg-slate-900/40">
                        <td className="px-2 py-2 text-cyan-300">{row.orderNo}</td>
                        <td className="px-2 py-2">{row.title}</td>
                        <td className="px-2 py-2">{row.metadata?.workshop ?? '-'}</td>
                        <td className="px-2 py-2">{row.quantity.toLocaleString('vi-VN')}</td>
                        <td className="px-2 py-2">{row.currentStageCode ?? 'Chờ phân công'}</td>
                        <td className="px-2 py-2">{statusLabel[row.status] ?? row.status}</td>
                        <td className="px-2 py-2">{date(row.plannedStartAt)}</td>
                        <td className="px-2 py-2">{date(row.plannedEndAt)}</td>
                        <td className="px-2 py-2">{row.metadata?.destinationYard ?? '-'}</td>
                        <td className="px-2 py-2">{[row.metadata?.destinationZone, row.metadata?.destinationSlot, row.metadata?.destinationLevel].filter(Boolean).join(' / ') || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 text-xs text-slate-400">Hiển thị 1 - {rows.length} của {rows.length} kết quả</div>
            </ComponentsPanel>
          </div>
          <div className="space-y-4 xl:col-span-3">
            <ComponentsPanel title="Tiến độ sản xuất tổng thể">
              <div className="text-4xl font-semibold text-white">{completionRate.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}%</div>
              <div className="mt-1 text-sm text-slate-400">Hoàn thành</div>
            </ComponentsPanel>
            <ComponentsPanel title="Luồng sau sản xuất">
              <div className="space-y-2 text-sm text-slate-300">
                <div>Kho vật tư SX → Xưởng gia công</div>
                <div>QC nội bộ → Kho cấu kiện</div>
                <div>Hoàn thành → Bãi tập kết / slot / tầng</div>
              </div>
            </ComponentsPanel>
            <ComponentsPanel title="Lệnh SX quá hạn" action="Xem tất cả">
              <div className="space-y-2 text-sm text-slate-300">
                {productionOrders.filter((order) => order.status === 'DELAYED').slice(0, 4).map((order) => (
                  <div key={order.id}>{order.orderNo} - {order.title}</div>
                ))}
                {delayed === 0 ? <div className="text-slate-400">Không có lệnh quá hạn.</div> : null}
              </div>
            </ComponentsPanel>
          </div>
        </div>
      </div>

      {selectedOrder ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-4xl rounded-xl border border-slate-700 bg-[#071323] p-5">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.16em] text-cyan-400">Lệnh sản xuất cấu kiện</div>
                <h3 className="mt-1 text-xl font-semibold text-white">{selectedOrder.orderNo} · {selectedOrder.title}</h3>
                <p className="mt-1 text-sm text-slate-400">Trạng thái: {statusLabel[selectedOrder.status] ?? selectedOrder.status}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="rounded border border-slate-700 px-3 py-1 text-sm text-slate-300">Đóng</button>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <ComponentsKpiCard title="Số lượng" value={selectedOrder.quantity?.toLocaleString('vi-VN') ?? '0'} />
              <ComponentsKpiCard title="Công đoạn hiện tại" value={selectedOrder.currentStageCode ?? 'Hoàn tất'} />
              <ComponentsKpiCard title="Bắt đầu" value={date(selectedOrder.plannedStartAt)} />
              <ComponentsKpiCard title="Dự kiến HT" value={date(selectedOrder.plannedEndAt)} />
            </div>
            <div className="mt-4 rounded border border-slate-800 bg-[#050d18] p-4">
              <div className="mb-3 text-sm font-semibold text-white">Tiến độ công đoạn</div>
              <div className="grid gap-2 md:grid-cols-4">
                {(selectedOrder.stages ?? []).map((stage: any) => (
                  <div key={stage.id} className="rounded border border-slate-800 p-3">
                    <div className="text-xs text-slate-500">Bước {stage.sequence}</div>
                    <div className="mt-1 text-sm text-slate-100">{stage.name}</div>
                    <div className="mt-2 text-xs text-cyan-300">{stage.status}</div>
                  </div>
                ))}
                {!(selectedOrder.stages ?? []).length ? <p className="text-sm text-slate-400">Lệnh chưa có dữ liệu stage chi tiết.</p> : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </EnterpriseModulePage>
  )
}
