import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Activity,
  Download,
  FileClock,
  Filter,
  Layers,
  RefreshCw,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react'

import { EnterpriseWorkspace } from '@/shared/ui/enterprise'
import {
  CockpitChartCard,
  CockpitEmptyState,
  CockpitKpiCard,
  CockpitStatusList,
  CockpitTableShell,
  DataTablePagination,
} from '@/shared/ui/cockpit'
import {
  ModuleLoadingState,
  moduleMutedButton,
} from '@/shared/ui/modules'
import { systemApi, type ActivityLog, type ActivitySummary } from '@/modules/system/api/system.api'
import { formatDateTime, formatQuantity } from '@/shared/utils/number-format'

const date = (value?: string) => (value ? formatDateTime(value) : '—')
const fmt = (value = 0) => formatQuantity(value, 0)

export function SystemLogsWorkspace() {
  const [query, setQuery] = useState('')
  const [moduleFilter, setModuleFilter] = useState('all')
  const [actionFilter, setActionFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const { data = [], isLoading, refetch } = useQuery<ActivityLog[]>({
    queryKey: ['system-activity-logs'],
    queryFn: systemApi.activityLogs,
    refetchInterval: 10000,
  })
  const { data: summary } = useQuery<ActivitySummary>({
    queryKey: ['system-activity-summary'],
    queryFn: systemApi.activitySummary,
    refetchInterval: 10000,
  })

  const modules = useMemo(
    () => Array.from(new Set(data.map((row) => row.module).filter(Boolean))) as string[],
    [data],
  )
  const actions = useMemo(
    () => Array.from(new Set(data.map((row) => row.action).filter(Boolean))),
    [data],
  )

  const filtered = useMemo(
    () =>
      data.filter((row) => {
        if (moduleFilter !== 'all' && row.module !== moduleFilter) return false
        if (actionFilter !== 'all' && row.action !== actionFilter) return false
        return `${row.action} ${row.entity} ${row.entityId ?? ''} ${row.module ?? ''} ${row.user?.username ?? ''}`
          .toLowerCase()
          .includes(query.toLowerCase())
      }),
    [actionFilter, data, moduleFilter, query],
  )

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, page, pageSize])

  const isFiltered = Boolean(query || moduleFilter !== 'all' || actionFilter !== 'all')

  const totalLogs = summary?.total ?? data.length
  const moduleCount = modules.length

  return (
    <EnterpriseWorkspace
      eyebrow="Quản trị"
      title="Nhật ký hệ thống"
      description="Theo dõi toàn bộ lịch sử thao tác, sự kiện và biến động dữ liệu trên hệ thống."
      breadcrumbs={['Quản trị', 'Nhật ký hệ thống']}
      actions={
        <div className="flex items-center gap-2">
          <button className={moduleMutedButton} onClick={() => refetch()} type="button">
            <RefreshCw size={14} /> Làm mới
          </button>
          <button className={moduleMutedButton} type="button">
            <Download size={14} /> Xuất Excel
          </button>
        </div>
      }
    >
      {/* 1. Operational KPIs */}
      <section className="grid gap-1 md:grid-cols-2 xl:grid-cols-4">
        <CockpitKpiCard
          title="Tổng lượt lưu vết"
          value={fmt(totalLogs)}
          note="Nhật ký sự kiện hệ thống"
          icon={<FileClock size={18} />}
          tone="cyan"
          state={isLoading ? 'loading' : 'normal'}
        />
        <CockpitKpiCard
          title="Module hoạt động"
          value={fmt(moduleCount)}
          note="Số phân hệ phát sinh log"
          icon={<Layers size={18} />}
          tone="blue"
          state={isLoading ? 'loading' : 'normal'}
        />
        <CockpitKpiCard
          title="Hành động khác nhau"
          value={fmt(actions.length)}
          note="Chủng loại thao tác"
          icon={<Activity size={18} />}
          tone="emerald"
          state={isLoading ? 'loading' : 'normal'}
        />
        <CockpitKpiCard
          title="Trạng thái giám sát"
          value="100%"
          note="Ghi nhận thời gian thực"
          icon={<ShieldCheck size={18} />}
          tone="purple"
          state={isLoading ? 'loading' : 'normal'}
        />
      </section>

      {/* 2. Toolbar & Quick Filters */}
      <section className="my-1 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-cyan-300/15 bg-slate-950/35 p-2">
        <div className="flex min-w-[260px] flex-1 items-center gap-2 rounded-lg border border-white/10 bg-slate-950/45 px-2">
          <Search size={14} className="text-cyan-300 shrink-0" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm hành động, đối tượng, người dùng..."
            className="h-8 w-full bg-transparent text-xs text-slate-100 outline-none placeholder:text-slate-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <Filter size={14} className="text-slate-400" />
          </div>
          <select
            value={moduleFilter}
            onChange={(event) => setModuleFilter(event.target.value)}
            className="h-8 rounded-lg border border-white/10 bg-slate-950/45 px-2 text-xs text-slate-200 outline-none focus:border-cyan-400"
          >
            <option value="all">Tất cả Module</option>
            {modules.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          <select
            value={actionFilter}
            onChange={(event) => setActionFilter(event.target.value)}
            className="h-8 rounded-lg border border-white/10 bg-slate-950/45 px-2 text-xs text-slate-200 outline-none focus:border-cyan-400"
          >
            <option value="all">Tất cả Hành động</option>
            {actions.map((act) => (
              <option key={act} value={act}>
                {act}
              </option>
            ))}
          </select>

          {isFiltered && (
            <button
              type="button"
              onClick={() => {
                setQuery('')
                setModuleFilter('all')
                setActionFilter('all')
              }}
              className="h-8 rounded-lg border border-red-500/30 bg-red-500/10 px-2 text-xs font-medium text-red-300 hover:bg-red-500/20 transition flex items-center gap-1 shrink-0"
              title="Xóa bộ lọc"
            >
              <X size={12} /> Xóa lọc
            </button>
          )}
        </div>
      </section>

      {/* 3. Hero Table & Right Analytics Rail */}
      <div className="grid gap-1 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="rounded-2xl border border-cyan-300/15 bg-slate-950/35 p-3 flex flex-col justify-between">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">Lịch sử sự kiện nhật ký hệ thống</h2>
              <span className="text-xs text-slate-500">{fmt(filtered.length)} bản ghi</span>
            </div>

            <CockpitTableShell className="min-h-[480px]">
              {filtered.length > 0 ? (
                <table className="w-full min-w-[750px] table-fixed text-[13px]">
                  <thead className="border-b border-cyan-400/10 bg-transparent text-slate-300">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium w-40">Thời gian</th>
                      <th className="px-3 py-2 text-left font-medium">Người thực hiện</th>
                      <th className="px-3 py-2 text-left font-medium">Hành động</th>
                      <th className="px-3 py-2 text-left font-medium">Đối tượng</th>
                      <th className="px-3 py-2 text-right font-medium">Module</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((row) => (
                      <tr key={row.id} className="border-b border-cyan-300/10 text-slate-300 hover:bg-cyan-300/[0.055] transition">
                        <td className="px-3 py-2 font-mono text-slate-400 text-xs">{date(row.createdAt)}</td>
                        <td className="px-3 py-2 truncate">
                          <span className="text-white font-medium">{row.user?.fullName ?? row.user?.username ?? row.userId ?? 'System'}</span>
                          <span className="block text-[11px] text-slate-500 font-mono">{row.user?.email ?? '—'}</span>
                        </td>
                        <td className="px-3 py-2">
                          <ActionBadge action={row.action} />
                        </td>
                        <td className="px-3 py-2 text-slate-300 truncate">
                          <span className="font-semibold text-slate-200">{row.entity}</span>
                          <span className="block text-[11px] text-slate-500 font-mono">{row.entityId ?? '—'}</span>
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-cyan-300 font-semibold">{row.module ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <CockpitEmptyState
                  title="Chưa có nhật ký ghi nhận"
                  description="Không tìm thấy nhật ký thỏa mãn điều kiện lọc."
                />
              )}
            </CockpitTableShell>
          </div>

          {filtered.length > 0 && (
            <DataTablePagination
              page={page}
              pageSize={pageSize}
              total={filtered.length}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[10, 20, 50]}
            />
          )}
        </section>

        <aside className="space-y-1">
          <CockpitChartCard title="Phân bố theo Module">
            <CockpitStatusList
              items={Object.entries(summary?.byModule ?? {})
                .slice(0, 6)
                .map(([m, count]) => ({
                  id: m,
                  label: m,
                  value: `${fmt(count)} sự kiện`,
                  statusTone: 'cyan',
                }))}
              emptyMessage="Chưa có dữ liệu module."
            />
          </CockpitChartCard>

          <CockpitChartCard title="Tần suất Hành động">
            <CockpitStatusList
              items={Object.entries(summary?.byAction ?? {})
                .slice(0, 6)
                .map(([act, count]) => ({
                  id: act,
                  label: act,
                  value: `${fmt(count)} lần`,
                  statusTone: 'emerald',
                }))}
              emptyMessage="Chưa có dữ liệu hành động."
            />
          </CockpitChartCard>
        </aside>
      </div>
    </EnterpriseWorkspace>
  )
}

function ActionBadge({ action }: { action: string }) {
  const lower = action.toLowerCase()
  const cls =
    lower.includes('delete') || lower.includes('xóa')
      ? 'border-red-500/30 bg-red-500/10 text-red-300'
      : lower.includes('create') || lower.includes('thêm')
        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
        : lower.includes('login') || lower.includes('đăng nhập')
          ? 'border-blue-500/30 bg-blue-500/10 text-blue-300'
          : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
  return <span className={`rounded-lg border px-2 py-0.5 text-[11px] font-medium ${cls}`}>{action}</span>
}
