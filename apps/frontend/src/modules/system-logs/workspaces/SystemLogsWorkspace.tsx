import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Download, FileClock, RefreshCw, Search } from 'lucide-react'

import { OperationalShell } from '@/shared/layouts/OperationalShell'
import {
  CompactDonutSummary,
  CompactTrendChart,
  HorizontalBars,
  inventoryInput,
  inventoryMutedButton,
  inventoryPanel,
  inventoryTableHead,
  inventoryTableRow,
  inventoryTableShell,
} from '@/modules/inventory/components/InventoryVisuals'
import { systemApi, type ActivityLog, type ActivitySummary } from '@/modules/system/api/system.api'
import { formatDateTime, formatQuantity } from '@/shared/utils/number-format'

const date = (value?: string) => value ? formatDateTime(value) : '-'
const fmt = (value = 0) => formatQuantity(value, 0)
const colors = ['#1d7cff', '#22c55e', '#f59e0b', '#8b5cf6', '#ef4444', '#38bdf8']

export function SystemLogsWorkspace() {
  const [query, setQuery] = useState('')
  const [moduleFilter, setModuleFilter] = useState('all')
  const [actionFilter, setActionFilter] = useState('all')
  const { data = [], refetch } = useQuery<ActivityLog[]>({
    queryKey: ['system-activity-logs'],
    queryFn: systemApi.activityLogs,
    refetchInterval: 10000,
  })
  const { data: summary } = useQuery<ActivitySummary>({
    queryKey: ['system-activity-summary'],
    queryFn: systemApi.activitySummary,
    refetchInterval: 10000,
  })
  const modules = Array.from(new Set(data.map((row) => row.module).filter(Boolean))) as string[]
  const actions = Array.from(new Set(data.map((row) => row.action).filter(Boolean)))
  const rows = useMemo(() => data.filter((row) => {
    if (moduleFilter !== 'all' && row.module !== moduleFilter) return false
    if (actionFilter !== 'all' && row.action !== actionFilter) return false
    return `${row.action} ${row.entity} ${row.entityId ?? ''} ${row.module ?? ''} ${row.user?.username ?? ''}`
      .toLowerCase()
      .includes(query.toLowerCase())
  }), [actionFilter, data, moduleFilter, query])
  const actionRows = Object.entries(summary?.byAction ?? {}).sort((a, b) => b[1] - a[1])
  const moduleRows = Object.entries(summary?.byModule ?? {}).sort((a, b) => b[1] - a[1]).slice(0, 6)
  const dayRows = Object.entries(summary?.byDay ?? {}).sort((a, b) => a[0].localeCompare(b[0])).slice(-6).map(([label, value]) => ({ label, value }))

  return (
    <OperationalShell>
      <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.14),transparent_30%),linear-gradient(135deg,#06111e_0%,#081827_52%,#0b1220_100%)] p-4 text-slate-100">
        <header className="flex flex-wrap items-end justify-between gap-3 pb-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">Nhật ký hệ thống</h1>
            <p className="mt-1 text-sm text-slate-400">Theo dõi tất cả hoạt động trong hệ thống</p>
          </div>
          <button className={inventoryMutedButton}><Download size={16} /> Xuất Excel</button>
        </header>

        <section className={`${inventoryPanel} p-3`}>
          <div className="flex flex-wrap gap-2">
            <div className="flex min-w-[280px] flex-1 items-center gap-2 rounded-lg border border-white/10 bg-slate-950/45 px-3">
              <Search size={15} className="text-cyan-400" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm hành động, đối tượng, người dùng..." className="h-9 w-full bg-transparent text-xs outline-none placeholder:text-slate-500" />
            </div>
            <select value={moduleFilter} onChange={(event) => setModuleFilter(event.target.value)} className={inventoryInput}>
              <option value="all">Module: Tất cả</option>
              {modules.map((module) => <option key={module} value={module}>{module}</option>)}
            </select>
            <select value={actionFilter} onChange={(event) => setActionFilter(event.target.value)} className={inventoryInput}>
              <option value="all">Loại hoạt động: Tất cả</option>
              {actions.map((action) => <option key={action} value={action}>{action}</option>)}
            </select>
            <button onClick={() => refetch()} className={inventoryMutedButton}><RefreshCw size={15} /> Làm mới</button>
          </div>
        </section>

        <div className="mt-3 grid gap-3 xl:grid-cols-[330px_1fr]">
          <aside className="space-y-3">
            <section className={`${inventoryPanel} p-4`}>
              <h2 className="text-sm font-semibold text-white">Tổng quan</h2>
              <div className="mt-4 space-y-3">
                <SummaryLine label="Tất cả hoạt động" value={fmt(summary?.total ?? data.length)} />
                {actionRows.slice(0, 6).map(([action, count]) => <SummaryLine key={action} label={action} value={fmt(count)} />)}
              </div>
            </section>
            <section className={`${inventoryPanel} p-4`}>
              <h2 className="text-sm font-semibold text-white">Hoạt động theo module</h2>
              <div className="mt-4">
                <CompactDonutSummary
                  segments={moduleRows.map(([label, value], index) => ({ label, value, color: colors[index % colors.length] }))}
                  centerValue={fmt(summary?.total ?? data.length)}
                  centerLabel="Nhật ký"
                />
              </div>
            </section>
            <section className={`${inventoryPanel} p-4`}>
              <h2 className="text-sm font-semibold text-white">Nhịp hoạt động</h2>
              <div className="mt-3"><CompactTrendChart rows={dayRows.length ? dayRows : [{ label: '-', value: 0 }]} /></div>
            </section>
          </aside>
          <section className={inventoryTableShell}>
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <h2 className="text-sm font-semibold text-white">Danh sách nhật ký ({fmt(rows.length)})</h2>
              <FileClock size={18} className="text-cyan-300" />
            </div>
            <table className="w-full text-sm">
              <thead className={inventoryTableHead}>
                <tr>
                  <th className="px-4 py-3 text-left">Thời gian</th>
                  <th className="px-4 py-3 text-left">Người dùng</th>
                  <th className="px-4 py-3 text-left">Hành động</th>
                  <th className="px-4 py-3 text-left">Đối tượng</th>
                  <th className="px-4 py-3 text-left">Module</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className={inventoryTableRow}>
                    <td className="px-4 py-3 text-slate-400">{date(row.createdAt)}</td>
                    <td className="px-4 py-3">
                      <span className="text-white">{row.user?.fullName ?? row.user?.username ?? row.userId ?? 'System'}</span>
                      <span className="block text-xs text-slate-500">{row.user?.email ?? '-'}</span>
                    </td>
                    <td className="px-4 py-3"><ActionBadge action={row.action} /></td>
                    <td className="px-4 py-3 text-slate-300">{row.entity}<span className="block text-xs text-slate-500">{row.entityId ?? '-'}</span></td>
                    <td className="px-4 py-3 text-cyan-300">{row.module ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      </main>
    </OperationalShell>
  )
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="truncate text-slate-400">{label}</span>
      <span className="font-medium text-cyan-300">{value}</span>
    </div>
  )
}

function ActionBadge({ action }: { action: string }) {
  const lower = action.toLowerCase()
  const cls = lower.includes('delete') || lower.includes('xóa')
    ? 'border-red-500/40 bg-red-500/10 text-red-300'
    : lower.includes('create') || lower.includes('thêm')
      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
      : lower.includes('login') || lower.includes('đăng nhập')
        ? 'border-blue-500/40 bg-blue-500/10 text-blue-300'
        : 'border-amber-500/40 bg-amber-500/10 text-amber-300'
  return <span className={`rounded-lg border px-2 py-1 text-xs font-medium ${cls}`}>{action}</span>
}
