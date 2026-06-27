import { useMemo, useState } from 'react'

import { EnterpriseModulePage } from '../../../../shared/runtime-tabs/EnterpriseModulePage'
import { CockpitChartCard, CockpitKpiCard, CockpitTableShell, COCKPIT_HEIGHTS, DataTablePagination } from '../../../../shared/ui/cockpit'
import { ModuleEmptyState, ModuleFilterBar } from '../../../../shared/ui/modules'
import { componentsInput } from './ComponentsCockpitShared'

const historyRows = [
  ['CPL-BEAM-001256', 'BEAM H450x200x10x16', 'SX-2506-0142', 'Nhà xưởng A', 'Workshop A', 'Cắt', '23/06/2025 08:15', '23/06/2025 09:20', 'Hoàn thành', 'Đạt'],
  ['CPL-COL-000986', 'COLUMN H300x300x10x15', 'SX-2506-0138', 'Nhà xưởng B', 'Workshop A', 'Cắt', '23/06/2025 10:05', '23/06/2025 11:10', 'Hoàn thành', 'Đạt'],
  ['CPL-BASE-000241', 'BASE PLATE 25mm', 'SX-2506-0143', 'Nhà xưởng B', 'Workshop B', 'Cắt', '24/06/2025 09:45', '24/06/2025 10:20', 'Lỗi', 'Không đạt'],
]

export function ComponentsHistoryPage() {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const rows = useMemo(() => historyRows.filter((row) => {
    if (!query.trim()) return true
    return row.join(' ').toLowerCase().includes(query.toLowerCase())
  }), [query])
  const pageSize = 14
  const paginatedRows = rows.slice((page - 1) * pageSize, page * pageSize)
  const doneCount = rows.filter((row) => row[8] === 'Hoàn thành').length
  const activeCount = rows.filter((row) => row[8] !== 'Hoàn thành').length
  const failCount = rows.filter((row) => row[9] === 'Không đạt').length

  return (
    <EnterpriseModulePage>
      <div className="w-full min-w-0 flex-1 space-y-1">
        <div className="grid grid-cols-1 gap-1 xl:grid-cols-6">
          <CockpitKpiCard title="Tổng cấu kiện gia công" value="5.281" note="+12,6%" state="normal" tone="cyan" />
          <CockpitKpiCard title="Hoàn thành" value="4.562" note="86,4%" state="normal" tone="emerald" />
          <CockpitKpiCard title="Đang gia công" value="436" note="8,3%" state="normal" tone="blue" />
          <CockpitKpiCard title="Chờ gia công" value="183" note="3,5%" state="normal" tone="amber" />
          <CockpitKpiCard title="Lỗi / Làm lại" value="100" note="1,9%" state="normal" tone="red" />
          <CockpitKpiCard title="Kết quả đạt" value="5.181" state="normal" tone="purple" />
        </div>

        <ModuleFilterBar>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm theo mã cấu kiện, tên cấu kiện, dự án..."
            className={`${componentsInput} xl:col-span-4`}
          />
          {['Nhà máy', 'Xưởng', 'Công đoạn', 'Trạng thái'].map((item) => (
            <select key={item} className={`${componentsInput} xl:col-span-2`}>
              <option>{item}</option>
            </select>
          ))}
          <input type="date" className={`${componentsInput} xl:col-span-2`} />
        </ModuleFilterBar>

        <div className="grid grid-cols-1 gap-1 xl:grid-cols-12">
          <div className="xl:col-span-9">
            <CockpitChartCard title={`Danh sách lịch sử gia công (${rows.length})`} className={COCKPIT_HEIGHTS.TABLE_MD}>
              <CockpitTableShell className="h-full">
                <table className="w-full min-w-[1120px] table-fixed text-[13px]">
                  <thead className="border-b border-cyan-400/10 bg-transparent text-slate-300">
                    <tr>
                      {['Mã cấu kiện', 'Tên cấu kiện', 'Số lệnh SX', 'Dự án', 'Xưởng', 'Công đoạn', 'Bắt đầu', 'Hoàn thành', 'Trạng thái', 'Kết quả'].map((heading) => (
                        <th key={heading} className="px-1.5 py-0.5 text-left font-medium">{heading}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRows.length ? paginatedRows.map((row) => (
                      <tr key={row[0]} className="border-t border-slate-800/80 text-slate-200 hover:bg-slate-900/40">
                        {row.map((cell, index) => (
                          <td key={`${row[0]}-${cell}`} className={`px-2 py-2 ${index === 0 ? 'text-cyan-300' : ''} ${cell === 'Đạt' ? 'text-emerald-300' : cell === 'Không đạt' ? 'text-red-300' : ''}`}>
                            {cell}
                          </td>
                        ))}
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={10} className="px-2 py-10">
                          <ModuleEmptyState icon="🕒" title="Chưa có lịch sử" description="Không tìm thấy lịch sử gia công phù hợp với bộ lọc hiện tại." />
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
            <CockpitChartCard title="Hoạt động hôm nay" className={COCKPIT_HEIGHTS.CHART_SM}>
              <div className="flex h-full flex-col justify-center gap-1 text-sm text-slate-300">
                <div className="text-3xl font-bold text-cyan-300">{rows.length}</div>
                <div>Bản ghi đang hiển thị.</div>
              </div>
            </CockpitChartCard>
            <CockpitChartCard title="Theo loại" className={COCKPIT_HEIGHTS.CHART_SM}>
              <div className="grid h-full content-center gap-1 text-sm text-slate-300">
                <div className="flex justify-between"><span>Hoàn thành</span><span className="text-emerald-300">{doneCount}</span></div>
                <div className="flex justify-between"><span>Đang chạy</span><span className="text-cyan-300">{activeCount}</span></div>
                <div className="flex justify-between"><span>Không đạt</span><span className="text-red-300">{failCount}</span></div>
              </div>
            </CockpitChartCard>
            <CockpitChartCard title="Gần đây" className={COCKPIT_HEIGHTS.CHART_SM}>
              {rows.length ? rows.slice(0, 5).map((row) => (
                <div key={row[0]} className="mb-1 flex justify-between gap-1 text-[12px] text-slate-300">
                  <span className="truncate text-cyan-300">{row[0]}</span>
                  <span className="shrink-0">{row[5]}</span>
                </div>
              )) : (
                <ModuleEmptyState icon="🕒" title="Chưa có hoạt động" description="Chưa có lịch sử gần đây." />
              )}
            </CockpitChartCard>
          </div>
        </div>
      </div>
    </EnterpriseModulePage>
  )
}
