import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, Clock, Layers, ShieldAlert } from 'lucide-react'

import { EnterpriseModulePage } from '@/shared/runtime-tabs/EnterpriseModulePage'
import { CockpitKpiCard, EnterpriseKpiCard } from '../../../../shared/ui/cockpit'
import { ModuleDetailDrawer, ModuleEmptyState, ModuleLoadingState } from '../../../../shared/ui/modules'
import {
  InventoryChartCard,
  InventoryPagination,
  InventoryPanel,
  inventoryTableHead,
  inventoryTableRow,
} from '../../../inventory/components/InventoryVisuals'
import { useComponentsHistory } from '../../hooks/queries/useComponents'
import { formatQuantity } from '@/shared/utils/number-format'

export function ComponentsHistoryPage() {
  const [query, setQuery] = useState('')
  const [searchDraft, setSearchDraft] = useState('')
  const [action, setAction] = useState('')
  const [page, setPage] = useState(1)
  const [selectedRow, setSelectedRow] = useState<any | null>(null)
  const [expandedModalOpen, setExpandedModalOpen] = useState(false)
  const pageSize = 14

  function applySearch() {
    setQuery(searchDraft)
    setPage(1)
  }

  function resetFilters() {
    setSearchDraft('')
    setQuery('')
    setAction('')
    setPage(1)
  }

  const { data: history, isLoading } = useComponentsHistory({
    page,
    limit: pageSize,
    search: query || undefined,
    action: action || undefined,
  })
  const rows = history?.data ?? []
  const paginatedRows = rows
  const doneCount = history?.summary.completed ?? 0
  const activeCount = history?.summary.active ?? 0
  const failCount = history?.summary.failed ?? 0

  const actionOptions = useMemo(() => {
    const values = new Set<string>()
    ;(history?.recent ?? []).forEach((row) => {
      if (row.action) values.add(row.action)
    })
    rows.forEach((row) => {
      const stage = row[5]
      if (stage) values.add(stage)
    })
    return Array.from(values).sort()
  }, [history?.recent, rows])

  return (
    <EnterpriseModulePage>
      <div className="w-full min-w-0 flex-1 space-y-1 -mt-2">
        <div className="grid grid-cols-1 gap-1 md:grid-cols-3 xl:grid-cols-6">
          <EnterpriseKpiCard
            title="Tổng cấu kiện gia công"
            value={formatQuantity(history?.summary.total ?? 0, 0)}
            tone="cyan"
            icon={<Layers size={15} />}
            isLoading={isLoading}
          />
          <EnterpriseKpiCard
            title="Hoàn thành"
            value={formatQuantity(doneCount, 0)}
            tone="emerald"
            icon={<CheckCircle2 size={15} />}
            isLoading={isLoading}
          />
          <EnterpriseKpiCard
            title="Đang gia công"
            value={formatQuantity(activeCount, 0)}
            tone="blue"
            icon={<Clock size={15} />}
            isLoading={isLoading}
          />
          <EnterpriseKpiCard
            title="Chờ gia công"
            value={formatQuantity(history?.summary.waiting ?? 0, 0)}
            tone="amber"
            icon={<AlertTriangle size={15} />}
            isLoading={isLoading}
          />
          <EnterpriseKpiCard
            title="Lỗi / Làm lại"
            value={formatQuantity(failCount, 0)}
            tone="red"
            icon={<ShieldAlert size={15} />}
            isLoading={isLoading}
          />
          <EnterpriseKpiCard
            title="Kết quả đạt"
            value={formatQuantity(doneCount, 0)}
            tone="purple"
            icon={<CheckCircle2 size={15} />}
            isLoading={isLoading}
          />
        </div>

        <InventoryPanel className="rounded-xl -mt-1">
          <div className="grid grid-cols-1 gap-1 xl:grid-cols-[1fr_220px_130px_120px]">
            <input
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') applySearch()
              }}
              placeholder="Tìm theo mã cấu kiện, tên cấu kiện, dự án..."
              className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:bg-[#08111f]"
            />
            <select
              value={action}
              onChange={(e) => {
                setAction(e.target.value)
                setPage(1)
              }}
              className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:bg-[#08111f]"
            >
              <option value="">Tất cả công đoạn</option>
              {actionOptions.map((item) => (
                <option key={item} value={item}>{item}</option>
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

        <div className="grid grid-cols-1 gap-1 xl:grid-cols-12 items-start">
          <div className="xl:col-span-9">
            <InventoryPanel className="rounded-xl">
              <div className="mb-1 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-white">Danh sách lịch sử gia công</h3>
                  <span className="rounded-full bg-cyan-400/10 px-2 py-0.5 text-[10px] font-medium text-cyan-300 border border-cyan-400/20">
                    {history?.meta.total ?? 0} bản ghi
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
                <table className="w-full min-w-[1120px] table-fixed text-sm">
                  <thead
                    className={`${inventoryTableHead} text-slate-300 border-b border-cyan-400/10 sticky top-0 z-10`}
                    style={{ backgroundColor: 'rgba(30, 41, 59, 1)' }}
                  >
                    <tr>
                      {[
                        'Mã cấu kiện',
                        'Tên cấu kiện',
                        'Số lệnh SX',
                        'Dự án',
                        'Xưởng',
                        'Công đoạn',
                        'Bắt đầu',
                        'Hoàn thành',
                        'Trạng thái',
                        'Kết quả',
                      ].map((heading) => (
                        <th key={heading} className="px-2 py-2 text-left text-xs font-semibold text-slate-300">{heading}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={10} className="px-2 py-10 text-center text-slate-400">
                          <ModuleLoadingState label="Đang tải lịch sử..." />
                        </td>
                      </tr>
                    ) : paginatedRows.length ? (
                      paginatedRows.map((row) => (
                        <tr key={row[0]} onClick={() => setSelectedRow(row)} className={`cursor-pointer ${inventoryTableRow}`}>
                          {row.map((cell: any, index: number) => (
                            <td
                              key={`${row[0]}-${cell}-${index}`}
                              className={`px-2 py-1.5 ${
                                index === 0 ? 'font-mono text-cyan-300 font-medium' : ''
                              } ${cell === 'Đạt' ? 'text-emerald-300 font-medium' : cell === 'Không đạt' ? 'text-red-300 font-medium' : 'text-slate-300'}`}
                            >
                              {index === 6 || (index === 7 && cell !== '-')
                                ? new Date(cell).toLocaleString('vi-VN')
                                : cell}
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={10} className="px-2 py-10">
                          <ModuleEmptyState
                            icon={<Clock size={18} />}
                            title="Chưa có lịch sử"
                            description="Không tìm thấy lịch sử gia công phù hợp với bộ lọc hiện tại."
                          />
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <InventoryPagination
                page={page}
                pageSize={pageSize}
                pageCount={Math.max(1, Math.ceil((history?.meta.total ?? 0) / pageSize))}
                total={history?.meta.total ?? 0}
                onPageChange={setPage}
                containerClassName="border-t-0"
              />
            </InventoryPanel>
          </div>

          <div className="space-y-1 xl:col-span-3">
            <InventoryChartCard title="Hoạt động hôm nay" className="h-[170px]">
              <div className="flex h-full flex-col justify-center gap-1 text-xs text-slate-300">
                <div className="text-3xl font-bold font-mono text-cyan-300">
                  {history?.meta.total ?? 0}
                </div>
                <div>Bản ghi đang hiển thị.</div>
              </div>
            </InventoryChartCard>

            <InventoryChartCard title="Theo trạng thái" className="h-[170px]">
              <div className="grid h-full content-center gap-1 text-xs text-slate-300 font-mono">
                <div className="flex justify-between">
                  <span>Hoàn thành</span>
                  <span className="text-emerald-300 font-bold">{doneCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Đang chạy</span>
                  <span className="text-cyan-300 font-bold">{activeCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Lỗi / Không đạt</span>
                  <span className="text-red-300 font-bold">{failCount}</span>
                </div>
              </div>
            </InventoryChartCard>

            <InventoryChartCard title="Lịch sử gần đây" className="h-[170px]">
              {(history?.recent ?? []).length ? (
                history?.recent.map((row) => (
                  <div
                    key={`${row.code}-${row.action}`}
                    className="mb-1 flex justify-between gap-1 text-[12px] text-slate-300"
                  >
                    <span className="truncate text-cyan-300 font-mono">{row.code}</span>
                    <span className="shrink-0 font-mono text-slate-400">{row.action}</span>
                  </div>
                ))
              ) : (
                <ModuleEmptyState
                  icon={<Clock size={18} />}
                  title="Chưa có hoạt động"
                  description="Chưa có lịch sử gần đây."
                />
              )}
            </InventoryChartCard>
          </div>
        </div>
      </div>

      {expandedModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-7xl rounded-2xl border border-white/15 bg-[#08111f] p-5 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h2 className="text-base font-bold text-white">Toàn bộ danh sách lịch sử gia công</h2>
                <p className="text-xs text-slate-400">Tổng cộng {history?.meta.total ?? 0} bản ghi trong lịch sử gia công</p>
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
                  <tr>
                    {[
                      'Mã cấu kiện',
                      'Tên cấu kiện',
                      'Số lệnh SX',
                      'Dự án',
                      'Xưởng',
                      'Công đoạn',
                      'Bắt đầu',
                      'Hoàn thành',
                      'Trạng thái',
                      'Kết quả',
                    ].map((heading) => (
                      <th key={heading} className="px-2 py-2 text-left font-semibold text-slate-300">{heading}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedRows.map((row) => (
                    <tr
                      key={row[0]}
                      onClick={() => {
                        setSelectedRow(row)
                        setExpandedModalOpen(false)
                      }}
                      className={`${inventoryTableRow} cursor-pointer`}
                    >
                      {row.map((cell: any, index: number) => (
                        <td
                          key={`${row[0]}-${cell}-${index}`}
                          className={`px-2 py-2 ${
                            index === 0 ? 'font-mono text-cyan-300 font-medium' : ''
                          } ${cell === 'Đạt' ? 'text-emerald-300 font-medium' : cell === 'Không đạt' ? 'text-red-300 font-medium' : 'text-slate-300'}`}
                        >
                          {index === 6 || (index === 7 && cell !== '-')
                            ? new Date(cell).toLocaleString('vi-VN')
                            : cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <InventoryPagination
              page={page}
              pageSize={pageSize}
              pageCount={Math.max(1, Math.ceil((history?.meta.total ?? 0) / pageSize))}
              total={history?.meta.total ?? 0}
              onPageChange={setPage}
              containerClassName="border-t-0"
            />
          </div>
        </div>
      ) : null}

      <ModuleDetailDrawer
        open={Boolean(selectedRow)}
        title={selectedRow ? `Lịch sử gia công · ${selectedRow[0]}` : 'Chi tiết lịch sử gia công'}
        subtitle={selectedRow ? `${selectedRow[1]} (${selectedRow[3]})` : undefined}
        onClose={() => setSelectedRow(null)}
      >
        {selectedRow ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              <CockpitKpiCard title="Mã cấu kiện" value={selectedRow[0]} state="normal" tone="cyan" />
              <CockpitKpiCard title="Công đoạn" value={selectedRow[5] ?? '-'} state="normal" tone="blue" />
              <CockpitKpiCard title="Trạng thái" value={selectedRow[8] ?? '-'} state="normal" tone="purple" />
              <CockpitKpiCard title="Kết quả" value={selectedRow[9] ?? '-'} state="normal" tone={selectedRow[9] === 'Đạt' ? 'emerald' : 'amber'} />
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.035] p-4 text-xs space-y-2">
              <div className="font-semibold uppercase tracking-wider text-cyan-300">Thông tin chi tiết công đoạn gia công</div>
              <div className="flex justify-between text-slate-300 border-b border-white/5 pb-1.5">
                <span>Số lệnh SX</span>
                <span className="font-mono text-cyan-300">{selectedRow[2]}</span>
              </div>
              <div className="flex justify-between text-slate-300 border-b border-white/5 pb-1.5">
                <span>Dự án</span>
                <span className="text-white">{selectedRow[3]}</span>
              </div>
              <div className="flex justify-between text-slate-300 border-b border-white/5 pb-1.5">
                <span>Xưởng sản xuất</span>
                <span className="text-white">{selectedRow[4]}</span>
              </div>
              <div className="flex justify-between text-slate-300 border-b border-white/5 pb-1.5">
                <span>Thời gian bắt đầu</span>
                <span className="font-mono text-white">{selectedRow[6] ? new Date(selectedRow[6]).toLocaleString('vi-VN') : '-'}</span>
              </div>
              <div className="flex justify-between text-slate-300 border-b border-white/5 pb-1.5">
                <span>Thời gian hoàn thành</span>
                <span className="font-mono text-white">{selectedRow[7] && selectedRow[7] !== '-' ? new Date(selectedRow[7]).toLocaleString('vi-VN') : '-'}</span>
              </div>
            </div>
          </div>
        ) : null}
      </ModuleDetailDrawer>
    </EnterpriseModulePage>
  )
}
