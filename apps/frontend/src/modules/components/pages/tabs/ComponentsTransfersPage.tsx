import { useEffect, useMemo, useState } from 'react'
import { ArrowLeftRight, CheckCircle2, Clock, Eye, Layers } from 'lucide-react'

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
import { useYardMovementsRuntime } from '../../../yard/hooks/queries/useYardRuntime'
import { formatDateTime, formatQuantity } from '@/shared/utils/number-format'

export function ComponentsTransfersPage() {
  const { data: movements = [], isLoading } = useYardMovementsRuntime()
  const [query, setQuery] = useState('')
  const [searchDraft, setSearchDraft] = useState('')
  const [page, setPage] = useState(1)
  const [selectedRow, setSelectedRow] = useState<any | null>(null)
  const [expandedModalOpen, setExpandedModalOpen] = useState(false)

  function applySearch() {
    setQuery(searchDraft)
    setPage(1)
  }

  function resetFilters() {
    setSearchDraft('')
    setQuery('')
    setPage(1)
  }

  const rows = useMemo(() => movements
    .filter((movement) => movement.type === 'MOVE')
    .filter((movement) => {
      if (!query.trim()) return true
      return `${movement.itemCode} ${movement.fromSlot?.code ?? ''} ${movement.toSlot?.code ?? ''}`.toLowerCase().includes(query.toLowerCase())
    }), [movements, query])

  const pageSize = 14
  const paginatedRows = rows.slice((page - 1) * pageSize, page * pageSize)
  const todayKey = new Date().toISOString().slice(0, 10)
  const todayRows = rows.filter((row) => String(row.createdAt ?? '').slice(0, 10) === todayKey)
  const recentRows = rows.slice(0, 5)
  const latestMovementAt = recentRows[0]?.createdAt ? formatDateTime(recentRows[0].createdAt) : 'Chưa có'

  return (
    <EnterpriseModulePage>
      <div className="w-full min-w-0 flex-1 space-y-1 -mt-2">
        {/* Phase 1: KPI Cards */}
        <div className="grid grid-cols-1 gap-1 xl:grid-cols-4">
          <EnterpriseKpiCard
            title="Tổng lệnh chuyển"
            value={formatQuantity(rows.length, 0)}
            tone="cyan"
            icon={<ArrowLeftRight size={15} />}
            isLoading={isLoading}
          />
          <EnterpriseKpiCard
            title="Hoàn thành"
            value={formatQuantity(rows.length, 0)}
            tone="emerald"
            icon={<CheckCircle2 size={15} />}
            isLoading={isLoading}
          />
          <EnterpriseKpiCard
            title="Hôm nay"
            value={formatQuantity(todayRows.length, 0)}
            tone="blue"
            icon={<Clock size={15} />}
            isLoading={isLoading}
          />
          <EnterpriseKpiCard
            title="Gần nhất"
            value={latestMovementAt}
            tone="purple"
            icon={<Layers size={15} />}
            isLoading={isLoading}
          />
        </div>

        {/* Phase 3: Search & Refresh Toolbar (Golden Reference Match) */}
        <InventoryPanel className="rounded-xl -mt-1">
          <div className="grid grid-cols-1 gap-1 xl:grid-cols-[1fr_130px_120px]">
            <input
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') applySearch()
              }}
              placeholder="Tìm mã cấu kiện, nơi đi, nơi đến..."
              className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:bg-[#08111f]"
            />
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

        {/* Phase 4: Transfer Hero Table */}
        <div className="grid grid-cols-1 gap-1 xl:grid-cols-12 items-start">
          <div className="xl:col-span-9">
            <InventoryPanel className="rounded-xl">
              <div className="mb-1 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-white">Danh sách lệnh chuyển cấu kiện</h3>
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
                <table className="w-full min-w-[1050px] table-fixed text-sm">
                  <thead
                    className={`${inventoryTableHead} text-slate-300 border-b border-cyan-400/10 sticky top-0 z-10`}
                    style={{ backgroundColor: 'rgba(30, 41, 59, 1)' }}
                  >
                    <tr>
                      {['Thời gian', 'Cấu kiện', 'Nơi đi', 'Nơi đến', 'Trạng thái', 'Ghi chú'].map((heading) => (
                        <th key={heading} className="px-3 py-2 text-left text-xs font-semibold text-slate-300">{heading}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-6 text-center">
                          <ModuleLoadingState label="Đang tải lệnh chuyển..." />
                        </td>
                      </tr>
                    ) : paginatedRows.length ? paginatedRows.map((row) => (
                      <tr key={row.id} onClick={() => setSelectedRow(row)} className={`cursor-pointer ${inventoryTableRow}`}>
                        <td className="px-3 py-1.5 text-slate-300 font-mono">{formatDateTime(row.createdAt)}</td>
                        <td className="px-3 py-1.5 text-cyan-300 font-mono font-medium">{row.itemCode}</td>
                        <td className="px-3 py-1.5 text-slate-300">{row.fromSlot?.zone?.code ?? '-'} / {row.fromSlot?.code ?? '-'}</td>
                        <td className="px-3 py-1.5 text-slate-300">{row.toSlot?.zone?.code ?? '-'} / {row.toSlot?.code ?? '-'}</td>
                        <td className="px-3 py-1.5">
                          <span className="inline-flex rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-xs text-emerald-300">
                            Hoàn thành
                          </span>
                        </td>
                        <td className="px-3 py-1.5 text-slate-300 truncate">{row.reason ?? '-'}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={6} className="px-4 py-10">
                          <ModuleEmptyState icon={<ArrowLeftRight size={18} />} title="Chưa có điều chuyển" description="Không tìm thấy lệnh điều chuyển cấu kiện phù hợp." />
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <InventoryPagination page={page} pageSize={pageSize} pageCount={Math.max(1, Math.ceil(rows.length / pageSize))} total={rows.length} onPageChange={setPage} containerClassName="border-t-0" />
            </InventoryPanel>
          </div>

          {/* Phase 2: Analytics Right Rail */}
          <div className="space-y-1 xl:col-span-3">
            <InventoryChartCard title="Điều chuyển hôm nay" className="h-[170px]">
              <div className="flex h-full flex-col justify-center gap-1 text-xs text-slate-300">
                <div className="text-3xl font-bold font-mono text-cyan-300">{formatQuantity(todayRows.length, 0)}</div>
                <div>Lệnh MOVE phát sinh trong ngày.</div>
              </div>
            </InventoryChartCard>
            <InventoryChartCard title="Trạng thái thực thi" className="h-[170px]">
              <div className="flex h-full flex-col justify-center gap-1 text-xs text-slate-300">
                <div className="text-3xl font-bold font-mono text-emerald-300">{formatQuantity(rows.length, 0)}</div>
                <div>Lệnh điều chuyển đã hoàn thành</div>
              </div>
            </InventoryChartCard>
            <InventoryChartCard title="Gần đây" className="h-[170px]">
              {recentRows.length ? recentRows.map((row) => (
                <div key={row.id} className="mb-1 flex justify-between gap-1 text-[12px] text-slate-300">
                  <span className="truncate text-cyan-300 font-mono">{row.itemCode}</span>
                  <span className="shrink-0 font-mono text-slate-400">{row.toSlot?.code ?? '-'}</span>
                </div>
              )) : (
                <ModuleEmptyState icon={<Clock size={18} />} title="Chưa có hoạt động" description="Chưa có lệnh điều chuyển gần đây." />
              )}
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
                <h2 className="text-base font-bold text-white">Toàn bộ danh sách lệnh chuyển cấu kiện</h2>
                <p className="text-xs text-slate-400">Tổng cộng {rows.length} lệnh điều chuyển trong hệ thống</p>
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
              <table className="w-full min-w-[1100px] text-xs table-fixed border-collapse">
                <thead
                  className={`${inventoryTableHead} text-slate-300 border-b border-cyan-400/10 sticky top-0 z-10`}
                  style={{ backgroundColor: 'rgba(30, 41, 59, 1)' }}
                >
                  <tr>
                    {['Thời gian', 'Cấu kiện', 'Nơi đi', 'Nơi đến', 'Trạng thái', 'Ghi chú'].map((heading) => (
                      <th key={heading} className="px-3 py-2 text-left font-semibold text-slate-300">{heading}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={row.id}
                      onClick={() => {
                        setSelectedRow(row)
                        setExpandedModalOpen(false)
                      }}
                      className={`${inventoryTableRow} cursor-pointer`}
                    >
                      <td className="px-3 py-2 text-slate-300 font-mono">{formatDateTime(row.createdAt)}</td>
                      <td className="px-3 py-2 text-cyan-300 font-mono font-medium">{row.itemCode}</td>
                      <td className="px-3 py-2 text-slate-300">{row.fromSlot?.zone?.code ?? '-'} / {row.fromSlot?.code ?? '-'}</td>
                      <td className="px-3 py-2 text-slate-300">{row.toSlot?.zone?.code ?? '-'} / {row.toSlot?.code ?? '-'}</td>
                      <td className="px-3 py-2">
                        <span className="inline-flex rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-xs text-emerald-300">
                          Hoàn thành
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-300 truncate">{row.reason ?? '-'}</td>
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

      {/* Phase 6: Transfer Detail Drawer */}
      <ModuleDetailDrawer
        open={Boolean(selectedRow)}
        title={selectedRow ? `Lệnh chuyển · ${selectedRow.itemCode}` : 'Chi tiết lệnh chuyển'}
        subtitle={selectedRow ? `Thời gian: ${formatDateTime(selectedRow.createdAt)}` : undefined}
        onClose={() => setSelectedRow(null)}
      >
        {selectedRow ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              <CockpitKpiCard title="Mã cấu kiện" value={selectedRow.itemCode} state="normal" tone="cyan" />
              <CockpitKpiCard title="Trạng thái" value="Hoàn thành" state="normal" tone="emerald" />
              <CockpitKpiCard title="Nơi đi" value={`${selectedRow.fromSlot?.zone?.code ?? '-'} / ${selectedRow.fromSlot?.code ?? '-'}`} state="normal" tone="amber" />
              <CockpitKpiCard title="Nơi đến" value={`${selectedRow.toSlot?.zone?.code ?? '-'} / ${selectedRow.toSlot?.code ?? '-'}`} state="normal" tone="blue" />
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.035] p-4 text-xs space-y-2">
              <div className="font-semibold uppercase tracking-wider text-cyan-300">Thông tin chi tiết lệnh điều chuyển</div>
              <div className="flex justify-between text-slate-300 border-b border-white/5 pb-1.5">
                <span>Thời gian thực hiện</span>
                <span className="font-mono text-white">{formatDateTime(selectedRow.createdAt)}</span>
              </div>
              <div className="flex justify-between text-slate-300 border-b border-white/5 pb-1.5">
                <span>Lý do / Ghi chú</span>
                <span className="text-white">{selectedRow.reason ?? 'Điều chuyển nội bộ'}</span>
              </div>
            </div>
          </div>
        ) : null}
      </ModuleDetailDrawer>
    </EnterpriseModulePage>
  )
}
