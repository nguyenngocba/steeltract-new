import { useMemo, useState } from 'react'

import { ComponentsWorkspace } from '../../components/ComponentsWorkspace'
import { CockpitChartCard, CockpitKpiCard, CockpitTableShell, COCKPIT_HEIGHTS, DataTablePagination } from '../../../../shared/ui/cockpit'
import { ModuleEmptyState, ModuleFilterBar } from '../../../../shared/ui/modules'
import { componentsInput } from './ComponentsCockpitShared'

const qcRows = [
  ['QC-2506-1248', 'BEAM H450x200x10x16', 'LOT-0625-001', 'Kích thước', 'QC Kích thước', '29/06/2025', 'Hoàn thành', 'Đạt', 'Trần Minh B'],
  ['QC-2506-1247', 'PLATE 20mm', 'LOT-0625-002', 'Bề mặt', 'QC Bề mặt', '29/06/2025', 'Hoàn thành', 'Đạt', 'Nguyễn Văn A'],
  ['QC-2506-1246', 'COLUMN H300x300x10x15', 'LOT-0625-003', 'Kích thước', 'QC Kích thước', '29/06/2025', 'Đang xử lý', '—', 'Phạm Văn C'],
]

export function ComponentsInternalQcPage() {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const rows = useMemo(() => qcRows.filter((row) => {
    if (!query.trim()) return true
    return row.join(' ').toLowerCase().includes(query.toLowerCase())
  }), [query])
  const pageSize = 14
  const paginatedRows = rows.slice((page - 1) * pageSize, page * pageSize)
  const passedCount = rows.filter((row) => row[7] === 'Đạt').length
  const failedCount = rows.filter((row) => row[7] === 'Không đạt').length
  const pendingCount = rows.filter((row) => row[6] !== 'Hoàn thành').length

  return (
    <ComponentsWorkspace>
      <div className="w-full min-w-0 flex-1 space-y-1">
        <div className="grid grid-cols-1 gap-1 xl:grid-cols-6">
          <CockpitKpiCard title="Tổng phiếu QC" value="1.248" note="+15,6% so với tháng trước" state="normal" tone="cyan" />
          <CockpitKpiCard title="Đạt" value="1.086" note="87,0%" state="normal" tone="emerald" />
          <CockpitKpiCard title="Không đạt" value="98" note="7,9%" state="normal" tone="red" />
          <CockpitKpiCard title="Chờ xử lý" value="64" note="5,1%" state="normal" tone="amber" />
          <CockpitKpiCard title="Đang xử lý" value="32" note="2,6%" state="normal" tone="blue" />
          <CockpitKpiCard title="Khu vực QC" value="2" note="kích thước / hàn" state="normal" tone="purple" />
        </div>

        <ModuleFilterBar>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm theo mã phiếu, cấu kiện, lot, người tạo..."
            className={`${componentsInput} xl:col-span-4`}
          />
          {['Trạng thái', 'Khu vực QC', 'Loại cấu kiện', 'Loại QC'].map((item) => (
            <select key={item} className={`${componentsInput} xl:col-span-2`}>
              <option>{item}</option>
            </select>
          ))}
          <input type="date" className={`${componentsInput} xl:col-span-2`} />
        </ModuleFilterBar>

        <div className="grid grid-cols-1 gap-1 xl:grid-cols-12">
          <div className="xl:col-span-9">
            <CockpitChartCard title={`Danh sách phiếu QC nội bộ (${rows.length})`} className={COCKPIT_HEIGHTS.TABLE_MD}>
              <CockpitTableShell className="h-full">
                <table className="w-full min-w-[1050px] table-fixed text-[13px]">
                  <thead className="border-b border-cyan-400/10 bg-transparent text-slate-300">
                    <tr>
                      {['Mã phiếu QC', 'Cấu kiện', 'Lot / Heat', 'Loại QC', 'Khu vực QC', 'Ngày tạo', 'Trạng thái', 'Kết quả', 'Người QC'].map((heading) => (
                        <th key={heading} className="px-1.5 py-0.5 text-left font-medium">{heading}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRows.length ? paginatedRows.map((row) => (
                      <tr key={row[0]} className="border-t border-slate-800/80 text-slate-200 hover:bg-slate-900/40">
                        {row.map((cell, index) => (
                          <td key={`${row[0]}-${cell}`} className={`px-2 py-2 ${index === 0 ? 'text-cyan-300' : ''} ${cell === 'Đạt' ? 'text-emerald-300' : ''}`}>
                            {cell}
                          </td>
                        ))}
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={9} className="px-2 py-10">
                          <ModuleEmptyState icon="✓" title="Chưa có dữ liệu QC" description="Không tìm thấy phiếu QC phù hợp với bộ lọc hiện tại." />
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
            <CockpitChartCard title="Đạt QC" className={COCKPIT_HEIGHTS.CHART_SM}>
              <div className="flex h-full flex-col justify-center gap-1 text-sm text-slate-300">
                <div className="text-3xl font-bold text-emerald-300">{passedCount}</div>
                <div>Phiếu đạt trong dữ liệu đang hiển thị.</div>
              </div>
            </CockpitChartCard>
            <CockpitChartCard title="Không đạt" className={COCKPIT_HEIGHTS.CHART_SM}>
              <div className="flex h-full flex-col justify-center gap-1 text-sm text-slate-300">
                <div className="text-3xl font-bold text-red-300">{failedCount}</div>
                <div>Phiếu cần xử lý lại.</div>
              </div>
            </CockpitChartCard>
            <CockpitChartCard title="Gần đây" className={COCKPIT_HEIGHTS.CHART_SM}>
              {rows.length ? rows.slice(0, 5).map((row) => (
                <div key={row[0]} className="mb-1 flex justify-between gap-1 text-[12px] text-slate-300">
                  <span className="truncate text-cyan-300">{row[0]}</span>
                  <span className="shrink-0">{row[7]}</span>
                </div>
              )) : (
                <ModuleEmptyState icon="🕒" title="Chưa có hoạt động" description="Chưa có phiếu QC gần đây." />
              )}
              {pendingCount ? <div className="mt-1 text-[11px] text-amber-300">{pendingCount} phiếu đang xử lý</div> : null}
            </CockpitChartCard>
          </div>
        </div>
      </div>
    </ComponentsWorkspace>
  )
}
