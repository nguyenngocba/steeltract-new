import { useEffect, useMemo, useState } from 'react'
import { ArrowLeftRight, Clock } from 'lucide-react'

import { EnterpriseModulePage } from '@/shared/runtime-tabs/EnterpriseModulePage'
import { CockpitKpiCard } from '../../../../shared/ui/cockpit'
import { ModuleEmptyState, ModuleLoadingState } from '../../../../shared/ui/modules'
import {
  InventoryChartCard,
  InventoryPagination,
  InventoryPanel,
  inventoryTableHead,
  inventoryTableRow,
} from '../../../inventory/components/InventoryVisuals'
import { useYardMovementsRuntime } from '../../../yard/hooks/queries/useYardRuntime'
import { componentsInput } from './ComponentsCockpitShared'
import { formatDateTime, formatQuantity } from '@/shared/utils/number-format'

export function ComponentsTransfersPage() {
  const { data: movements = [], isLoading } = useYardMovementsRuntime()
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)

  const rows = useMemo(() => movements
    .filter((movement) => movement.type === 'MOVE')
    .filter((movement) => {
      if (!query.trim()) return true
      return `${movement.itemCode} ${movement.fromSlot?.code ?? ''} ${movement.toSlot?.code ?? ''}`.toLowerCase().includes(query.toLowerCase())
    }), [movements, query])

  useEffect(() => {
    setPage(1)
  }, [query])

  const pageSize = 14
  const paginatedRows = rows.slice((page - 1) * pageSize, page * pageSize)
  const todayKey = new Date().toISOString().slice(0, 10)
  const todayRows = rows.filter((row) => String(row.createdAt ?? '').slice(0, 10) === todayKey)
  const recentRows = rows.slice(0, 5)
  const latestMovementAt = recentRows[0]?.createdAt ? formatDateTime(recentRows[0].createdAt) : 'Chưa có'

  return (
    <EnterpriseModulePage>
      <div className="w-full min-w-0 flex-1 space-y-1">
        <div className="grid grid-cols-1 gap-1 xl:grid-cols-4">
          <CockpitKpiCard title="Tổng lệnh chuyển" value={formatQuantity(rows.length, 0)} note="Movement type MOVE" state="normal" tone="cyan" className="!h-[92px] !p-3" />
          <CockpitKpiCard title="Hoàn thành" value={formatQuantity(rows.length, 0)} note="Theo movement đã ghi nhận" state="normal" tone="emerald" className="!h-[92px] !p-3" />
          <CockpitKpiCard title="Hôm nay" value={formatQuantity(todayRows.length, 0)} note="Phát sinh trong ngày" state="normal" tone="blue" className="!h-[92px] !p-3" />
          <CockpitKpiCard title="Gần nhất" value={latestMovementAt} note="Movement mới nhất" state="normal" tone="purple" className="!h-[92px] !p-3" />
        </div>

        <InventoryPanel className="rounded-xl">
          <div className="grid grid-cols-1 gap-1 xl:grid-cols-6">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm mã cấu kiện, nơi đi, nơi đến..."
            className={`${componentsInput} xl:col-span-6`}
          />
          </div>
        </InventoryPanel>

        <div className="grid grid-cols-1 gap-1 xl:grid-cols-12">
          <div className="xl:col-span-9">
            <InventoryPanel
              title={<h3 className="text-sm font-bold uppercase tracking-[0.14em] text-white">{`Danh sách lệnh chuyển cấu kiện (${rows.length})`}</h3>}
              className="h-[520px]"
            >
              <div className="rounded-lg border border-white/10 overflow-hidden h-[430px]">
                <table className="w-full min-w-[1050px] table-fixed text-sm">
                  <thead className={inventoryTableHead}>
                    <tr>
                      {['Thời gian', 'Cấu kiện', 'Nơi đi', 'Nơi đến', 'Trạng thái', 'Ghi chú'].map((heading) => (
                        <th key={heading} className="px-1.5 py-0.5 text-left font-medium">{heading}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={6} className="px-2 py-8">
                          <ModuleLoadingState label="Đang tải lệnh chuyển..." />
                        </td>
                      </tr>
                    ) : paginatedRows.length ? paginatedRows.map((row) => (
                      <tr key={row.id} className={inventoryTableRow}>
                        <td className="px-2 py-2">{formatDateTime(row.createdAt)}</td>
                        <td className="px-2 py-2 text-cyan-300">{row.itemCode}</td>
                        <td className="px-2 py-2">{row.fromSlot?.zone?.code ?? '-'} / {row.fromSlot?.code ?? '-'}</td>
                        <td className="px-2 py-2">{row.toSlot?.zone?.code ?? '-'} / {row.toSlot?.code ?? '-'}</td>
                        <td className="px-2 py-2 text-emerald-300">Hoàn thành</td>
                        <td className="px-2 py-2">{row.reason ?? '-'}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={6} className="px-2 py-10">
                          <ModuleEmptyState icon={<ArrowLeftRight size={18} />} title="Chưa có điều chuyển" description="Không tìm thấy lệnh điều chuyển cấu kiện phù hợp." />
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <InventoryPagination page={page} pageSize={pageSize} pageCount={Math.max(1, Math.ceil(rows.length / pageSize))} total={rows.length} onPageChange={setPage} />
            </InventoryPanel>
          </div>

          <div className="space-y-1 xl:col-span-3">
            <InventoryChartCard title="Điều chuyển hôm nay" className="h-[170px]">
              <div className="flex h-full flex-col justify-center gap-1 text-sm text-slate-300">
                <div className="text-3xl font-bold text-cyan-300">{formatQuantity(todayRows.length, 0)}</div>
                <div>Lệnh MOVE phát sinh trong ngày.</div>
              </div>
            </InventoryChartCard>
            <InventoryChartCard title="Theo trạng thái" className="h-[170px]">
              <div className="flex h-full flex-col justify-center gap-1 text-sm text-slate-300">
                <div className="text-3xl font-bold text-emerald-300">{formatQuantity(rows.length, 0)}</div>
                <div>Hoàn thành</div>
              </div>
            </InventoryChartCard>
            <InventoryChartCard title="Gần đây" className="h-[170px]">
              {recentRows.length ? recentRows.map((row) => (
                <div key={row.id} className="mb-1 flex justify-between gap-1 text-[12px] text-slate-300">
                  <span className="truncate text-cyan-300">{row.itemCode}</span>
                  <span className="shrink-0">{row.toSlot?.code ?? '-'}</span>
                </div>
              )) : (
                <ModuleEmptyState icon={<Clock size={18} />} title="Chưa có hoạt động" description="Chưa có lệnh điều chuyển gần đây." />
              )}
            </InventoryChartCard>
          </div>
        </div>
      </div>
    </EnterpriseModulePage>
  )
}
