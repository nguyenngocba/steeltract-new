import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import {
  Activity,
  AlertTriangle,
  Cpu,
  Database,
  Gauge,
  HardDrive,
  Network,
  RefreshCw,
  Server,
  ShieldAlert,
} from 'lucide-react'

import { getOperationsOverview, type OperationsAlert, type OperationsHealthItem } from '@/modules/operations-center/api/operations-center.api'
import { OperationalShell } from '@/shared/layouts/OperationalShell'
import {
  CockpitChartCard,
  CockpitEmptyState,
  CockpitKpiCard,
  CockpitRecentList,
  CockpitStatusList,
  CockpitTableShell,
  DataTablePagination,
} from '@/shared/ui/cockpit'
import { formatQuantity } from '@/shared/utils/number-format'

type OperationsTab =
  | 'overview'
  | 'runtime'
  | 'database'
  | 'jobs'
  | 'snapshot'
  | 'cache'
  | 'storage'
  | 'api'
  | 'events'
  | 'performance'
  | 'alerts'

const tabs: Array<{ id: OperationsTab; label: string }> = [
  { id: 'overview', label: 'Tổng quan' },
  { id: 'runtime', label: 'Runtime' },
  { id: 'database', label: 'Database' },
  { id: 'jobs', label: 'Background Jobs' },
  { id: 'snapshot', label: 'Snapshot' },
  { id: 'cache', label: 'Cache' },
  { id: 'storage', label: 'Storage' },
  { id: 'api', label: 'API' },
  { id: 'events', label: 'Events' },
  { id: 'performance', label: 'Performance' },
  { id: 'alerts', label: 'Alerts' },
]

const fmt = (value = 0, digits = 0) => formatQuantity(value, digits)

export function OperationsCenterPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedTab = searchParams.get('tab') as OperationsTab | null
  const activeTab = tabs.some((tab) => tab.id === requestedTab) ? requestedTab! : 'overview'
  const [page, setPage] = useState(1)
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['operations-center-overview'],
    queryFn: getOperationsOverview,
    refetchInterval: 10000,
  })

  const criticalCount = data?.alerts.filter((alert) => alert.severity === 'Critical').length ?? 0
  const warningCount = data?.alerts.filter((alert) => alert.severity === 'Warning').length ?? 0
  const healthScore = useMemo(() => {
    const rows = data?.systemHealth ?? []
    if (!rows.length) return 0
    const penalty = rows.reduce((total, row) => {
      if (row.status === 'critical') return total + 25
      if (row.status === 'warning') return total + 10
      if (row.status === 'unknown') return total + 5
      return total
    }, 0)
    return Math.max(0, Math.min(100, 100 - penalty))
  }, [data?.systemHealth])

  const scoreRows = useMemo(() => toScoreRows(data?.performanceScore), [data?.performanceScore])
  const apiRows = data?.apiRanking.byP95 ?? []
  const databaseRows = data?.database.tables ?? []
  const recentJobs = data?.jobs.recent ?? []
  const recentEvents = data?.events.recent ?? []
  const alerts = data?.alerts ?? []
  const pagedAlerts = alerts.slice((page - 1) * 8, page * 8)

  return (
    <OperationalShell>
      <main className="min-h-screen bg-[#050b14] p-2.5 text-slate-100 font-sans space-y-1">
        <div className="flex flex-wrap items-center justify-between gap-1 rounded-2xl border border-cyan-300/10 bg-slate-950/40 p-1">
          <div className="flex flex-wrap gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setSearchParams(tab.id === 'overview' ? {} : { tab: tab.id })
                  setPage(1)
                }}
                className={`h-9 rounded-xl px-3 text-[13px] font-medium transition ${
                  activeTab === tab.id
                    ? 'border border-cyan-300/25 bg-cyan-500/15 text-cyan-200 shadow-[0_0_22px_rgba(34,211,238,0.12)]'
                    : 'border border-transparent text-slate-400 hover:bg-white/[0.04] hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => void refetch()}
            className="flex h-9 items-center gap-2 rounded-xl border border-cyan-300/15 bg-white/[0.035] px-3 text-xs font-medium text-slate-300 transition hover:border-cyan-300/30 hover:bg-cyan-400/10"
          >
            <RefreshCw size={14} />
            Làm mới
          </button>
        </div>

        <section className="grid grid-cols-1 gap-1 sm:grid-cols-2 xl:grid-cols-4">
          <CockpitKpiCard
            title="System Health"
            value={isLoading ? '' : `${healthScore}/100`}
            trendText={criticalCount ? `${criticalCount} critical` : warningCount ? `${warningCount} warning` : 'Healthy'}
            tone={criticalCount ? 'red' : warningCount ? 'amber' : 'emerald'}
            state={isLoading ? 'loading' : 'normal'}
          />
          <CockpitKpiCard
            title="API Avg"
            value={isLoading ? '' : `${fmt(data?.runtime.averageResponseMs ?? 0)} ms`}
            trendText={`${fmt(data?.runtime.requestCount ?? 0)} requests`}
            tone="cyan"
            state={isLoading ? 'loading' : 'normal'}
          />
          <CockpitKpiCard
            title="Snapshot"
            value={isLoading ? '' : `${fmt(Number(data?.snapshots.runtime.hits ?? 0))} hit`}
            trendText={`${fmt(Number(data?.snapshots.runtime.misses ?? 0))} miss`}
            tone={Number(data?.snapshots.runtime.misses ?? 0) > 0 ? 'amber' : 'blue'}
            state={isLoading ? 'loading' : 'normal'}
          />
          <CockpitKpiCard
            title="Background Jobs"
            value={isLoading ? '' : fmt(sumValues(data?.jobs.counts))}
            trendText={`${fmt(data?.jobs.counts.FAILED ?? 0)} failed · ${fmt(data?.jobs.counts.RETRYING ?? 0)} retry`}
            tone={(data?.jobs.counts.FAILED ?? 0) > 0 ? 'red' : 'purple'}
            state={isLoading ? 'loading' : 'normal'}
          />
        </section>

        {activeTab === 'overview' ? (
          <OverviewWorkspace
            health={data?.systemHealth ?? []}
            scores={scoreRows}
            apiRows={apiRows}
            jobs={data?.jobs.counts ?? {}}
            snapshots={data?.snapshots.modules ?? []}
            cache={data?.cache}
            databaseRows={databaseRows}
            storage={data?.storage}
            alerts={alerts}
          />
        ) : null}

        {activeTab === 'runtime' ? (
          <RuntimeWorkspace runtime={data?.runtime} queryRows={data?.queryRanking.byAverage ?? []} />
        ) : null}

        {activeTab === 'database' ? (
          <TableWorkspace title="Database Growth Signals" rows={databaseRows} columns={['table', 'rows']} />
        ) : null}

        {activeTab === 'jobs' ? (
          <JobsWorkspace counts={data?.jobs.counts ?? {}} jobs={recentJobs} />
        ) : null}

        {activeTab === 'snapshot' ? (
          <SnapshotWorkspace snapshots={data?.snapshots.modules ?? []} runtime={data?.snapshots.runtime ?? {}} />
        ) : null}

        {activeTab === 'cache' ? (
          <CacheWorkspace cache={data?.cache} />
        ) : null}

        {activeTab === 'storage' ? (
          <StorageWorkspace storage={data?.storage} />
        ) : null}

        {activeTab === 'api' ? (
          <TableWorkspace title="API Ranking" rows={apiRows} columns={['method', 'endpoint', 'requestCount', 'averageLatencyMs', 'p95LatencyMs', 'averageSqlCount']} />
        ) : null}

        {activeTab === 'events' ? (
          <EventsWorkspace counts={data?.events.counts ?? {}} events={recentEvents} />
        ) : null}

        {activeTab === 'performance' ? (
          <PerformanceWorkspace performance={data?.performanceScore ?? {}} architecture={data?.architectureScore ?? {}} />
        ) : null}

        {activeTab === 'alerts' ? (
          <section className="overflow-hidden rounded-2xl border border-cyan-300/10 bg-slate-950/35">
            <div className="flex items-center justify-between border-b border-cyan-300/10 px-4 py-3">
              <h2 className="text-sm font-semibold text-white">System Alerts</h2>
              <ShieldAlert size={18} className="text-cyan-300" />
            </div>
            {alerts.length ? (
              <>
                <AlertTable rows={pagedAlerts} />
                <DataTablePagination page={page} pageSize={8} total={alerts.length} onPageChange={setPage} />
              </>
            ) : (
              <CockpitEmptyState icon={<ShieldAlert size={22} />} title="Không có cảnh báo" description="Operations Center chưa ghi nhận cảnh báo runtime." />
            )}
          </section>
        ) : null}
      </main>
    </OperationalShell>
  )
}

function OverviewWorkspace({
  health,
  scores,
  apiRows,
  jobs,
  snapshots,
  cache,
  databaseRows,
  storage,
  alerts,
}: {
  health: OperationsHealthItem[]
  scores: Array<{ label: string; value: number }>
  apiRows: Array<Record<string, unknown>>
  jobs: Record<string, number>
  snapshots: Array<{ id: string; label: string; count: number; ageSeconds: number | null; status: string }>
  cache?: { hitRate: number; entries: number; hits: number; snapshotHits: number; snapshotMisses: number }
  databaseRows: Array<{ table: string; rows: number }>
  storage?: { databaseBytes: number; attachmentBytes: number | null; storageRoot: string }
  alerts: OperationsAlert[]
}) {
  return (
    <div className="grid grid-cols-1 gap-1 xl:grid-cols-12">
      <div className="space-y-1 xl:col-span-9">
        <div className="grid grid-cols-1 gap-1 lg:grid-cols-3">
          <CockpitChartCard title="System Health" heightClass="h-[220px]">
            <HealthGrid rows={health} />
          </CockpitChartCard>
          <CockpitChartCard title="Performance Score" heightClass="h-[220px]">
            {scores.length ? <BarList rows={scores} suffix="%" /> : <CockpitEmptyState icon={<Gauge size={20} />} title="Chưa có score" description="Score sẽ xuất hiện sau khi có runtime traffic." />}
          </CockpitChartCard>
          <CockpitChartCard title="Cache / Snapshot" heightClass="h-[220px]">
            <CockpitStatusList
              items={[
                { id: 'hit-rate', label: 'Hit rate', value: `${fmt(cache?.hitRate ?? 0)}%`, statusTone: toneByScore(cache?.hitRate ?? 0) },
                { id: 'entries', label: 'Cache entries', value: fmt(cache?.entries ?? 0), statusTone: 'cyan' },
                { id: 'snapshot-hit', label: 'Snapshot hit', value: fmt(cache?.snapshotHits ?? 0), statusTone: 'emerald' },
                { id: 'snapshot-miss', label: 'Snapshot miss', value: fmt(cache?.snapshotMisses ?? 0), statusTone: (cache?.snapshotMisses ?? 0) > 0 ? 'amber' : 'blue' },
              ]}
            />
          </CockpitChartCard>
        </div>

        <div className="grid grid-cols-1 gap-1 lg:grid-cols-2">
          <CockpitChartCard title="API Ranking" heightClass="h-[300px]">
            {apiRows.length ? <ApiRanking rows={apiRows.slice(0, 7)} /> : <CockpitEmptyState icon={<Network size={20} />} title="Chưa có dữ liệu API" description="Dữ liệu sẽ xuất hiện khi phát sinh request qua runtime interceptor." />}
          </CockpitChartCard>
          <CockpitChartCard title="Database Tables" heightClass="h-[300px]">
            <BarList rows={databaseRows.slice(0, 7).map((row) => ({ label: row.table, value: row.rows }))} />
          </CockpitChartCard>
        </div>
      </div>

      <aside className="space-y-1 xl:col-span-3">
        <CockpitChartCard title="Background Jobs" heightClass="h-[170px]">
          <CockpitStatusList
            items={Object.entries(jobs).map(([status, count]) => ({
              id: status,
              label: status,
              value: fmt(count),
              statusTone: status.includes('FAILED') || status.includes('DEAD') ? 'red' : status.includes('RETRY') ? 'amber' : 'cyan',
            }))}
          />
        </CockpitChartCard>
        <CockpitChartCard title="Snapshot Freshness" heightClass="h-[170px]">
          <CockpitStatusList
            items={snapshots.map((row) => ({
              id: row.id,
              label: row.label,
              value: row.count ? `${row.ageSeconds ?? 0}s` : 'Missing',
              statusTone: row.status === 'healthy' ? 'emerald' : row.status === 'warning' ? 'amber' : 'red',
            }))}
          />
        </CockpitChartCard>
        <CockpitChartCard title="Storage" heightClass="h-[170px]">
          <CockpitStatusList
            items={[
              { id: 'db', label: 'Database', value: formatBytes(storage?.databaseBytes ?? 0), statusTone: 'cyan' },
              { id: 'attachments', label: 'Attachments path', value: storage?.attachmentBytes === null ? 'N/A' : formatBytes(storage?.attachmentBytes ?? 0), statusTone: storage?.attachmentBytes === null ? 'amber' : 'emerald' },
              { id: 'root', label: 'Storage root', value: storage?.storageRoot ?? '-', statusTone: 'blue' },
            ]}
          />
        </CockpitChartCard>
        <CockpitChartCard title="Alerts" heightClass="h-[220px]">
          {alerts.length ? (
            <CockpitRecentList
              items={alerts.slice(0, 5).map((alert) => ({
                id: alert.id,
                title: alert.title,
                subtitle: `${alert.source} · ${alert.description}`,
                statusDot: alert.severity === 'Critical' ? 'bg-red-400' : alert.severity === 'Warning' ? 'bg-amber-400' : 'bg-cyan-400',
              }))}
            />
          ) : (
            <CockpitEmptyState icon={<AlertTriangle size={20} />} title="Không có cảnh báo" description="Hệ thống chưa ghi nhận cảnh báo vận hành." />
          )}
        </CockpitChartCard>
      </aside>
    </div>
  )
}

function RuntimeWorkspace({ runtime, queryRows }: { runtime?: { uptimeSeconds: number; requestCount: number; averageResponseMs: number; slowRequestCount: number; slowQueryCount: number; memory: Record<string, number> }; queryRows: Array<Record<string, unknown>> }) {
  return (
    <div className="grid grid-cols-1 gap-1 xl:grid-cols-12">
      <div className="xl:col-span-4">
        <CockpitChartCard title="Runtime Metrics" heightClass="h-[300px]">
          <CockpitStatusList
            items={[
              { id: 'uptime', label: 'Uptime', value: `${fmt(Math.round((runtime?.uptimeSeconds ?? 0) / 60))} phút`, statusTone: 'emerald' },
              { id: 'requests', label: 'Requests', value: fmt(runtime?.requestCount ?? 0), statusTone: 'cyan' },
              { id: 'avg', label: 'Average response', value: `${fmt(runtime?.averageResponseMs ?? 0)} ms`, statusTone: 'blue' },
              { id: 'slow', label: 'Slow requests', value: fmt(runtime?.slowRequestCount ?? 0), statusTone: (runtime?.slowRequestCount ?? 0) > 0 ? 'amber' : 'emerald' },
              { id: 'heap', label: 'Heap used', value: formatBytes(runtime?.memory.heapUsedBytes ?? 0), statusTone: 'purple' },
            ]}
          />
        </CockpitChartCard>
      </div>
      <div className="xl:col-span-8">
        <TableWorkspace title="Top Queries" rows={queryRows} columns={['model', 'action', 'executionCount', 'averageTimeMs', 'maxTimeMs', 'p95TimeMs']} embedded />
      </div>
    </div>
  )
}

function JobsWorkspace({ counts, jobs }: { counts: Record<string, number>; jobs: Array<Record<string, unknown>> }) {
  return (
    <div className="grid grid-cols-1 gap-1 xl:grid-cols-12">
      <div className="xl:col-span-3">
        <CockpitChartCard title="Job Status" heightClass="h-[300px]">
          <CockpitStatusList items={Object.entries(counts).map(([label, value]) => ({ id: label, label, value: fmt(value), statusTone: label.includes('FAILED') || label.includes('DEAD') ? 'red' : label.includes('RETRY') ? 'amber' : 'cyan' }))} />
        </CockpitChartCard>
      </div>
      <div className="xl:col-span-9">
        <TableWorkspace title="Recent Jobs" rows={jobs} columns={['name', 'queue', 'status', 'retryCount', 'runAt', 'updatedAt']} embedded />
      </div>
    </div>
  )
}

function SnapshotWorkspace({ snapshots, runtime }: { snapshots: Array<Record<string, unknown>>; runtime: Record<string, unknown> }) {
  return (
    <div className="grid grid-cols-1 gap-1 xl:grid-cols-12">
      <div className="xl:col-span-4">
        <CockpitChartCard title="Snapshot Runtime" heightClass="h-[300px]">
          <CockpitStatusList items={Object.entries(runtime).map(([label, value]) => ({ id: label, label, value: String(value), statusTone: label.includes('miss') || label.includes('fallback') || label.includes('stale') ? 'amber' : 'emerald' }))} />
        </CockpitChartCard>
      </div>
      <div className="xl:col-span-8">
        <TableWorkspace title="Snapshot Modules" rows={snapshots} columns={['label', 'count', 'ageSeconds', 'status', 'updatedAt']} embedded />
      </div>
    </div>
  )
}

function CacheWorkspace({ cache }: { cache?: Record<string, unknown> }) {
  return (
    <CockpitChartCard title="Cache / Read Model Effectiveness" heightClass="h-[300px]">
      <CockpitStatusList items={Object.entries(cache ?? {}).map(([label, value]) => ({ id: label, label, value: String(value), statusTone: label.toLowerCase().includes('miss') || label.toLowerCase().includes('fallback') ? 'amber' : 'cyan' }))} />
    </CockpitChartCard>
  )
}

function StorageWorkspace({ storage }: { storage?: Record<string, unknown> }) {
  return (
    <TableWorkspace
      title="Storage"
      rows={[
        { metric: 'Database', value: formatBytes(Number(storage?.databaseBytes ?? 0)) },
        { metric: 'Attachments', value: storage?.attachmentBytes === null ? 'N/A' : formatBytes(Number(storage?.attachmentBytes ?? 0)) },
        { metric: 'Storage root', value: String(storage?.storageRoot ?? '-') },
      ]}
      columns={['metric', 'value']}
    />
  )
}

function EventsWorkspace({ counts, events }: { counts: Record<string, number>; events: Array<Record<string, unknown>> }) {
  return (
    <div className="grid grid-cols-1 gap-1 xl:grid-cols-12">
      <div className="xl:col-span-3">
        <CockpitChartCard title="Event Status" heightClass="h-[300px]">
          <CockpitStatusList items={Object.entries(counts).map(([label, value]) => ({ id: label, label, value: fmt(value), statusTone: label.includes('FAILED') || label.includes('DEAD') ? 'red' : label.includes('PENDING') ? 'amber' : 'emerald' }))} />
        </CockpitChartCard>
      </div>
      <div className="xl:col-span-9">
        <TableWorkspace title="Recent Events" rows={events} columns={['eventName', 'status', 'retryCount', 'nextAttemptAt', 'updatedAt']} embedded />
      </div>
    </div>
  )
}

function PerformanceWorkspace({ performance, architecture }: { performance: Record<string, number>; architecture: Record<string, number> }) {
  return (
    <div className="grid grid-cols-1 gap-1 xl:grid-cols-2">
      <CockpitChartCard title="Performance Score" heightClass="h-[300px]">
        <BarList rows={toScoreRows(performance)} suffix="%" />
      </CockpitChartCard>
      <CockpitChartCard title="Architecture Score" heightClass="h-[300px]">
        <BarList rows={toScoreRows(architecture)} suffix="%" />
      </CockpitChartCard>
    </div>
  )
}

function TableWorkspace({ title, rows, columns, embedded = false }: { title: string; rows: Array<Record<string, unknown>>; columns: string[]; embedded?: boolean }) {
  return (
    <section className={embedded ? '' : 'overflow-hidden rounded-2xl border border-cyan-300/10 bg-slate-950/35'}>
      {!embedded ? (
        <div className="flex items-center justify-between border-b border-cyan-300/10 px-4 py-3">
          <h2 className="text-sm font-semibold text-white">{title}</h2>
          <Database size={18} className="text-cyan-300" />
        </div>
      ) : (
        <h2 className="mb-2 text-sm font-semibold text-white">{title}</h2>
      )}
      {rows.length ? (
        <CockpitTableShell className="h-[520px]">
          <table className="w-full min-w-[900px] table-fixed text-[13px]">
            <thead className="border-b border-cyan-400/10 bg-transparent text-slate-300">
              <tr>
                {columns.map((column) => <th key={column} className="px-3 py-2 text-left font-medium">{column}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={String(row.id ?? row.table ?? row.name ?? row.eventName ?? index)} className="border-b border-white/5 transition hover:bg-cyan-400/[0.035]">
                  {columns.map((column) => <td key={column} className="truncate px-3 py-2 text-slate-300">{displayCell(row[column])}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </CockpitTableShell>
      ) : (
        <CockpitEmptyState icon={<Database size={22} />} title="Chưa có dữ liệu" description="Dữ liệu sẽ xuất hiện khi runtime ghi nhận hoạt động thật." />
      )}
    </section>
  )
}

function HealthGrid({ rows }: { rows: OperationsHealthItem[] }) {
  if (!rows.length) {
    return <CockpitEmptyState icon={<Server size={20} />} title="Chưa có health data" description="Runtime metrics chưa có dữ liệu." />
  }
  return (
    <div className="grid grid-cols-2 gap-1">
      {rows.map((row) => (
        <div key={row.id} className="rounded-xl border border-white/5 bg-white/[0.02] p-2">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-[11px] text-slate-400">{row.label}</span>
            <span className={`h-2 w-2 rounded-full ${statusDot(row.status)}`} />
          </div>
          <div className="mt-1 truncate text-sm font-semibold text-white">{row.value}</div>
          <div className="mt-0.5 truncate text-[10px] text-slate-500">{row.detail ?? '-'}</div>
        </div>
      ))}
    </div>
  )
}

function ApiRanking({ rows }: { rows: Array<Record<string, unknown>> }) {
  return (
    <div className="space-y-1">
      {rows.map((row, index) => (
        <div key={`${row.method}-${row.endpoint}-${index}`} className="grid grid-cols-[1fr_auto_auto] items-center gap-2 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2 text-xs">
          <div className="min-w-0">
            <div className="truncate font-medium text-slate-200">{String(row.endpoint ?? '-')}</div>
            <div className="text-[10px] text-slate-500">{String(row.method ?? '-')} · {fmt(Number(row.requestCount ?? 0))} req</div>
          </div>
          <span className="font-mono text-cyan-300">{fmt(Number(row.averageLatencyMs ?? 0))}ms</span>
          <span className="font-mono text-amber-300">p95 {fmt(Number(row.p95LatencyMs ?? 0))}</span>
        </div>
      ))}
    </div>
  )
}

function BarList({ rows, suffix = '' }: { rows: Array<{ label: string; value: number }>; suffix?: string }) {
  const max = Math.max(...rows.map((row) => row.value), 1)
  if (!rows.length) {
    return <CockpitEmptyState icon={<Activity size={20} />} title="Chưa có dữ liệu" description="Dữ liệu sẽ xuất hiện khi phát sinh nghiệp vụ." />
  }
  return (
    <div className="space-y-2">
      {rows.map((row) => (
        <div key={row.label}>
          <div className="mb-1 flex items-center justify-between gap-2 text-xs">
            <span className="truncate text-slate-300">{row.label}</span>
            <span className="font-mono text-cyan-300">{fmt(row.value)}{suffix}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
            <div className="h-full rounded-full bg-cyan-400" style={{ width: `${Math.max(4, Math.min(100, (row.value / max) * 100))}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function AlertTable({ rows }: { rows: OperationsAlert[] }) {
  return (
    <CockpitTableShell className="h-[520px]">
      <table className="w-full min-w-[900px] table-fixed text-[13px]">
        <thead className="border-b border-cyan-400/10 bg-transparent text-slate-300">
          <tr>
            <th className="px-3 py-2 text-left font-medium">Severity</th>
            <th className="px-3 py-2 text-left font-medium">Title</th>
            <th className="px-3 py-2 text-left font-medium">Source</th>
            <th className="px-3 py-2 text-left font-medium">Description</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-white/5 transition hover:bg-cyan-400/[0.035]">
              <td className="px-3 py-2"><SeverityPill severity={row.severity} /></td>
              <td className="truncate px-3 py-2 text-white">{row.title}</td>
              <td className="truncate px-3 py-2 text-cyan-300">{row.source}</td>
              <td className="truncate px-3 py-2 text-slate-300">{row.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </CockpitTableShell>
  )
}

function SeverityPill({ severity }: { severity: OperationsAlert['severity'] }) {
  const cls = severity === 'Critical'
    ? 'border-red-500/35 bg-red-500/10 text-red-300'
    : severity === 'Warning'
      ? 'border-amber-500/35 bg-amber-500/10 text-amber-300'
      : 'border-cyan-500/35 bg-cyan-500/10 text-cyan-300'
  return <span className={`rounded-lg border px-2 py-0.5 text-[11px] font-medium ${cls}`}>{severity}</span>
}

function toScoreRows(score?: Record<string, number>) {
  return Object.entries(score ?? {})
    .map(([label, value]) => ({ label, value: Number(value ?? 0) }))
    .sort((a, b) => b.value - a.value)
}

function sumValues(values?: Record<string, number>) {
  return Object.values(values ?? {}).reduce((total, value) => total + Number(value ?? 0), 0)
}

function toneByScore(value: number): 'emerald' | 'amber' | 'red' {
  if (value >= 80) return 'emerald'
  if (value >= 40) return 'amber'
  return 'red'
}

function statusDot(status: string) {
  if (status === 'healthy') return 'bg-emerald-400'
  if (status === 'warning') return 'bg-amber-400'
  if (status === 'critical') return 'bg-red-400'
  return 'bg-slate-500'
}

function displayCell(value: unknown) {
  if (value === null || value === undefined) return '-'
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'number') return fmt(value, Number.isInteger(value) ? 0 : 1)
  if (typeof value === 'string') return value
  return JSON.stringify(value)
}

function formatBytes(value: number) {
  if (!Number.isFinite(value) || value <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let size = value
  let unitIndex = 0
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex += 1
  }
  return `${size >= 10 ? size.toFixed(0) : size.toFixed(1)} ${units[unitIndex]}`
}
