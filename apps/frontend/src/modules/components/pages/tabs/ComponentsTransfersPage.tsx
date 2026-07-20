import { useEffect, useMemo, useState } from 'react'

import { ComponentsWorkspace } from '../../components/ComponentsWorkspace'
import { CockpitChartCard, CockpitKpiCard, CockpitTableShell, COCKPIT_HEIGHTS, DataTablePagination } from '../../../../shared/ui/cockpit'
import { ModuleEmptyState, ModuleFilterBar, ModuleLoadingState } from '../../../../shared/ui/modules'
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

  return (
    <ComponentsWorkspace>
      <div className="w-full min-w-0 flex-1 space-y-1">
        <div className="grid grid-cols-1 gap-1 xl:grid-cols-4">
          <CockpitKpiCard title="Tổng lệnh chuyển" value={formatQuantity(rows.length, 0)} state="normal" tone="cyan" />
          <CockpitKpiCard title="Hoàn thành" value={formatQuantity(rows.length, 0)} state="normal" tone="emerald" />
          <CockpitKpiCard title="Nguồn dữ liệu" value="YARD MOVE" state="normal" tone="blue" />
          <CockpitKpiCard title="Cập nhật" value="Tự động" note="5 giây/lần" state="normal" tone="purple" />
        </div>

        <ModuleFilterBar>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm mã cấu kiện, nơi đi, nơi đến..."
            className={`${componentsInput} xl:col-span-6`}
          />
        </ModuleFilterBar>

        <div className="grid grid-cols-1 gap-1 xl:grid-cols-12">
          <div className="xl:col-span-9">
            <CockpitChartCard title={`Danh sách lệnh chuyển cấu kiện (${rows.length})`} className={COCKPIT_HEIGHTS.TABLE_MD}>
              <CockpitTableShell className="h-full">
                <table className="w-full min-w-[1050px] table-fixed text-[13px]">
                  <thead className="border-b border-cyan-400/10 bg-transparent text-slate-300">
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
                      <tr key={row.id} className="border-t border-slate-800/80 text-slate-200 hover:bg-slate-900/40">
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
                          <ModuleEmptyState icon="↔" title="Chưa có điều chuyển" description="Không tìm thấy lệnh điều chuyển cấu kiện phù hợp." />
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </CockpitTableShell>
              <DataTablePagination page={page} pageSize={pageSize} total={rows.length} onPageChange={setPage} />
            </CockpitChartCard>
          </div>

          <div className="space-y-1 xl:col-span-3">
            <CockpitChartCard title="Điều chuyển hôm nay" className={COCKPIT_HEIGHTS.CHART_SM}>
              <div className="flex h-full flex-col justify-center gap-1 text-sm text-slate-300">
                <div className="text-3xl font-bold text-cyan-300">{formatQuantity(todayRows.length, 0)}</div>
                <div>Lệnh MOVE phát sinh trong ngày.</div>
              </div>
            </CockpitChartCard>
            <CockpitChartCard title="Theo trạng thái" className={COCKPIT_HEIGHTS.CHART_SM}>
              <div className="flex h-full flex-col justify-center gap-1 text-sm text-slate-300">
                <div className="text-3xl font-bold text-emerald-300">{formatQuantity(rows.length, 0)}</div>
                <div>Hoàn thành</div>
              </div>
            </CockpitChartCard>
            <CockpitChartCard title="Gần đây" className={COCKPIT_HEIGHTS.CHART_SM}>
              {recentRows.length ? recentRows.map((row) => (
                <div key={row.id} className="mb-1 flex justify-between gap-1 text-[12px] text-slate-300">
                  <span className="truncate text-cyan-300">{row.itemCode}</span>
                  <span className="shrink-0">{row.toSlot?.code ?? '-'}</span>
                </div>
              )) : (
                <ModuleEmptyState icon="🕒" title="Chưa có hoạt động" description="Chưa có lệnh điều chuyển gần đây." />
              )}
            </CockpitChartCard>
          </div>
        </div>
      </div>
    </ComponentsWorkspace>
  )
}
