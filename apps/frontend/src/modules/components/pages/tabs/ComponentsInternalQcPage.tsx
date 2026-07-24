import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, ClipboardCheck, Eye, Search, ShieldAlert } from 'lucide-react'

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
import { useComponents } from '../../hooks/queries/useComponents'
import { formatQuantity } from '@/shared/utils/number-format'
import { ComponentsDonut } from './ComponentsCockpitShared'

function qcDisposition(status: string) {
  if (['READY', 'SHIPPED', 'DELIVERED', 'INSTALLED'].includes(status)) return 'Đạt'
  if (['CUTTING', 'WELDING', 'PAINTING'].includes(status)) return 'Đang kiểm'
  return 'Chờ dữ liệu'
}

function qcArea(status: string) {
  if (status === 'WELDING') return 'Hàn'
  if (status === 'PAINTING') return 'Sơn'
  if (status === 'CUTTING') return 'Kích thước'
  return 'Tổng hợp'
}

export function ComponentsInternalQcPage() {
  const { data: components = [], isLoading, isError } = useComponents()
  const [query, setQuery] = useState('')
  const [searchDraft, setSearchDraft] = useState('')
  const [status, setStatus] = useState('')
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
    setStatus('')
    setPage(1)
  }

  const rows = useMemo(() => components.map((component) => ({
    id: component.id,
    code: component.code,
    name: component.name,
    project: component.project?.code ?? component.project?.name ?? '-',
    status: component.status,
    area: qcArea(component.status),
    result: qcDisposition(component.status),
    location: [component.zone, component.position].filter(Boolean).join(' / ') || '-',
    updatedAt: component.updatedAt ? new Date(component.updatedAt).toLocaleDateString('vi-VN') : '-',
  })).filter((row) => {
    if (status && row.result !== status) return false
    if (!query.trim()) return true
    return `${row.code} ${row.name} ${row.project} ${row.area} ${row.result}`.toLowerCase().includes(query.toLowerCase())
  }), [components, query, status])

  const passedCount = rows.filter((row) => row.result === 'Đạt').length
  const activeCount = rows.filter((row) => row.result === 'Đang kiểm').length
  const waitingCount = rows.filter((row) => row.result === 'Chờ dữ liệu').length
  const readyToShipCount = rows.filter((row) => ['READY', 'SHIPPED', 'DELIVERED', 'INSTALLED'].includes(row.status)).length
  const pageRows = rows.slice((page - 1) * pageSize, page * pageSize)
  const latestUpdatedAt = rows
    .map((row) => row.updatedAt)
    .filter((value) => value && value !== '-')[0] ?? 'Chưa có'

  return (
    <EnterpriseModulePage>
      <div className="w-full min-w-0 flex-1 space-y-1 -mt-2">
        {/* Phase 1: KPI Cards */}
        <div className="grid grid-cols-1 gap-1 md:grid-cols-3 xl:grid-cols-6">
          <EnterpriseKpiCard
            title="Cấu kiện cần QC"
            value={formatQuantity(rows.length, 0)}
            tone="cyan"
            icon={<ClipboardCheck size={15} />}
            isLoading={isLoading}
          />
          <EnterpriseKpiCard
            title="QC đạt"
            value={formatQuantity(passedCount, 0)}
            tone="emerald"
            icon={<CheckCircle2 size={15} />}
            isLoading={isLoading}
          />
          <EnterpriseKpiCard
            title="Đang kiểm"
            value={formatQuantity(activeCount, 0)}
            tone="blue"
            icon={<Search size={15} />}
            isLoading={isLoading}
          />
          <EnterpriseKpiCard
            title="Chờ dữ liệu"
            value={formatQuantity(waitingCount, 0)}
            tone="amber"
            icon={<ShieldAlert size={15} />}
            isLoading={isLoading}
          />
          <EnterpriseKpiCard
            title="Ready to ship"
            value={formatQuantity(readyToShipCount, 0)}
            tone="purple"
            icon={<CheckCircle2 size={15} />}
            isLoading={isLoading}
          />
          <EnterpriseKpiCard
            title="Cập nhật gần nhất"
            value={latestUpdatedAt}
            tone="cyan"
            icon={<ClipboardCheck size={15} />}
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
              placeholder="Tìm mã cấu kiện, tên, dự án, khu vực QC..."
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
              <option value="">Kết quả: Tất cả</option>
              <option value="Đạt">Đạt</option>
              <option value="Đang kiểm">Đang kiểm</option>
              <option value="Chờ dữ liệu">Chờ dữ liệu</option>
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

        {isError ? (
          <ModuleEmptyState icon={<ShieldAlert size={18} />} title="Không thể tải dữ liệu QC cấu kiện" description="Kiểm tra kết nối hoặc quyền truy cập Components." />
        ) : (
          <div className="grid grid-cols-1 gap-1 xl:grid-cols-12 items-start">
            {/* Phase 4: QC Hero Table */}
            <div className="xl:col-span-9">
              <InventoryPanel className="rounded-xl">
                <div className="mb-1 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-white">Hàng đợi QC cấu kiện</h3>
                    <span className="rounded-full bg-cyan-400/10 px-2 py-0.5 text-[10px] font-medium text-cyan-300 border border-cyan-400/20">
                      {rows.length} cấu kiện
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
                  <table className="w-full min-w-[960px] table-fixed text-sm">
                    <thead
                      className={`${inventoryTableHead} text-slate-300 border-b border-cyan-400/10 sticky top-0 z-10`}
                      style={{ backgroundColor: 'rgba(30, 41, 59, 1)' }}
                    >
                      <tr>
                        {['Mã cấu kiện', 'Tên', 'Dự án', 'Khu vực QC', 'Lifecycle', 'Kết quả', 'Vị trí', 'Cập nhật'].map((heading) => (
                          <th key={heading} className="px-3 py-2 text-left text-xs font-semibold text-slate-300">{heading}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {isLoading ? (
                        <tr><td colSpan={8} className="px-3 py-8 text-center"><ModuleLoadingState label="Đang tải QC cấu kiện..." /></td></tr>
                      ) : pageRows.length ? pageRows.map((row) => (
                        <tr key={row.id} onClick={() => setSelectedRow(row)} className={`cursor-pointer ${inventoryTableRow}`}>
                          <td className="truncate px-3 py-1.5 font-mono font-medium text-cyan-300">{row.code}</td>
                          <td className="truncate px-3 py-1.5 text-white font-medium">{row.name}</td>
                          <td className="truncate px-3 py-1.5 text-slate-300">{row.project}</td>
                          <td className="px-3 py-1.5 text-slate-300">{row.area}</td>
                          <td className="px-3 py-1.5 text-slate-300 font-mono text-xs">{row.status}</td>
                          <td className="px-3 py-1.5">
                            <span className={`inline-flex rounded-lg border px-2 py-0.5 text-xs font-medium ${
                              row.result === 'Đạt'
                                ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300'
                                : row.result === 'Đang kiểm'
                                  ? 'border-cyan-400/30 bg-cyan-400/10 text-cyan-300'
                                  : 'border-amber-400/30 bg-amber-400/10 text-amber-300'
                            }`}>
                              {row.result}
                            </span>
                          </td>
                          <td className="truncate px-3 py-1.5 text-slate-300 font-mono">{row.location}</td>
                          <td className="px-3 py-1.5 text-slate-400 font-mono text-xs">{row.updatedAt}</td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={8} className="px-3 py-10">
                            <ModuleEmptyState icon={<ClipboardCheck size={18} />} title="Chưa có dữ liệu QC cấu kiện" description="Không tìm thấy cấu kiện phù hợp với bộ lọc hiện tại." />
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
              <InventoryChartCard title="Phân bổ kết quả QC" className="h-[170px]">
                <ComponentsDonut centerValue={formatQuantity(rows.length, 0)} centerLabel="QC" segments={[
                  { label: 'Đạt', value: passedCount, color: '#14c987' },
                  { label: 'Đang kiểm', value: activeCount, color: '#06b6d4' },
                  { label: 'Chờ', value: waitingCount, color: '#f59e0b' },
                ]} />
              </InventoryChartCard>
              <InventoryChartCard title="Sự cố NCR" className="h-[170px]">
                <ModuleEmptyState icon={<ShieldAlert size={18} />} title="Chưa có NCR từ API" description="NCR thật sẽ hiển thị khi QC domain cung cấp contract." />
              </InventoryChartCard>
              <InventoryChartCard title="Gần đây" className="h-[170px]">
                {rows.slice(0, 5).map((row) => (
                  <div key={row.id} className="mb-1 flex justify-between gap-2 text-xs text-slate-300">
                    <span className="truncate text-cyan-300 font-mono">{row.code}</span>
                    <span className={`shrink-0 font-mono ${
                      row.result === 'Đạt' ? 'text-emerald-300' : row.result === 'Đang kiểm' ? 'text-cyan-300' : 'text-amber-300'
                    }`}>{row.result}</span>
                  </div>
                ))}
                {!rows.length ? <ModuleEmptyState icon={<CheckCircle2 size={18} />} title="Chưa có hoạt động" description="Không có cấu kiện trong bộ lọc hiện tại." /> : null}
              </InventoryChartCard>
            </div>
          </div>
        )}
      </div>

      {/* Phase 5: EXPANDED TABLE MODAL ("Xem tất cả" interaction matching Inventory Golden Reference) */}
      {expandedModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-7xl rounded-2xl border border-white/15 bg-[#08111f] p-5 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h2 className="text-base font-bold text-white">Toàn bộ hàng đợi QC cấu kiện</h2>
                <p className="text-xs text-slate-400">Tổng cộng {rows.length} cấu kiện trong danh sách QC</p>
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
              <table className="w-full min-w-[1000px] text-xs table-fixed border-collapse">
                <thead
                  className={`${inventoryTableHead} text-slate-300 border-b border-cyan-400/10 sticky top-0 z-10`}
                  style={{ backgroundColor: 'rgba(30, 41, 59, 1)' }}
                >
                  <tr>
                    {['Mã cấu kiện', 'Tên', 'Dự án', 'Khu vực QC', 'Lifecycle', 'Kết quả', 'Vị trí', 'Cập nhật'].map((heading) => (
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
                      <td className="truncate px-3 py-2 font-mono font-medium text-cyan-300">{row.code}</td>
                      <td className="truncate px-3 py-2 text-white font-medium">{row.name}</td>
                      <td className="truncate px-3 py-2 text-slate-300">{row.project}</td>
                      <td className="px-3 py-2 text-slate-300">{row.area}</td>
                      <td className="px-3 py-2 text-slate-300 font-mono text-xs">{row.status}</td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex rounded-lg border px-2 py-0.5 text-xs font-medium ${
                          row.result === 'Đạt'
                            ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300'
                            : row.result === 'Đang kiểm'
                              ? 'border-cyan-400/30 bg-cyan-400/10 text-cyan-300'
                              : 'border-amber-400/30 bg-amber-400/10 text-amber-300'
                        }`}>
                          {row.result}
                        </span>
                      </td>
                      <td className="truncate px-3 py-2 text-slate-300 font-mono">{row.location}</td>
                      <td className="px-3 py-2 text-slate-400 font-mono text-xs">{row.updatedAt}</td>
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

      {/* Phase 6: QC Detail Drawer */}
      <ModuleDetailDrawer
        open={Boolean(selectedRow)}
        title={selectedRow ? `QC Cấu kiện · ${selectedRow.code}` : 'Chi tiết QC'}
        subtitle={selectedRow ? `${selectedRow.name} (${selectedRow.project})` : undefined}
        onClose={() => setSelectedRow(null)}
      >
        {selectedRow ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              <CockpitKpiCard title="Mã cấu kiện" value={selectedRow.code} state="normal" tone="cyan" />
              <CockpitKpiCard title="Kết quả QC" value={selectedRow.result} state="normal" tone={selectedRow.result === 'Đạt' ? 'emerald' : selectedRow.result === 'Đang kiểm' ? 'blue' : 'amber'} />
              <CockpitKpiCard title="Khu vực QC" value={selectedRow.area} state="normal" tone="purple" />
              <CockpitKpiCard title="Vị trí bãi" value={selectedRow.location} state="normal" tone="cyan" />
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.035] p-4 text-xs space-y-2">
              <div className="font-semibold uppercase tracking-wider text-cyan-300">Thông tin QC & Tiến độ sản xuất</div>
              <div className="flex justify-between text-slate-300 border-b border-white/5 pb-1.5">
                <span>Dự án</span>
                <span className="text-white">{selectedRow.project}</span>
              </div>
              <div className="flex justify-between text-slate-300 border-b border-white/5 pb-1.5">
                <span>Trạng thái Lifecycle</span>
                <span className="font-mono text-cyan-300">{selectedRow.status}</span>
              </div>
              <div className="flex justify-between text-slate-300 border-b border-white/5 pb-1.5">
                <span>Ngày cập nhật mới nhất</span>
                <span className="font-mono text-white">{selectedRow.updatedAt}</span>
              </div>
            </div>
          </div>
        ) : null}
      </ModuleDetailDrawer>
    </EnterpriseModulePage>
  )
}
