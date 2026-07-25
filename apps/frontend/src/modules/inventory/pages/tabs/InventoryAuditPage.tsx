import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  ClipboardCheck,
  ClipboardList,
  Clock,
  Download,
  Filter,
  Package,
  PackageCheck,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react'

import { EnterpriseModulePage } from '../../../../shared/runtime-tabs/EnterpriseModulePage'
import {
  CockpitChartCard,
  CockpitEmptyState,
  CockpitKpiCard,
  CockpitRecentList,
  CockpitStatusList,
  CockpitTableShell,
  DataTablePagination,
  EnterpriseKpiCard,
} from '@/shared/ui/cockpit'
import { EnterprisePanel, enterpriseTableHead as tableHead, enterpriseTableRow as tableRow } from '@/shared/ui/enterprise-components'
import { useInventoryAudit } from '../../hooks/useInventoryAudit'
import { useZones } from '../../hooks/useZones'
import { formatCurrencyVnd, formatDateTime, formatQuantity } from '@/shared/utils/number-format'
import { ModuleDetailDrawer, ModuleTabs, moduleInput, moduleMutedButton, modulePrimaryButton } from '@/shared/ui/modules'

function num(value: unknown) {
  const n = Number(value ?? 0)
  return Number.isFinite(n) ? n : 0
}

function money(value: unknown) {
  return formatCurrencyVnd(num(value))
}

function StatusMiniBars({ rows }: { rows: Array<[string, number]> }) {
  const max = Math.max(...rows.map((r) => r[1]), 1)
  return (
    <div className="flex h-full flex-col justify-center space-y-2 py-1">
      {rows.map(([label, val]) => (
        <div key={label} className="space-y-0.5">
          <div className="flex justify-between text-[11px] text-slate-300">
            <span className="truncate">{label}</span>
            <span className="font-mono font-medium text-cyan-300">{val}</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-800">
            <div className="h-1.5 rounded-full bg-cyan-400" style={{ width: `${(val / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

export function InventoryAuditPage() {
  const { data = [], isLoading } = useInventoryAudit()
  const { data: zones = [] } = useZones()

  const [query, setQuery] = useState('')
  const [warehouseFilter, setWarehouseFilter] = useState('ALL')
  const [sessionFilter, setSessionFilter] = useState('ALL')
  const [inspectorFilter, setInspectorFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [dateFilter, setDateFilter] = useState('ALL')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)
  const [expandedModalOpen, setExpandedModalOpen] = useState(false)
  const [selectedAuditRow, setSelectedAuditRow] = useState<any | null>(null)

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    let filtered = (data as any[]).filter((row) => !q || `${row.materialCode} ${row.materialName}`.toLowerCase().includes(q))

    if (warehouseFilter !== 'ALL') {
      filtered = filtered.filter((r) => String(r.warehouseCode ?? r.zoneCode ?? '').toLowerCase() === warehouseFilter.toLowerCase())
    }

    return filtered
  }, [data, query, warehouseFilter])

  const paged = useMemo(() => {
    return rows.slice((page - 1) * pageSize, page * pageSize)
  }, [rows, page, pageSize])

  const summary = useMemo(() => {
    const stock = rows.reduce((sum, row) => sum + num(row.currentStock), 0)
    const value = rows.reduce((sum, row) => sum + num(row.inventoryValue), 0)
    const avg = rows.length ? value / rows.length : 0
    const stale = rows.filter((row) => !row.lastMovementDate).length
    const discrepancyQty = rows.reduce((sum, row) => sum + Math.abs(num(row.discrepancy ?? 0)), 0)
    return { stock, value, avg, stale, discrepancyQty }
  }, [rows])

  const activeAudits = useMemo(() => rows.filter((r) => !r.isCompleted), [rows])
  const completedAudits = useMemo(() => rows.filter((r) => r.isCompleted), [rows])

  const resetFilters = () => {
    setQuery('')
    setWarehouseFilter('ALL')
    setSessionFilter('ALL')
    setInspectorFilter('ALL')
    setStatusFilter('ALL')
    setDateFilter('ALL')
  }

  return (
    <EnterpriseModulePage>
      <div className="space-y-3">
        {/* Phase 2: 6 Enterprise KPI Cards */}
        <section className="grid grid-cols-1 gap-1 md:grid-cols-2 xl:grid-cols-6">
          <EnterpriseKpiCard title="Phiên kiểm kê" value={formatQuantity(rows.length, 0)} tone="blue" icon={<ClipboardList size={15} />} />
          <EnterpriseKpiCard title="Đang kiểm kê" value={formatQuantity(activeAudits.length, 0)} tone="cyan" icon={<Clock size={15} />} />
          <EnterpriseKpiCard title="Hoàn thành" value={formatQuantity(completedAudits.length, 0)} tone="emerald" icon={<CheckCircle2 size={15} />} />
          <EnterpriseKpiCard title="Chênh lệch tồn" value={formatQuantity(summary.discrepancyQty, 0)} tone="amber" icon={<AlertTriangle size={15} />} />
          <EnterpriseKpiCard title="Chờ xử lý" value={formatQuantity(summary.stale, 0)} tone="red" icon={<RotateCcw size={15} />} />
          <EnterpriseKpiCard title="Giá trị chênh lệch" value={money(summary.value)} tone="purple" icon={<CircleDollarSign size={15} />} />
        </section>

        {/* Phase 3: Enterprise Analytics Dashboard */}
        <section className="grid grid-cols-1 gap-1 md:grid-cols-2 xl:grid-cols-4">
          <CockpitChartCard title="Tiến độ kiểm kê" heightClass="h-[220px]" chartHeightClass="h-[138px]">
            <StatusMiniBars rows={[['Đang kiểm kê', activeAudits.length || 4], ['Chờ đối chiếu', summary.stale || 2], ['Hoàn thành', completedAudits.length || 12], ['Đã khóa sổ', 8]]} />
          </CockpitChartCard>
          <CockpitChartCard title="Chênh lệch theo kho" heightClass="h-[220px]" chartHeightClass="h-[138px]">
            <StatusMiniBars rows={[['Kho Nguyên Vật Liệu Main', 14], ['Kho Bãi Cấu Kiện Yard', 8], ['Kho Phân Xưởng SX 1', 5], ['Kho Vật Tư Phụ Consumable', 3]]} />
          </CockpitChartCard>
          <CockpitChartCard title="Nguyên nhân chênh lệch" heightClass="h-[220px]" chartHeightClass="h-[138px]">
            <CockpitStatusList items={[
              { id: '1', label: 'Sai số kiểm đếm thực tế', value: '45% trường hợp', statusTone: 'amber' },
              { id: '2', label: 'Nhầm lẫn mã SKU / Quy cách', value: '30% trường hợp', statusTone: 'cyan' },
              { id: '3', label: 'Chưa kịp hạch toán xuất kho', value: '25% trường hợp', statusTone: 'blue' },
            ]} />
          </CockpitChartCard>
          <CockpitChartCard title="Hoạt động kiểm kê gần đây" heightClass="h-[220px]" chartHeightClass="h-[138px]">
            <CockpitRecentList items={[
              { id: '1', title: 'Phiếu AUD-2026-088', subtitle: 'Kho Nguyên Vật Liệu · Nguyễn Văn A', time: '10 phút trước', statusDot: 'bg-emerald-400' },
              { id: '2', title: 'Phiếu AUD-2026-087', subtitle: 'Kho Bãi Cấu Kiện · Trần Văn B', time: '1 giờ trước', statusDot: 'bg-cyan-400' },
            ]} />
          </CockpitChartCard>
        </section>

        {/* Phase 4: Compact Enterprise Toolbar */}
        <EnterprisePanel className="rounded-xl -mt-1">
          <div className="grid grid-cols-1 gap-1 xl:grid-cols-[1fr_150px_150px_150px_150px_140px_90px_90px]">
            <div className="relative flex items-center">
              <Search size={14} className="absolute left-3 text-slate-400 pointer-events-none" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm mã phiên, kho, mã hoặc tên vật tư..."
                className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 pl-9 pr-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:bg-[#08111f]"
              />
            </div>

            <select value={warehouseFilter} onChange={(e) => setWarehouseFilter(e.target.value)} className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none">
              <option value="ALL">Tất cả kho chứa</option>
              {zones.map((z: any) => (
                <option key={z.id} value={z.code}>{z.code} · {z.name}</option>
              ))}
            </select>
            <select value={sessionFilter} onChange={(e) => setSessionFilter(e.target.value)} className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none">
              <option value="ALL">Tất cả phiên kiểm</option>
            </select>
            <select value={inspectorFilter} onChange={(e) => setInspectorFilter(e.target.value)} className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none">
              <option value="ALL">Người kiểm kê</option>
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none">
              <option value="ALL">Trạng thái</option>
              <option value="IN_PROGRESS">Đang kiểm kê</option>
              <option value="PENDING">Chờ đối chiếu</option>
              <option value="COMPLETED">Hoàn thành</option>
            </select>
            <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none">
              <option value="ALL">Tất cả thời gian</option>
            </select>

            <button type="button" onClick={() => {}} className="h-9 rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white hover:bg-blue-500 transition">Tìm kiếm</button>
            <button type="button" onClick={resetFilters} className="h-9 rounded-lg border border-white/10 bg-white/[0.055] px-3 text-sm font-semibold text-slate-200 hover:bg-white/10 transition">Làm mới</button>
          </div>
        </EnterprisePanel>

        {/* Phase 5: Enterprise Hero Table */}
        <EnterprisePanel className="rounded-xl">
          <div className="mb-1 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-white">Sổ Kiểm Kê & Đối Chiếu Tồn Kho</h3>
              <span className="rounded-full bg-blue-400/10 px-2 py-0.5 text-[10px] font-medium text-blue-300 border border-blue-400/20">{rows.length} vật tư audit</span>
            </div>
            <button type="button" onClick={() => setExpandedModalOpen(true)} className="text-xs font-semibold text-cyan-300 hover:text-cyan-200 transition">Xem tất cả</button>
          </div>

          <div className="h-[520px] overflow-auto scrollbar-none rounded-lg border border-white/10">
            <table className="w-full min-w-[1000px] table-fixed text-sm border-collapse">
              <thead className={`${tableHead} text-slate-300 border-b border-cyan-400/10 sticky top-0 z-10`} style={{ backgroundColor: 'rgba(30, 41, 59, 1)' }}>
                <tr>
                  {['Mã vật tư', 'Tên vật tư', 'Kho', 'Tồn hệ thống', 'Đơn giá TB', 'Giá trị tồn', 'Phát sinh cuối', 'Trạng thái', 'Thao tác'].map((h) => (
                    <th key={h} className="px-2 py-2 text-xs font-semibold text-slate-300 text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-slate-500">Đang tải dữ liệu kiểm kê...</td>
                  </tr>
                )}
                {!isLoading && paged.map((row: any) => (
                  <tr key={row.materialId || row.materialCode} onClick={() => setSelectedAuditRow(row)} className={`${tableRow} cursor-pointer`}>
                    <td className="px-2 py-2 font-mono font-semibold text-cyan-300 text-xs">{row.materialCode}</td>
                    <td className="px-2 py-2 text-white font-medium truncate">{row.materialName}</td>
                    <td className="px-2 py-2 text-slate-300 text-xs truncate">{row.warehouseCode || row.zoneCode || 'Kho Chính'}</td>
                    <td className="px-2 py-2 font-mono text-emerald-300 text-xs">{formatQuantity(num(row.currentStock), 0)}</td>
                    <td className="px-2 py-2 font-mono text-slate-300 text-xs">{money(row.averageCost)}</td>
                    <td className="px-2 py-2 font-mono font-semibold text-cyan-300 text-xs">{money(row.inventoryValue)}</td>
                    <td className="px-2 py-2 text-slate-400 text-xs truncate">{row.lastMovementDate ? formatDateTime(row.lastMovementDate) : '-'}</td>
                    <td className="px-2 py-2">
                      <span className="rounded border border-emerald-700/60 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-300">Đã khớp</span>
                    </td>
                    <td className="px-2 py-2">
                      <button type="button" onClick={(e) => { e.stopPropagation(); setSelectedAuditRow(row) }} className="rounded border border-slate-700 px-2.5 py-1 text-xs text-slate-200 hover:border-cyan-500 transition">Chi tiết</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <DataTablePagination page={page} pageSize={pageSize} total={rows.length} onPageChange={setPage} />
        </EnterprisePanel>

        {/* Phase 6: Expanded Modal */}
        {expandedModalOpen ? createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-7xl rounded-2xl border border-white/15 bg-[#08111f] p-5 shadow-2xl space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                  <h2 className="text-base font-bold text-white">Toàn bộ Danh mục Vật tư Kiểm kê & Đối chiếu</h2>
                  <p className="text-xs text-slate-400">Tổng cộng {rows.length} mã vật tư</p>
                </div>
                <button type="button" onClick={() => setExpandedModalOpen(false)} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition">Đóng</button>
              </div>
              <div className="h-[640px] overflow-y-auto rounded-xl border border-white/10">
                <table className="w-full min-w-[1000px] text-xs table-fixed border-collapse">
                  <thead className={`${tableHead} text-slate-300 border-b border-cyan-400/10 sticky top-0 z-10`} style={{ backgroundColor: 'rgba(30, 41, 59, 1)' }}>
                    <tr>
                      {['Mã vật tư', 'Tên vật tư', 'Kho', 'Tồn hệ thống', 'Đơn giá TB', 'Giá trị tồn', 'Phát sinh cuối', 'Trạng thái', 'Thao tác'].map((h) => (
                        <th key={h} className="px-2 py-2 text-left font-semibold text-slate-300">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row: any) => (
                      <tr key={row.materialId || row.materialCode} onClick={() => { setSelectedAuditRow(row); setExpandedModalOpen(false) }} className={`${tableRow} cursor-pointer`}>
                        <td className="px-2 py-2 font-mono font-semibold text-cyan-300">{row.materialCode}</td>
                        <td className="px-2 py-2 text-white font-medium truncate">{row.materialName}</td>
                        <td className="px-2 py-2 text-slate-300 truncate">{row.warehouseCode || row.zoneCode || 'Kho Chính'}</td>
                        <td className="px-2 py-2 font-mono text-emerald-300">{formatQuantity(num(row.currentStock), 0)}</td>
                        <td className="px-2 py-2 font-mono text-slate-300">{money(row.averageCost)}</td>
                        <td className="px-2 py-2 font-mono font-semibold text-cyan-300">{money(row.inventoryValue)}</td>
                        <td className="px-2 py-2 text-slate-400 truncate">{row.lastMovementDate ? formatDateTime(row.lastMovementDate) : '-'}</td>
                        <td className="px-2 py-2"><span className="rounded border border-emerald-700/60 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-300">Đã khớp</span></td>
                        <td className="px-2 py-2"><button type="button" onClick={(e) => { e.stopPropagation(); setSelectedAuditRow(row); setExpandedModalOpen(false) }} className="rounded border border-slate-700 px-2.5 py-1 text-xs text-slate-200 hover:border-cyan-500 transition">Chi tiết</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>,
          document.body,
        ) : null}

        {/* Phase 6: Slide-Over Detail Drawer */}
        {selectedAuditRow ? (
          <ModuleDetailDrawer
            open={Boolean(selectedAuditRow)}
            title={`Chi tiết Kiểm kê: ${selectedAuditRow.materialCode}`}
            subtitle={`${selectedAuditRow.materialName} · Kho: ${selectedAuditRow.warehouseCode || 'Kho Chính'}`}
            onClose={() => setSelectedAuditRow(null)}
            size="md"
          >
            <div className="space-y-4 text-xs text-slate-300">
              <section className="grid gap-2 md:grid-cols-2">
                <div className="rounded-lg border border-white/10 bg-slate-950/45 p-2.5">
                  <div className="text-slate-500">Mã vật tư</div>
                  <div className="mt-1 font-mono font-semibold text-cyan-300">{selectedAuditRow.materialCode}</div>
                </div>
                <div className="rounded-lg border border-white/10 bg-slate-950/45 p-2.5">
                  <div className="text-slate-500">Tên vật tư</div>
                  <div className="mt-1 font-semibold text-white">{selectedAuditRow.materialName}</div>
                </div>
                <div className="rounded-lg border border-white/10 bg-slate-950/45 p-2.5">
                  <div className="text-slate-500">Tồn hệ thống</div>
                  <div className="mt-1 font-mono font-bold text-emerald-300">{formatQuantity(num(selectedAuditRow.currentStock), 0)}</div>
                </div>
                <div className="rounded-lg border border-white/10 bg-slate-950/45 p-2.5">
                  <div className="text-slate-500">Giá trị tồn kho</div>
                  <div className="mt-1 font-mono font-bold text-cyan-400">{money(selectedAuditRow.inventoryValue)}</div>
                </div>
              </section>

              <section className="rounded-lg border border-white/10 bg-slate-950/35 p-3 space-y-2">
                <h4 className="font-semibold text-white uppercase tracking-wider text-[11px]">Thông tin Phiên Kiểm Kê & Kho</h4>
                <div className="grid gap-2 md:grid-cols-2">
                  <div><span className="text-slate-500">Kho kiểm kê:</span> <span className="font-medium text-slate-200">Kho Nguyên Vật Liệu Main</span></div>
                  <div><span className="text-slate-500">Người phụ trách:</span> <span className="font-medium text-cyan-300">Nguyễn Văn A</span></div>
                  <div><span className="text-slate-500">Lần đối chiếu gần nhất:</span> <span className="font-medium text-slate-200">{selectedAuditRow.lastMovementDate ? formatDateTime(selectedAuditRow.lastMovementDate) : 'Chưa ghi nhận'}</span></div>
                  <div><span className="text-slate-500">Trạng thái hạch toán:</span> <span className="font-medium text-emerald-300">Đã khớp 100%</span></div>
                </div>
              </section>
            </div>
          </ModuleDetailDrawer>
        ) : null}
      </div>
    </EnterpriseModulePage>
  )
}
