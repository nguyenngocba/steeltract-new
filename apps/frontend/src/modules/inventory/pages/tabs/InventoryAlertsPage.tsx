import { useMemo, useState } from 'react'
import { AlertCircle, AlertTriangle, CheckCircle, CircleDollarSign, PackageCheck, RefreshCw, ShieldX, TriangleAlert } from 'lucide-react'

import { EnterpriseModulePage } from '../../../../shared/runtime-tabs/EnterpriseModulePage'
import { InventoryTabWorkspace } from '../../components/InventoryTabWorkspace'
import {
  CompactDonutSummary,
  HorizontalBars,
  InventoryChartCard,
  InventoryPagination,
  InventoryPanel,
  inventoryInput,
  inventoryTableHead,
  inventoryTableRow,
  inventoryTableShell,
  inventoryMutedButton,
} from '../../components/InventoryVisuals'
import { useInventoryItems } from '../../hooks/useInventoryItems'
import { useZones } from '../../hooks/useZones'
import { formatQuantity } from '@/shared/utils/number-format'

// ================= COMPONENT SPARKLINE =================
function KpiSparkline({ values, line, fill }: { values: number[]; line: string; fill: string }) {
  const rows = values.length ? values : [0, 0, 0, 0, 0, 0]
  const min = Math.min(...rows)
  const max = Math.max(...rows)
  const range = Math.max(1, max - min)
  const points = rows.map((value, index) => {
    const x = rows.length <= 1 ? 0 : (index / (rows.length - 1)) * 100
    const y = 34 - ((value - min) / range) * 24 - 5
    return `${x},${y}`
  }).join(' ')
  return (
    <svg viewBox="0 0 100 34" preserveAspectRatio="none" className="absolute inset-x-3 bottom-1 h-9 w-[calc(100%-24px)] opacity-95">
      <polyline points={`0,34 ${points} 100,34`} fill={fill} stroke="none" />
      <polyline points={points} fill="none" stroke={line} strokeWidth="1.8" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

// ================= COMPONENT METRIC CARD =================
function OverviewMetricCard({
  title,
  value,
  note,
  tone = 'blue',
  icon,
  trend,
  active,
  onClick,
}: {
  title: string
  value: string
  note?: string
  tone?: 'blue' | 'emerald' | 'cyan' | 'amber' | 'red' | 'purple'
  icon: React.ReactNode
  trend: number[]
  active?: boolean
  onClick?: () => void
}) {
  const color: Record<string, { text: string; bg: string; line: string; fill: string; note: string }> = {
    blue: { text: 'text-blue-300', bg: 'bg-blue-500/10', line: '#1d7cff', fill: 'rgba(29,124,255,0.24)', note: 'text-emerald-400' },
    emerald: { text: 'text-emerald-300', bg: 'bg-emerald-500/10', line: '#10b981', fill: 'rgba(16,185,129,0.22)', note: 'text-emerald-400' },
    cyan: { text: 'text-cyan-300', bg: 'bg-cyan-500/10', line: '#06b6d4', fill: 'rgba(6,182,212,0.22)', note: 'text-emerald-400' },
    amber: { text: 'text-amber-300', bg: 'bg-amber-500/10', line: '#f59e0b', fill: 'rgba(245,158,11,0.18)', note: 'text-red-400' },
    red: { text: 'text-red-300', bg: 'bg-red-500/10', line: '#ef4444', fill: 'rgba(239,68,68,0.18)', note: 'text-red-400' },
    purple: { text: 'text-purple-300', bg: 'bg-purple-500/10', line: '#a855f7', fill: 'rgba(168,85,247,0.18)', note: 'text-emerald-400' },
  }
  const item = color[tone]
  const content = (
    <>
      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">{title}</div>
          <div className="mt-2 truncate text-xl font-semibold tracking-tight text-white">{value}</div>
          {note ? <div className={`mt-1 truncate text-[11px] font-semibold ${item.note}`}>{note}</div> : null}
        </div>
        <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${item.bg} ${item.text}`}>
          {icon}
        </div>
      </div>
      <KpiSparkline values={trend} line={item.line} fill={item.fill} />
    </>
  )
  const className = `relative h-[108px] overflow-hidden rounded-xl border bg-slate-950/45 p-3 text-left shadow-[0_14px_42px_rgba(0,0,0,0.2)] ring-1 ring-white/[0.025] transition ${
    active ? 'border-cyan-400/55 bg-cyan-400/10' : 'border-white/10'
  } ${onClick ? 'cursor-pointer hover:border-cyan-400/35 hover:bg-white/[0.055]' : ''}`
  if (onClick) return <button type="button" onClick={onClick} className={className}>{content}</button>
  return <section className={className}>{content}</section>
}

// ================= PAGINATION (giống bên Tồn kho) =================
function num(v: any) {
  const n = Number(v ?? 0)
  return Number.isFinite(n) ? n : 0
}

export function InventoryAlertsPage() {
  const { data: materials = [] } = useInventoryItems()
  const { data: zones = [] } = useZones()
  const [severityFilter, setSeverityFilter] = useState('')
  const [zoneFilter, setZoneFilter] = useState('')
  const [searchDraft, setSearchDraft] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 10
  // Hàm tìm kiếm
  const applySearch = () => {
    setSearch(searchDraft)
    setPage(1)
  }
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  // Hàm reset
  const resetFilters = () => {
    setSearchDraft('')
    setSearch('')
    setSeverityFilter('')
    setZoneFilter('')
    setStatusFilter('')
    setTypeFilter('')
    setPage(1)
  }

  const alerts = useMemo(() => {
    return (materials as any[])
      .map((m: any) => {
        const qty = num(m.quantity)
        const min = num(m.minimumStock)
        const level = qty <= 0 ? 'Nghiêm trọng' : qty <= min ? 'Thấp' : qty >= min * 8 && min > 0 ? 'Vượt mức tồn' : ''
        return {
          ...m,
          qty,
          min,
          level,
          alertType: qty <= 0 ? 'Hết hàng' : qty <= min ? 'Thấp tồn' : qty >= min * 8 && min > 0 ? 'Vượt mức tồn' : '',
          zoneCode: m.zoneCode ?? zones[0]?.code ?? 'KHO-A-01',
          status: qty <= 0 || qty <= min ? 'Chưa xử lý' : 'Đã xử lý',
        }
      })
      .filter((x: any) => x.level)
      .filter((x: any) => {
        if (severityFilter && x.level !== severityFilter) return false
        if (zoneFilter && x.zoneCode !== zoneFilter) return false
        if (statusFilter && x.status !== statusFilter) return false
        if (typeFilter && x.alertType !== typeFilter) return false   // thêm dòng này
        if (search.trim()) {
          const q = search.toLowerCase()
          return `${x.code} ${x.name}`.toLowerCase().includes(q)
        }
        return true
      })
    }, [materials, zones, severityFilter, zoneFilter, statusFilter, search])

  const kpi = useMemo(() => {
    const critical = alerts.filter((x: any) => x.level === 'Nghiêm trọng').length
    const low = alerts.filter((x: any) => x.level === 'Thấp').length
    const warning = alerts.filter((x: any) => x.alertType === 'Sắp hết hạn').length
    const over = alerts.filter((x: any) => x.alertType === 'Vượt mức tồn').length
    const total = alerts.length
    const processed = alerts.filter((x: any) => x.status === 'Đã xử lý').length
    return { critical, low, warning, over, total, processed }
  }, [alerts])

  const byLevel = useMemo(() => {
    const m = new Map<string, number>()
    alerts.forEach((x: any) => m.set(x.level, (m.get(x.level) ?? 0) + 1))
    return Array.from(m.entries())
  }, [alerts])
  const byType = useMemo(() => {
    const m = new Map<string, number>()
    alerts.forEach((x: any) => m.set(x.alertType, (m.get(x.alertType) ?? 0) + 1))
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1])
  }, [alerts])
  const criticalList = useMemo(() => alerts.filter((x: any) => x.level === 'Nghiêm trọng').slice(0, 8), [alerts])

  const levelSegments = useMemo(() => byLevel.map(([label, value], index) => ({
    label,
    value,
    color: ['#ef4444', '#f59e0b', '#1d7cff', '#14c987'][index % 4],
  })), [byLevel])

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize
    return alerts.slice(start, start + pageSize)
  }, [alerts, page])
  const pageCount = Math.max(1, Math.ceil(alerts.length / pageSize))
  const filterInput =
  'h-9 w-full rounded-md border border-white/10 bg-slate-950/45 px-2 text-xs text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:bg-slate-950/65'

  
  return (
    <EnterpriseModulePage>
      <InventoryTabWorkspace />

      <div className="space-y-1 -mt-2">
        <div className="grid grid-cols-1 md:grid-cols-3 2xl:grid-cols-6 gap-1.5">
          <OverviewMetricCard
            title="Cảnh báo nghiêm trọng"
            value={formatQuantity(kpi.critical, 0)}
            note="Hết hàng"
            tone="red"
            icon={<AlertCircle size={15} />}
            trend={[0,0,0,0,0,0]}
          />
          <OverviewMetricCard
            title="Cảnh báo thấp tồn"
            value={formatQuantity(kpi.low, 0)}
            note="Dưới ngưỡng"
            tone="amber"
            icon={<AlertTriangle size={15} />}
            trend={[0,0,0,0,0,0]}
          />
          <OverviewMetricCard
            title="Sắp hết hạn"
            value={formatQuantity(kpi.warning, 0)}
            note="Theo hạn dùng"
            tone="purple"
            icon={<TriangleAlert size={15} />}
            trend={[0,0,0,0,0,0]}
          />
          <OverviewMetricCard
            title="Vượt mức tồn"
            value={formatQuantity(kpi.over, 0)}
            note="Tồn quá cao"
            tone="cyan"
            icon={<CircleDollarSign size={15} />}
            trend={[0,0,0,0,0,0]}
          />
          <OverviewMetricCard
            title="Tổng cảnh báo"
            value={formatQuantity(kpi.total, 0)}
            note="Đang theo dõi"
            tone="blue"
            icon={<RefreshCw size={15} />}
            trend={[0,0,0,0,0,0]}
          />
          <OverviewMetricCard
            title="Đã xử lý"
            value={formatQuantity(kpi.processed, 0)}
            note="Đã đóng"
            tone="emerald"
            icon={<CheckCircle size={15} />}
            trend={[0,0,0,0,0,0]}
          />
        </div>

        <InventoryPanel className="rounded-xl p-0.5">
          <div className="grid grid-cols-1 gap-1 xl:grid-cols-[180px_180px_180px_180px_minmax(260px,1fr)_130px_120px]">
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className={filterInput}
            >
              <option value="">Mức độ cảnh báo</option>
              <option value="Nghiêm trọng">Nghiêm trọng</option>
              <option value="Thấp">Thấp</option>
            </select>
            <select
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
              className={filterInput}
            >
              <option value="">Kho</option>
              {[...new Set(alerts.map((a: any) => a.zoneCode))].map((z) => (
                <option key={z} value={z}>{z}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={filterInput}
            >
              <option value="">Trạng thái</option>
              <option value="Chưa xử lý">Chưa xử lý</option>
              <option value="Đã xử lý">Đã xử lý</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className={filterInput}
            >
              <option value="">Loại cảnh báo</option>
              <option value="Hết hàng">Hết hàng</option>
              <option value="Thấp tồn">Thấp tồn</option>
              <option value="Vượt mức tồn">Vượt mức tồn</option>
            </select>
            <input
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') applySearch()
              }}
              placeholder="Tìm mã vật tư, tên vật tư..."
              className={filterInput}
            />
            <button
              onClick={applySearch}
              className="h-9 self-end rounded-md bg-blue-600 px-2 text-xs font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500"
            >
              Tìm kiếm
            </button>
            <button
              onClick={resetFilters}
              className="h-9 self-end rounded-md border border-white/10 bg-white/[0.055] px-2 text-xs font-semibold text-slate-200 transition hover:bg-white/10"
            >
              Làm mới
            </button>
          </div>
        </InventoryPanel>

        <div className={`grid grid-cols-1 xl:grid-cols-12 gap-1.5`}>
          <InventoryPanel title="Danh sách cảnh báo tồn kho" className="xl:col-span-9 p-0">
            <div className={`${inventoryTableShell} overflow-auto`}>
              <table className="w-full min-w-[1180px] text-sm">
                <thead className={inventoryTableHead}>
                  <tr>
                    {['Mức độ', 'Loại cảnh báo', 'Mã vật tư', 'Tên vật tư', 'Kho', 'Tồn hiện tại', 'Ngưỡng cảnh báo', 'Đơn vị', 'Trạng thái', 'Hành động'].map((h) => (
                      <th key={h} className="px-3 py-2 text-left font-medium">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paged.map((x: any) => (
                    <tr key={x.id} className={inventoryTableRow}>
                      <td className="px-3 py-1.5">
                        <span className={`rounded-lg border px-2 py-0.5 text-xs ${x.level === 'Nghiêm trọng' ? 'border-red-400/40 bg-red-500/10 text-red-300' : 'border-amber-400/40 bg-amber-500/10 text-amber-300'}`}>{x.level}</span>
                      </td>
                      <td className="px-3 py-1.5">{x.alertType}</td>
                      <td className="px-3 py-1.5 text-cyan-300">{x.code}</td>
                      <td className="px-3 py-1.5">{x.name}</td>
                      <td className="px-3 py-1.5">{x.zoneCode}</td>
                      <td className="px-3 py-1.5">{formatQuantity(x.qty, 0)}</td>
                      <td className="px-3 py-1.5">{formatQuantity(x.min, 0)}</td>
                      <td className="px-3 py-1.5">{x.unit ?? '-'}</td>
                      <td className="px-3 py-1.5">
                        <span className={`rounded border px-2 py-0.5 text-xs ${
                          x.status === 'Đã xử lý'
                            ? 'border-emerald-700/60 bg-emerald-500/10 text-emerald-300'
                            : 'border-amber-700/60 bg-amber-500/10 text-amber-300'
                        }`}>
                          {x.status}
                        </span>
                      </td>
                      <td className="px-3 py-1.5 text-slate-400">⋯</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <InventoryPagination page={page} pageCount={pageCount} total={alerts.length} pageSize={pageSize} onPageChange={setPage} containerClassName="grid grid-cols-1 items-center gap-2 px-4 py-2 text-xs text-slate-400 md:grid-cols-3" />
          </InventoryPanel>

          <div className="space-y-1.5 xl:col-span-3">
            <InventoryChartCard title="Phân bổ cảnh báo theo mức độ" className="p-2">
              <CompactDonutSummary segments={levelSegments} centerValue={formatQuantity(kpi.total, 0)} centerLabel="cảnh báo" />
            </InventoryChartCard>
            <InventoryChartCard title="Cảnh báo theo loại" className="p-2">
              <HorizontalBars rows={byType} valueFormatter={(value) => formatQuantity(value, 0)} />
            </InventoryChartCard>
            <InventoryChartCard title="Cảnh báo nghiêm trọng" className="p-2">
              <div className="space-y-1">
                {criticalList.map((x: any) => (
                  <div key={x.id} className="rounded border border-white/10 p-2 text-xs text-slate-300">
                    <div className="text-red-300">
                      {x.code} - {x.name}
                    </div>
                    <div className="text-slate-500">{x.zoneCode}</div>
                  </div>
                ))}
                {criticalList.length === 0 && (
                  <div className="text-center text-xs text-slate-500 py-4">Không có cảnh báo nghiêm trọng</div>
                )}
              </div>
            </InventoryChartCard>
          </div>
        </div>
      </div>
    </EnterpriseModulePage>
  )
}
