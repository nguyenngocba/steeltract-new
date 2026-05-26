import {
  Activity,
  AlertTriangle,
  BarChart3,
  Boxes,
  CheckCircle2,
  Cpu,
  DatabaseBackup,
  Factory,
  FileText,
  Gauge,
  LineChart,
  LockKeyhole,
  Map,
  Package,
  Search,
  Settings,
  ShieldCheck,
  Truck,
  Users,
} from 'lucide-react'
import {
  type ReactNode,
  useMemo,
  useState,
} from 'react'

import {
  PageLayout,
  StatusBadge,
} from '../../components/ui-system'

type Tone =
  | 'blue'
  | 'green'
  | 'amber'
  | 'red'
  | 'purple'
  | 'cyan'

export interface CockpitMetric {
  label: string
  value: string | number
  sub: string
  tone: Tone
  icon?: ReactNode
}

export interface CockpitTab {
  id: string
  label: string
  purpose: string
  kpis: CockpitMetric[]
  tableTitle: string
  tableColumns: string[]
  rows: string[][]
  charts: Array<{
    title: string
    type: 'line' | 'donut' | 'bars' | 'heatmap' | 'gantt' | 'map'
    values: number[]
    labels?: string[]
  }>
  alerts: Array<{
    title: string
    detail: string
    tone: 'info' | 'success' | 'warning' | 'danger'
  }>
}

export interface CockpitConfig {
  title: string
  description: string
  primaryAction: string
  tabs: CockpitTab[]
  sampleNote?: string
}

const toneClassName: Record<Tone, string> = {
  blue: 'border-blue-400/20 bg-blue-500/10 text-blue-200 from-blue-500',
  green: 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200 from-emerald-500',
  amber: 'border-amber-400/20 bg-amber-500/10 text-amber-200 from-amber-500',
  red: 'border-red-400/20 bg-red-500/10 text-red-200 from-red-500',
  purple: 'border-violet-400/20 bg-violet-500/10 text-violet-200 from-violet-500',
  cyan: 'border-cyan-400/20 bg-cyan-500/10 text-cyan-200 from-cyan-500',
}

const defaultIcons = [
  Boxes,
  Factory,
  ShieldCheck,
  Truck,
  Gauge,
  Activity,
  Users,
  DatabaseBackup,
]

function formatPercent(value: number) {
  return `${Math.round(value)}%`
}

function KpiCard({
  metric,
  index,
}: {
  metric: CockpitMetric
  index: number
}) {
  const Icon =
    metric.icon ??
    (() => {
      const DefaultIcon =
        defaultIcons[index % defaultIcons.length]
      return <DefaultIcon className="h-5 w-5" />
    })()

  return (
    <div className="relative overflow-hidden rounded-xl border border-cyan-500/10 bg-[#0a1624] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div
        className={`absolute inset-0 bg-gradient-to-br ${toneClassName[metric.tone]} to-transparent opacity-70`}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-zinc-500">
            {metric.label}
          </p>
          <p className="mt-2 text-2xl font-semibold text-white">
            {metric.value}
          </p>
          <p className="mt-1 text-xs text-emerald-300">
            {metric.sub}
          </p>
        </div>
        <span
          className={`rounded-xl border p-2 ${toneClassName[metric.tone]}`}
        >
          {Icon}
        </span>
      </div>
      <div className="relative mt-3 flex h-7 items-end gap-1">
        {[18, 26, 21, 34, 42, 38, 49, 58].map((item, sparkIndex) => (
          <span
            key={sparkIndex}
            className={`flex-1 rounded-t bg-gradient-to-t ${toneClassName[metric.tone].split(' ').find((itemClass) => itemClass.startsWith('from-'))} to-transparent`}
            style={{
              height: `${item - index * 2 + sparkIndex}%`,
              opacity: 0.38 + sparkIndex / 14,
            }}
          />
        ))}
      </div>
    </div>
  )
}

function LinePanel({
  values,
  labels,
}: {
  values: number[]
  labels?: string[]
}) {
  const max = Math.max(...values, 1)

  return (
    <div className="flex h-48 items-end gap-2 border-b border-l border-cyan-500/10 px-3 pb-4">
      {values.map((value, index) => (
        <div
          key={index}
          className="flex flex-1 flex-col items-center gap-2"
        >
          <div
            className="w-full rounded-t bg-gradient-to-t from-blue-500 to-cyan-300 shadow-[0_0_16px_rgba(37,99,235,0.28)]"
            style={{
              height: `${Math.max((value / max) * 100, 8)}%`,
            }}
          />
          <span className="text-[10px] text-zinc-500">
            {labels?.[index] ?? `D${index + 1}`}
          </span>
        </div>
      ))}
    </div>
  )
}

function DonutPanel({
  values,
  labels,
}: {
  values: number[]
  labels?: string[]
}) {
  const colors = [
    '#2563eb',
    '#10b981',
    '#f59e0b',
    '#ef4444',
    '#8b5cf6',
    '#06b6d4',
  ]
  const total =
    values.reduce((sum, value) => sum + value, 0) || 1
  let cursor = 0
  const gradient = values
    .map((value, index) => {
      const start = cursor
      const width = (value / total) * 100
      cursor += width
      return `${colors[index % colors.length]} ${start}% ${cursor}%`
    })
    .join(', ')

  return (
    <div className="grid min-h-48 grid-cols-[120px_1fr] items-center gap-5">
      <div
        className="grid h-28 w-28 place-items-center rounded-full"
        style={{
          background: `conic-gradient(${gradient})`,
        }}
      >
        <div className="grid h-20 w-20 place-items-center rounded-full bg-[#07111e] text-center">
          <div>
            <p className="text-2xl font-semibold text-white">
              {total}
            </p>
            <p className="text-xs text-zinc-500">
              total
            </p>
          </div>
        </div>
      </div>
      <div className="space-y-2">
        {values.map((value, index) => (
          <div
            key={index}
            className="flex items-center justify-between gap-3 text-sm"
          >
            <span className="flex items-center gap-2 text-zinc-300">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{
                  backgroundColor:
                    colors[index % colors.length],
                }}
              />
              {labels?.[index] ?? `Lane ${index + 1}`}
            </span>
            <span className="text-zinc-500">
              {formatPercent((value / total) * 100)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function BarsPanel({
  values,
  labels,
}: {
  values: number[]
  labels?: string[]
}) {
  const max = Math.max(...values, 1)

  return (
    <div className="min-h-48 space-y-3">
      {values.map((value, index) => (
        <div
          key={index}
          className="grid grid-cols-[120px_1fr_54px] items-center gap-3 text-sm"
        >
          <span className="truncate text-zinc-400">
            {labels?.[index] ?? `Zone ${index + 1}`}
          </span>
          <div className="h-2.5 rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-400"
              style={{
                width: `${Math.max((value / max) * 100, 6)}%`,
              }}
            />
          </div>
          <span className="text-right text-zinc-300">
            {value}
          </span>
        </div>
      ))}
    </div>
  )
}

function HeatmapPanel({
  values,
}: {
  values: number[]
}) {
  return (
    <div className="grid min-h-48 grid-cols-8 gap-2">
      {Array.from({
        length: 48,
      }).map((_, index) => {
        const value =
          values[index % values.length] +
          ((index * 13) % 38)
        const color =
          value > 86
            ? 'bg-red-500/70'
            : value > 68
              ? 'bg-amber-500/70'
              : value > 44
                ? 'bg-blue-500/70'
                : 'bg-emerald-500/60'

        return (
          <span
            key={index}
            className={`rounded border border-white/10 ${color}`}
            title={`${value}%`}
          />
        )
      })}
    </div>
  )
}

function GanttPanel({
  values,
  labels,
}: {
  values: number[]
  labels?: string[]
}) {
  return (
    <div className="min-h-48 space-y-3">
      {values.map((value, index) => (
        <div
          key={index}
          className="grid grid-cols-[120px_1fr_44px] items-center gap-3 text-sm"
        >
          <span className="truncate text-zinc-400">
            {labels?.[index] ?? `Plan ${index + 1}`}
          </span>
          <div className="h-6 rounded bg-slate-900">
            <div
              className="h-full rounded bg-gradient-to-r from-emerald-500 to-blue-500"
              style={{
                marginLeft: `${(index * 9) % 24}%`,
                width: `${Math.min(value, 74)}%`,
              }}
            />
          </div>
          <span className="text-right text-zinc-300">
            {value}%
          </span>
        </div>
      ))}
    </div>
  )
}

function MapPanel() {
  return (
    <div className="relative min-h-48 overflow-hidden rounded-lg border border-cyan-500/10 bg-[#081421]">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.06)_1px,transparent_1px)] bg-[size:28px_28px]" />
      {[
        ['A-01', 'left-[8%] top-[16%]', 'bg-emerald-500/60'],
        ['C-25', 'left-[42%] top-[36%]', 'bg-blue-500/60'],
        ['E-42', 'left-[62%] top-[58%]', 'bg-amber-500/70'],
        ['K-50', 'left-[80%] top-[22%]', 'bg-red-500/70'],
      ].map(([label, position, color]) => (
        <span
          key={label}
          className={`absolute rounded-lg border border-white/20 px-3 py-2 text-xs font-semibold text-white ${position} ${color}`}
        >
          {label}
        </span>
      ))}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-lg border border-cyan-500/10 bg-black/35 px-3 py-2 text-xs text-zinc-300 backdrop-blur">
        <span className="flex items-center gap-2">
          <Map className="h-4 w-4 text-cyan-300" />
          spatial operating layer
        </span>
        <span>live route / slot focus</span>
      </div>
    </div>
  )
}

function ChartRenderer({
  chart,
}: {
  chart: CockpitTab['charts'][number]
}) {
  if (chart.type === 'donut') {
    return <DonutPanel values={chart.values} labels={chart.labels} />
  }

  if (chart.type === 'bars') {
    return <BarsPanel values={chart.values} labels={chart.labels} />
  }

  if (chart.type === 'heatmap') {
    return <HeatmapPanel values={chart.values} />
  }

  if (chart.type === 'gantt') {
    return <GanttPanel values={chart.values} labels={chart.labels} />
  }

  if (chart.type === 'map') {
    return <MapPanel />
  }

  return <LinePanel values={chart.values} labels={chart.labels} />
}

export function OperationalCockpitPage({
  config,
}: {
  config: CockpitConfig
}) {
  const [activeTabId, setActiveTabId] =
    useState(config.tabs[0]?.id ?? '')
  const [search, setSearch] =
    useState('')
  const activeTab = useMemo(
    () =>
      config.tabs.find(
        (tab) => tab.id === activeTabId,
      ) ?? config.tabs[0],
    [activeTabId, config.tabs],
  )
  const filteredRows = useMemo(
    () =>
      activeTab.rows.filter((row) =>
        row.join(' ').toLowerCase().includes(search.toLowerCase()),
      ),
    [activeTab.rows, search],
  )

  return (
    <PageLayout
      title={config.title}
      description={config.description}
      actions={
        <div className="flex items-center gap-2">
          <button className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-[0_0_28px_rgba(37,99,235,0.28)] hover:bg-blue-500">
            <Activity className="h-4 w-4" />
            {config.primaryAction}
          </button>
          <button className="inline-flex h-10 items-center gap-2 rounded-lg border border-cyan-500/10 bg-[#0a1624] px-4 text-sm font-semibold text-zinc-200 hover:border-cyan-400/40">
            <FileText className="h-4 w-4" />
            Xuất Excel
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="sticky top-0 z-20 flex gap-2 overflow-x-auto rounded-xl border border-cyan-500/10 bg-[#071321]/95 p-2 backdrop-blur">
          {config.tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTabId(tab.id)}
              className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm transition ${activeTab.id === tab.id ? 'bg-blue-600 text-white shadow-[0_0_24px_rgba(37,99,235,0.28)]' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">
          {activeTab.kpis.map((metric, index) => (
            <KpiCard
              key={metric.label}
              metric={metric}
              index={index}
            />
          ))}
        </div>

        <div className="rounded-xl border border-cyan-500/10 bg-[#071321] p-3">
          <div className="grid gap-3 lg:grid-cols-[180px_180px_180px_1fr_auto]">
            <select className="h-10 rounded-lg border border-cyan-500/10 bg-[#081421] px-3 text-sm text-zinc-100">
              <option>Tất cả trạng thái</option>
              <option>Đang thực hiện</option>
              <option>Chờ duyệt</option>
              <option>Cảnh báo</option>
            </select>
            <select className="h-10 rounded-lg border border-cyan-500/10 bg-[#081421] px-3 text-sm text-zinc-100">
              <option>Tất cả khu vực</option>
              <option>KHO-A-01</option>
              <option>Yard A</option>
              <option>Xưởng hàn</option>
            </select>
            <select className="h-10 rounded-lg border border-cyan-500/10 bg-[#081421] px-3 text-sm text-zinc-100">
              <option>Ca hiện tại</option>
              <option>Ca 1</option>
              <option>Ca 2</option>
              <option>Ca 3</option>
            </select>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-zinc-500" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tìm kiếm mã, tên, dự án, nhà cung cấp, giao dịch..."
                className="h-10 w-full rounded-lg border border-cyan-500/10 bg-[#081421] px-3 pl-9 text-sm text-zinc-100 outline-none focus:border-blue-400/60"
              />
            </div>
            <button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-500">
              <Search className="h-4 w-4" />
              Tìm kiếm
            </button>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
          <div className="space-y-4">
            <div className="grid gap-4 xl:grid-cols-2">
              {activeTab.charts.slice(0, 2).map((chart) => (
                <div
                  key={chart.title}
                  className="rounded-xl border border-cyan-500/10 bg-[#081421] p-4"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-white">
                      {chart.title}
                    </h2>
                    <StatusBadge tone="info">
                      {chart.type}
                    </StatusBadge>
                  </div>
                  <ChartRenderer chart={chart} />
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-cyan-500/10 bg-[#081421] p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-white">
                    {activeTab.tableTitle}
                  </h2>
                  <p className="text-xs text-zinc-500">
                    {activeTab.purpose}
                  </p>
                </div>
                <StatusBadge tone="neutral">
                  {filteredRows.length} dòng mẫu
                </StatusBadge>
              </div>
              <div className="overflow-auto rounded-xl border border-cyan-500/10">
                <table className="min-w-full divide-y divide-cyan-500/10 text-sm">
                  <thead className="sticky top-0 bg-[#101a2a]">
                    <tr>
                      {activeTab.tableColumns.map((column) => (
                        <th
                          key={column}
                          className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium text-zinc-400"
                        >
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cyan-500/10 bg-zinc-950/30">
                    {filteredRows.map((row, rowIndex) => (
                      <tr
                        key={`${row.join('-')}-${rowIndex}`}
                        className="hover:bg-cyan-500/5"
                      >
                        {row.map((cell, cellIndex) => (
                          <td
                            key={`${cell}-${cellIndex}`}
                            className="whitespace-nowrap px-3 py-2 text-zinc-300"
                          >
                            {cellIndex === 0 ? (
                              <span className="font-semibold text-blue-400">
                                {cell}
                              </span>
                            ) : cell.includes('%') ||
                              cell.includes('Đang') ||
                              cell.includes('Chờ') ||
                              cell.includes('Cảnh') ? (
                              <span className="rounded-md bg-blue-500/10 px-2 py-1 text-xs text-blue-200">
                                {cell}
                              </span>
                            ) : (
                              cell
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              {activeTab.charts.slice(2, 4).map((chart) => (
                <div
                  key={chart.title}
                  className="rounded-xl border border-cyan-500/10 bg-[#081421] p-4"
                >
                  <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-white">
                    {chart.title}
                  </h2>
                  <ChartRenderer chart={chart} />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-cyan-500/10 bg-[#081421] p-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-white">
                Insight panel
              </h2>
              <p className="mt-2 text-sm text-zinc-400">
                {activeTab.purpose}
              </p>
              <div className="mt-4 grid gap-2">
                {[
                  ['Source', 'Master data + operational events'],
                  ['UOM', 'KG / TON / M / PCS / BUNDLE'],
                  ['Category', 'Steel / Plate / Pipe / Component'],
                  ['Realtime', 'Telemetry stream ready'],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between rounded-lg border border-cyan-500/10 bg-black/20 px-3 py-2 text-sm"
                  >
                    <span className="text-zinc-500">
                      {label}
                    </span>
                    <span className="text-right font-medium text-zinc-100">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-cyan-500/10 bg-[#081421] p-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-white">
                Cảnh báo vận hành
              </h2>
              <div className="mt-4 space-y-3">
                {activeTab.alerts.map((alert) => (
                  <div
                    key={alert.title}
                    className="flex gap-3 rounded-lg border border-cyan-500/10 bg-black/20 p-3"
                  >
                    {alert.tone === 'danger' ? (
                      <AlertTriangle className="mt-0.5 h-4 w-4 text-red-400" />
                    ) : alert.tone === 'success' ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-400" />
                    ) : (
                      <BarChart3 className="mt-0.5 h-4 w-4 text-amber-400" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-white">
                        {alert.title}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {alert.detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-cyan-500/10 bg-[#081421] p-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-white">
                Live activity
              </h2>
              <div className="mt-4 space-y-3">
                {[
                  'NK-2506-031 nhập thép hình HEA 300',
                  'XK-2506-021 xuất vật tư cho Nhà xưởng A',
                  'DC-2506-028 điều chuyển KHO-A-01 sang Yard A',
                  'QC-2506-0248 kiểm tra kích thước đạt',
                  'SYS cập nhật phân quyền thủ kho',
                ].map((event, index) => (
                  <div
                    key={event}
                    className="grid grid-cols-[24px_1fr_auto] items-center gap-3 text-sm"
                  >
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-blue-500/15 text-xs text-blue-300">
                      {index + 1}
                    </span>
                    <span className="text-zinc-300">
                      {event}
                    </span>
                    <span className="text-xs text-zinc-500">
                      09:{42 - index * 7}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {config.sampleNote ? (
          <div className="rounded-xl border border-cyan-500/10 bg-cyan-500/5 p-4 text-sm text-cyan-100">
            {config.sampleNote}
          </div>
        ) : null}
      </div>
    </PageLayout>
  )
}

export const cockpitIcons = {
  Activity,
  BarChart3,
  Boxes,
  Cpu,
  DatabaseBackup,
  Factory,
  Gauge,
  LineChart,
  LockKeyhole,
  Map,
  Package,
  Settings,
  ShieldCheck,
  Truck,
  Users,
}
