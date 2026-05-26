import {
  AlertTriangle,
  Box,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Cuboid,
  Download,
  Eye,
  Factory,
  Filter,
  Layers3,
  Maximize2,
  PackageCheck,
  Plus,
  Route,
  Search,
  ShieldCheck,
  Truck,
  X,
} from 'lucide-react'
import {
  type ReactNode,
  useMemo,
  useState,
} from 'react'

import toast from 'react-hot-toast'

import {
  useComponentsQuery,
  useCreateComponentMutation,
  useUploadComponentImageMutation,
} from '../../hooks/query/useComponentQueries'
import {
  useProjectsQuery,
} from '../../hooks/query/useProjectQueries'
import type {
  ComponentItem,
} from '../../services/api/types'

import {
  ComponentStatusBadge,
} from '../../components/ui'
import {
  DataTable,
  PageLayout,
  StatusBadge,
} from '../../components/ui-system'

type ComponentTone =
  | 'blue'
  | 'green'
  | 'amber'
  | 'purple'
  | 'cyan'
  | 'red'

interface ComponentStage {
  label: string
  count: number
  tone: ComponentTone
}

const stageClassName: Record<ComponentTone, string> = {
  blue: 'from-blue-500 to-cyan-400 text-blue-200 border-blue-400/25 bg-blue-500/10',
  green: 'from-emerald-500 to-green-400 text-emerald-200 border-emerald-400/25 bg-emerald-500/10',
  amber: 'from-amber-500 to-orange-400 text-amber-200 border-amber-400/25 bg-amber-500/10',
  purple: 'from-violet-500 to-fuchsia-400 text-violet-200 border-violet-400/25 bg-violet-500/10',
  cyan: 'from-cyan-500 to-sky-400 text-cyan-200 border-cyan-400/25 bg-cyan-500/10',
  red: 'from-red-500 to-orange-500 text-red-200 border-red-400/25 bg-red-500/10',
}

const compactInputClassName =
  'h-10 rounded-lg border border-cyan-500/10 bg-[#071321] px-3 text-sm text-zinc-100 outline-none transition focus:border-blue-400/60 focus:ring-1 focus:ring-blue-400/30'

function statusTone(status: string) {
  const normalized = status.toUpperCase()

  if (
    normalized.includes('INSTALL') ||
    normalized.includes('COMPLETE') ||
    normalized.includes('HOAN') ||
    normalized.includes('INSTALLED')
  ) {
    return 'success' as const
  }

  if (
    normalized.includes('QC') ||
    normalized.includes('HOLD') ||
    normalized.includes('WAIT') ||
    normalized.includes('DELIVER')
  ) {
    return 'warning' as const
  }

  if (
    normalized.includes('ERROR') ||
    normalized.includes('REJECT') ||
    normalized.includes('LATE')
  ) {
    return 'danger' as const
  }

  return 'info' as const
}

function componentWeight(
  component: ComponentItem,
  index: number,
) {
  const seed =
    component.code
      .split('')
      .reduce(
        (sum, char) =>
          sum + char.charCodeAt(0),
        0,
      ) + index * 37

  return 420 + (seed % 980)
}

function progressFromComponent(
  component: ComponentItem,
  index: number,
) {
  const normalized =
    component.status.toUpperCase()

  if (normalized.includes('INSTALLED')) return 100
  if (normalized.includes('DELIVERED')) return 78
  if (normalized.includes('STOCK')) return 64
  if (normalized.includes('QC')) return 48

  return 25 + ((index * 17) % 55)
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('vi-VN').format(value)
}

function statusCount(
  components: ComponentItem[],
  matcher: (status: string) => boolean,
) {
  return components.filter((component) =>
    matcher(component.status.toUpperCase()),
  ).length
}

function ComponentKpiCard({
  label,
  value,
  delta,
  icon,
  tone,
  spark,
}: {
  label: string
  value: string | number
  delta: string
  icon: ReactNode
  tone: ComponentTone
  spark: number[]
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-cyan-500/10 bg-[#0a1624] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(14,165,233,0.14),transparent_34%)]" />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
            {label}
          </p>
          <p className="mt-2 text-2xl font-semibold text-white">
            {value}
          </p>
          <p className="mt-1 text-xs text-emerald-300">
            {delta}
          </p>
        </div>
        <div
          className={`rounded-xl border p-2 ${stageClassName[tone]}`}
        >
          {icon}
        </div>
      </div>
      <div className="relative mt-3 flex h-8 items-end gap-1">
        {spark.map((point, index) => (
          <span
            key={`${label}-${index}`}
            className={`flex-1 rounded-t bg-gradient-to-t ${stageClassName[tone].split(' ').slice(0, 2).join(' ')}`}
            style={{
              height: `${18 + point}%`,
              opacity: 0.42 + index / 24,
            }}
          />
        ))}
      </div>
    </div>
  )
}

function DonutChart({
  total,
  stages,
  label,
}: {
  total: number
  stages: ComponentStage[]
  label: string
}) {
  const colors: Record<ComponentTone, string> = {
    blue: '#2563eb',
    green: '#10b981',
    amber: '#f59e0b',
    purple: '#8b5cf6',
    cyan: '#06b6d4',
    red: '#ef4444',
  }
  let cursor = 0
  const gradient = stages
    .map((stage) => {
      const start = cursor
      const size =
        total > 0
          ? (stage.count / total) * 100
          : 0
      cursor += size
      return `${colors[stage.tone]} ${start}% ${cursor}%`
    })
    .join(', ')

  return (
    <div className="grid grid-cols-[120px_1fr] items-center gap-5">
      <div
        className="grid h-28 w-28 place-items-center rounded-full"
        style={{
          background: `conic-gradient(${gradient || '#334155 0% 100%'})`,
        }}
      >
        <div className="grid h-20 w-20 place-items-center rounded-full bg-[#07111e] text-center">
          <div>
            <p className="text-2xl font-semibold text-white">
              {formatNumber(total)}
            </p>
            <p className="text-xs text-zinc-400">
              {label}
            </p>
          </div>
        </div>
      </div>
      <div className="space-y-2">
        {stages.map((stage) => (
          <div
            key={stage.label}
            className="flex items-center justify-between gap-3 text-sm"
          >
            <span className="flex items-center gap-2 text-zinc-300">
              <span
                className={`h-2.5 w-2.5 rounded-full bg-gradient-to-r ${stageClassName[stage.tone].split(' ').slice(0, 2).join(' ')}`}
              />
              {stage.label}
            </span>
            <span className="text-zinc-400">
              {stage.count} (
              {total > 0
                ? Math.round(
                    (stage.count / total) *
                      100,
                  )
                : 0}
              %)
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function SteelPreview({
  selectedComponent,
}: {
  selectedComponent?: ComponentItem | null
}) {
  return (
    <div className="relative min-h-[280px] overflow-hidden rounded-xl border border-cyan-500/10 bg-[radial-gradient(circle_at_50%_0%,rgba(14,165,233,0.18),transparent_42%),linear-gradient(135deg,#08111d,#0d1c2c)]">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.05)_1px,transparent_1px)] bg-[size:28px_28px]" />
      <div className="absolute left-10 top-16 h-44 w-10 rotate-[18deg] rounded-sm border border-slate-500/70 bg-gradient-to-r from-slate-700 via-slate-300 to-slate-800 shadow-2xl" />
      <div className="absolute left-24 top-28 h-12 w-64 -rotate-[12deg] rounded-sm border border-slate-500/70 bg-gradient-to-b from-slate-300 via-slate-600 to-slate-900 shadow-2xl" />
      <div className="absolute left-36 top-16 h-44 w-12 rounded-sm border border-slate-500/80 bg-gradient-to-r from-slate-800 via-slate-400 to-slate-900 shadow-2xl" />
      <div className="absolute left-32 top-28 h-24 w-20 rounded-md border border-amber-400/40 bg-amber-900/20" />
      {[0, 1, 2, 3, 4, 5].map((bolt) => (
        <span
          key={bolt}
          className="absolute h-3 w-3 rounded-full border border-emerald-300/60 bg-emerald-500/60 shadow-[0_0_14px_rgba(16,185,129,0.55)]"
          style={{
            left: 152 + (bolt % 2) * 32,
            top: 124 + Math.floor(bolt / 2) * 22,
          }}
        />
      ))}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-lg border border-cyan-500/10 bg-black/35 px-3 py-2 backdrop-blur">
        <div>
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            3D fabrication preview
          </p>
          <p className="text-sm font-semibold text-white">
            {selectedComponent?.code ??
              'B-2506-D12'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {[Eye, Route, Maximize2, Layers3].map((Icon) => (
            <button
              key={Icon.displayName ?? Icon.name}
              type="button"
              className="rounded-lg border border-cyan-500/10 bg-white/5 p-2 text-zinc-300 hover:border-cyan-400/40 hover:text-white"
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function FullscreenComponentWorkspace({
  component,
  onClose,
}: {
  component: ComponentItem
  onClose: () => void
}) {
  const tabs = [
    'Overview',
    'Production',
    'QC History',
    'Movements',
    'Drawings',
    'Yard Location',
    'Install',
  ]

  return (
    <div className="fixed inset-0 z-50 bg-[#020812]/95 p-4 backdrop-blur-xl">
      <div className="mx-auto flex h-full max-w-[1680px] flex-col overflow-hidden rounded-2xl border border-cyan-500/20 bg-[#07111e] shadow-[0_0_60px_rgba(14,165,233,0.18)]">
        <div className="flex items-center justify-between border-b border-cyan-500/10 px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">
              component operational profile
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-white">
              {component.code} - {component.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-cyan-500/10 bg-white/5 p-2 text-zinc-300 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto border-b border-cyan-500/10 px-6 py-3">
          {tabs.map((tab, index) => (
            <button
              key={tab}
              type="button"
              className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm ${index === 0 ? 'bg-blue-600 text-white shadow-[0_0_24px_rgba(37,99,235,0.28)]' : 'bg-white/5 text-zinc-400 hover:text-white'}`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="grid flex-1 gap-4 overflow-auto p-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            <SteelPreview selectedComponent={component} />
            <div className="grid gap-3 md:grid-cols-4">
              {[
                ['Production progress', '68%', 'green'],
                ['QC gates passed', '4/6', 'cyan'],
                ['Yard moves', '12', 'blue'],
                ['Install readiness', '82%', 'amber'],
              ].map(([label, value, tone]) => (
                <div
                  key={label}
                  className="rounded-xl border border-cyan-500/10 bg-[#0a1624] p-4"
                >
                  <p className="text-xs uppercase tracking-wide text-zinc-500">
                    {label}
                  </p>
                  <p className="mt-2 text-xl font-semibold text-white">
                    {value}
                  </p>
                  <div className="mt-3 h-1.5 rounded-full bg-slate-800">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${stageClassName[tone as ComponentTone].split(' ').slice(0, 2).join(' ')}`}
                      style={{
                        width:
                          label ===
                          'Yard moves'
                            ? '55%'
                            : String(value).replace(
                                '%',
                                '',
                              ) + '%',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-cyan-500/10 bg-[#0a1624] p-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-white">
                Movement timeline
              </h3>
              <div className="mt-4 grid gap-3">
                {[
                  'Released from design',
                  'Cutting completed',
                  'Welding station',
                  'QC inspection',
                  'Moved to yard',
                  'Ready for dispatch',
                ].map((event, index) => (
                  <div
                    key={event}
                    className="grid grid-cols-[28px_1fr_auto] items-center gap-3 text-sm"
                  >
                    <span className={`grid h-7 w-7 place-items-center rounded-full ${index < 4 ? 'bg-emerald-500/15 text-emerald-300' : 'bg-blue-500/15 text-blue-300'}`}>
                      {index < 4 ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        index + 1
                      )}
                    </span>
                    <span className="text-zinc-200">
                      {event}
                    </span>
                    <span className="text-xs text-zinc-500">
                      29/06 0{index}:42
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="rounded-xl border border-cyan-500/10 bg-[#0a1624] p-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-white">
                Component intelligence
              </h3>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                {[
                  ['Project', component.project?.name ?? 'Nhà xưởng A'],
                  ['Status', component.status],
                  ['Location', [component.floor, component.zone, component.position].filter(Boolean).join(' / ') || 'Yard A / A1-03-05'],
                  ['Material', 'SS400'],
                  ['Drawing', 'D-12 REV.02'],
                  ['Weight', '458.6 kg'],
                  ['Batch', 'L2506-001'],
                  ['Updated', '06/06/2025 14:30'],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-lg border border-cyan-500/10 bg-black/20 p-3"
                  >
                    <p className="text-xs text-zinc-500">
                      {label}
                    </p>
                    <p className="mt-1 font-medium text-zinc-100">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-cyan-500/10 bg-[#0a1624] p-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-white">
                Active constraints
              </h3>
              <div className="mt-4 space-y-3">
                {[
                  ['QC hold window', '2 giờ', 'warning'],
                  ['Crane slot reservation', 'A1-03-05', 'info'],
                  ['Dispatch dependency', 'Truck T-04', 'success'],
                  ['Install sequence', 'Seq 128', 'neutral'],
                ].map(([label, value, tone]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between rounded-lg border border-cyan-500/10 bg-black/20 px-3 py-2"
                  >
                    <span className="text-sm text-zinc-300">
                      {label}
                    </span>
                    <StatusBadge tone={tone as 'warning' | 'info' | 'success' | 'neutral'}>
                      {value}
                    </StatusBadge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function ComponentsPage() {
  const [
    openModal,
    setOpenModal,
  ] = useState(false)
  const [
    detailComponent,
    setDetailComponent,
  ] =
    useState<ComponentItem | null>(
      null,
    )
  const [
    selectedComponent,
    setSelectedComponent,
  ] =
    useState<ComponentItem | null>(
      null,
    )
  const [search, setSearch] =
    useState('')
  const [statusFilter, setStatusFilter] =
    useState('ALL')

  const [code, setCode] =
    useState('')
  const [name, setName] =
    useState('')
  const [floor, setFloor] =
    useState('')
  const [zone, setZone] =
    useState('')
  const [
    position,
    setPosition,
  ] = useState('')
  const [status, setStatus] =
    useState('STOCK')
  const [imageUrl, setImageUrl] =
    useState('')
  const [projectId, setProjectId] =
    useState('')

  const {
    data: components = [],
    isLoading,
  } = useComponentsQuery()

  const {
    data: projects = [],
  } = useProjectsQuery()

  const createComponentMutation =
    useCreateComponentMutation()
  const uploadComponentImageMutation =
    useUploadComponentImageMutation()

  const statuses = useMemo(
    () => [
      'ALL',
      ...Array.from(
        new Set(
          components.map(
            (component) =>
              component.status,
          ),
        ),
      ),
    ],
    [components],
  )

  const filteredComponents = useMemo(
    () =>
      components.filter((component) => {
        const matchesStatus =
          statusFilter === 'ALL' ||
          component.status === statusFilter
        const text =
          `${component.code} ${component.name} ${component.project?.name ?? ''} ${component.zone ?? ''} ${component.position ?? ''}`.toLowerCase()

        return (
          matchesStatus &&
          text.includes(
            search.toLowerCase(),
          )
        )
      }),
    [
      components,
      search,
      statusFilter,
    ],
  )

  const selected =
    selectedComponent ??
    filteredComponents[0] ??
    null

  const totalWeight = useMemo(
    () =>
      components.reduce(
        (sum, component, index) =>
          sum +
          componentWeight(
            component,
            index,
          ),
        0,
      ),
    [components],
  )

  const inStock = statusCount(
    components,
    (statusValue) =>
      statusValue.includes('STOCK'),
  )
  const installed = statusCount(
    components,
    (statusValue) =>
      statusValue.includes(
        'INSTALLED',
      ),
  )
  const delivered = statusCount(
    components,
    (statusValue) =>
      statusValue.includes(
        'DELIVERED',
      ),
  )
  const qcHold =
    components.filter((_, index) =>
      index % 7 === 0,
    ).length
  const producing = Math.max(
    components.length -
      inStock -
      installed -
      delivered,
    0,
  )

  const stages: ComponentStage[] = [
    {
      label: 'Đang sản xuất',
      count: producing,
      tone: 'amber',
    },
    {
      label: 'Chờ QC',
      count: qcHold,
      tone: 'purple',
    },
    {
      label: 'Trong bãi',
      count: inStock,
      tone: 'blue',
    },
    {
      label: 'Đã xuất xưởng',
      count: delivered,
      tone: 'cyan',
    },
    {
      label: 'Lắp dựng',
      count: installed,
      tone: 'green',
    },
  ]

  async function uploadImage(
    file: File,
  ) {
    const response =
      await uploadComponentImageMutation.mutateAsync(
        file,
      )

    setImageUrl(response.imageUrl)
    toast.success(
      'Image uploaded',
    )
  }

  async function createComponent() {
    try {
      await createComponentMutation.mutateAsync(
        {
          code,
          name,
          floor,
          zone,
          position,
          status,
          projectId,
          imageUrl,
        },
      )

      toast.success(
        'Component created',
      )
      setCode('')
      setName('')
      setFloor('')
      setZone('')
      setPosition('')
      setStatus('STOCK')
      setProjectId('')
      setImageUrl('')
      setOpenModal(false)
    } catch {
      toast.error(
        'Failed to create component',
      )
    }
  }

  return (
    <PageLayout
      title="Quản lý cấu kiện"
      description="Quản lý toàn bộ cấu kiện từ thiết kế, sản xuất, QC, bãi tập kết đến xuất hàng và lắp dựng."
      actions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              setOpenModal(true)
            }
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-[0_0_28px_rgba(37,99,235,0.28)] hover:bg-blue-500"
          >
            <Plus className="h-4 w-4" />
            Tạo cấu kiện
          </button>
          <button
            type="button"
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-cyan-500/10 bg-[#0a1624] px-4 text-sm font-semibold text-zinc-200 hover:border-cyan-400/40"
          >
            <Download className="h-4 w-4" />
            Xuất Excel
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <ComponentKpiCard
            label="Tổng cấu kiện"
            value={formatNumber(
              components.length,
            )}
            delta="100%"
            tone="blue"
            icon={
              <Box className="h-5 w-5" />
            }
            spark={[
              12, 18, 22, 24, 28, 36, 32,
              40,
            ]}
          />
          <ComponentKpiCard
            label="Đang sản xuất"
            value={formatNumber(
              producing,
            )}
            delta="18.2% tổng cấu kiện"
            tone="amber"
            icon={
              <Factory className="h-5 w-5" />
            }
            spark={[
              8, 12, 18, 16, 26, 30, 34,
              42,
            ]}
          />
          <ComponentKpiCard
            label="Chờ QC"
            value={formatNumber(qcHold)}
            delta="cần kiểm tra"
            tone="purple"
            icon={
              <ClipboardCheck className="h-5 w-5" />
            }
            spark={[
              10, 14, 12, 22, 28, 20, 30,
              38,
            ]}
          />
          <ComponentKpiCard
            label="Hoàn thành"
            value={formatNumber(
              installed,
            )}
            delta="ready for install"
            tone="green"
            icon={
              <CheckCircle2 className="h-5 w-5" />
            }
            spark={[
              14, 20, 26, 30, 36, 44, 48,
              54,
            ]}
          />
          <ComponentKpiCard
            label="Đã xuất xưởng"
            value={formatNumber(
              delivered,
            )}
            delta="logistics stream"
            tone="cyan"
            icon={
              <Truck className="h-5 w-5" />
            }
            spark={[
              6, 10, 18, 20, 24, 30, 28,
              40,
            ]}
          />
          <ComponentKpiCard
            label="Tổng khối lượng"
            value={`${formatNumber(
              Math.round(totalWeight),
            )} kg`}
            delta="theo cấu kiện"
            tone="green"
            icon={
              <PackageCheck className="h-5 w-5" />
            }
            spark={[
              18, 22, 24, 32, 34, 42, 40,
              52,
            ]}
          />
        </div>

        <div className="rounded-xl border border-cyan-500/10 bg-[#071321] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
          <div className="grid gap-3 lg:grid-cols-[180px_180px_180px_1fr_auto_auto]">
            <select className={compactInputClassName}>
              <option>Tất cả dự án</option>
              {projects.map((project) => (
                <option key={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value,
                )
              }
              className={compactInputClassName}
            >
              {statuses.map(
                (statusOption) => (
                  <option
                    key={statusOption}
                    value={statusOption}
                  >
                    {statusOption === 'ALL'
                      ? 'Tất cả trạng thái'
                      : statusOption}
                  </option>
                ),
              )}
            </select>
            <select className={compactInputClassName}>
              <option>Tất cả vị trí</option>
              <option>Xưởng cắt</option>
              <option>Xưởng hàn</option>
              <option>Chờ QC</option>
              <option>Bãi thành phẩm</option>
            </select>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-zinc-500" />
              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value,
                  )
                }
                placeholder="Tìm kiếm mã, tên cấu kiện, bản vẽ, dự án..."
                className={`${compactInputClassName} w-full pl-9`}
              />
            </div>
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-500"
            >
              <Search className="h-4 w-4" />
              Tìm kiếm
            </button>
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center rounded-lg border border-cyan-500/10 bg-[#0a1624] px-3 text-zinc-300 hover:text-white"
            >
              <Filter className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="rounded-xl border border-cyan-500/10 bg-[#081421] p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-white">
                  Danh sách cấu kiện
                </h2>
                <p className="text-xs text-zinc-500">
                  Dense operational table, trạng thái sản xuất, vị trí và tiến độ theo cấu kiện.
                </p>
              </div>
              <StatusBadge tone="info">
                {filteredComponents.length} cấu kiện
              </StatusBadge>
            </div>
            <DataTable
              data={filteredComponents}
              loading={isLoading}
              rowKey={(row) => row.id}
              density="compact"
              selectable
              stickyHeader
              savedViewName="Component control"
              empty="Chưa có cấu kiện"
              statusTone={(row) =>
                statusTone(row.status)
              }
              rowActions={(row) => (
                <div className="flex justify-end gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedComponent(row)
                    }
                    className="rounded-md border border-cyan-500/10 bg-white/5 p-1.5 text-zinc-300 hover:text-white"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setDetailComponent(row)
                    }
                    className="rounded-md border border-cyan-500/10 bg-blue-500/10 p-1.5 text-blue-200 hover:text-white"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </button>
                </div>
              )}
              columns={[
                {
                  key: 'code',
                  header: 'Mã cấu kiện',
                  pinned: 'left',
                  render: (row) => (
                    <button
                      type="button"
                      onClick={() =>
                        setDetailComponent(row)
                      }
                      className="text-left font-semibold text-blue-400 hover:text-blue-300"
                    >
                      {row.code}
                    </button>
                  ),
                },
                {
                  key: 'name',
                  header: 'Tên cấu kiện',
                  render: (row) => (
                    <span className="font-medium text-zinc-100">
                      {row.name}
                    </span>
                  ),
                },
                {
                  key: 'type',
                  header: 'Loại',
                  render: (row) => {
                    const index =
                      filteredComponents.indexOf(
                        row,
                      )

                    return [
                      'Cột',
                      'Dầm',
                      'Giằng',
                      'Bản mã',
                      'Phụ kiện',
                    ][Math.max(index, 0) % 5]
                  },
                },
                {
                  key: 'project',
                  header: 'Dự án',
                  render: (row) =>
                    row.project?.name ??
                    'Nhà xưởng A',
                },
                {
                  key: 'dimension',
                  header: 'Kích thước',
                  render: (row) => {
                    const index =
                      filteredComponents.indexOf(
                        row,
                      )

                    return [
                      'H:12000',
                      'I600x250',
                      'L90x90x8',
                      'PL20',
                      '200x100x6',
                    ][Math.max(index, 0) % 5]
                  },
                },
                {
                  key: 'status',
                  header: 'Trạng thái',
                  render: (row) => (
                    <ComponentStatusBadge
                      status={row.status}
                    />
                  ),
                },
                {
                  key: 'location',
                  header: 'Vị trí hiện tại',
                  render: (row) => {
                    const index =
                      filteredComponents.indexOf(
                        row,
                      )

                    return (
                      [
                        row.floor,
                        row.zone,
                        row.position,
                      ]
                        .filter(Boolean)
                        .join(' / ') ||
                      [
                        'Xưởng cắt',
                        'Chờ QC',
                        'Xưởng hàn',
                        'Kho thành phẩm',
                        'Bãi A1',
                      ][Math.max(index, 0) % 5]
                    )
                  },
                },
                {
                  key: 'progress',
                  header: 'Tiến độ',
                  render: (row) => {
                    const index =
                      filteredComponents.indexOf(
                        row,
                      )
                    const progress =
                      progressFromComponent(
                        row,
                        Math.max(index, 0),
                      )

                    return (
                      <div className="flex min-w-28 items-center gap-2">
                        <div className="h-1.5 flex-1 rounded-full bg-slate-800">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-400"
                            style={{
                              width: `${progress}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs text-zinc-400">
                          {progress}%
                        </span>
                      </div>
                    )
                  },
                },
              ]}
            />
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-cyan-500/10 bg-[#081421] p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-white">
                  Xem mô hình 3D
                </h2>
                <StatusBadge tone="info">
                  live preview
                </StatusBadge>
              </div>
              <SteelPreview
                selectedComponent={selected}
              />
            </div>
            <div className="rounded-xl border border-cyan-500/10 bg-[#081421] p-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-white">
                Thông tin cấu kiện
              </h2>
              <div className="mt-4 space-y-2 text-sm">
                {[
                  ['Mã cấu kiện', selected?.code ?? '-'],
                  ['Tên cấu kiện', selected?.name ?? '-'],
                  ['Dự án', selected?.project?.name ?? 'Nhà xưởng A'],
                  ['Bản vẽ', 'D-12 REV.02'],
                  ['Vật liệu', 'SS400'],
                  ['Khối lượng', selected ? `${componentWeight(selected, 1)} kg` : '-'],
                  ['Trạng thái', selected?.status ?? '-'],
                  ['Vị trí', selected ? [selected.floor, selected.zone, selected.position].filter(Boolean).join(' / ') || 'Bãi A1-03-05' : '-'],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between gap-3 border-b border-cyan-500/10 py-2"
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
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[0.9fr_1.35fr_0.7fr_0.8fr]">
          <div className="rounded-xl border border-cyan-500/10 bg-[#081421] p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-white">
              Tiến độ theo trạng thái
            </h2>
            <div className="mt-5">
              <DonutChart
                total={components.length}
                stages={stages}
                label="Tổng"
              />
            </div>
          </div>
          <div className="rounded-xl border border-cyan-500/10 bg-[#081421] p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-white">
              Tiến độ theo dự án
            </h2>
            <div className="mt-5 space-y-4">
              {[
                'Nhà xưởng A',
                'Nhà xưởng B',
                'Nhà xưởng C',
                'Trung tâm D',
              ].map((project, index) => {
                const values = [
                  18 + index * 5,
                  26 + index * 4,
                  11 + index * 2,
                  44 + index * 8,
                  8 + index * 2,
                ]
                const sum =
                  values.reduce(
                    (a, b) => a + b,
                    0,
                  )

                return (
                  <div
                    key={project}
                    className="grid grid-cols-[110px_1fr] items-center gap-3"
                  >
                    <span className="text-sm text-zinc-300">
                      {project}
                    </span>
                    <div className="flex h-7 overflow-hidden rounded-md bg-slate-900">
                      {values.map(
                        (value, valueIndex) => (
                          <div
                            key={valueIndex}
                            className={[
                              'bg-blue-500',
                              'bg-amber-500',
                              'bg-violet-500',
                              'bg-emerald-500',
                              'bg-cyan-500',
                            ][valueIndex]}
                            style={{
                              width: `${(value / sum) * 100}%`,
                            }}
                          />
                        ),
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="rounded-xl border border-cyan-500/10 bg-[#081421] p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-white">
              Thống kê cấu kiện
            </h2>
            <div className="mt-4 space-y-3">
              {[
                ['Tổng khối lượng', `${formatNumber(Math.round(totalWeight))} kg`, Cuboid, 'blue'],
                ['Đã sản xuất', `${Math.round(components.length * 0.54)} cấu kiện`, Factory, 'green'],
                ['Đạt QC', `${Math.max(components.length - qcHold, 0)} cấu kiện`, ShieldCheck, 'cyan'],
                ['Đã xuất xưởng', `${delivered} cấu kiện`, Truck, 'amber'],
              ].map(([label, value, Icon, tone]) => {
                const TypedIcon =
                  Icon as typeof Cuboid

                return (
                  <div
                    key={label as string}
                    className="flex items-center gap-3 rounded-lg border border-cyan-500/10 bg-black/20 p-3"
                  >
                    <span className={`rounded-lg border p-2 ${stageClassName[tone as ComponentTone]}`}>
                      <TypedIcon className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-xs text-zinc-500">
                        {label as string}
                      </p>
                      <p className="font-semibold text-white">
                        {value as string}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="rounded-xl border border-cyan-500/10 bg-[#081421] p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-white">
                Cảnh báo
              </h2>
              <button className="text-xs text-blue-400">
                Xem tất cả
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {[
                ['Cấu kiện quá hạn sản xuất', '12', 'danger'],
                ['Cấu kiện chờ QC quá lâu', '8', 'warning'],
                ['Cấu kiện thiếu bản vẽ', '5', 'danger'],
                ['Cấu kiện lỗi QC', '3', 'danger'],
              ].map(([label, value, tone]) => (
                <div
                  key={label}
                  className="flex items-center justify-between rounded-lg border border-cyan-500/10 bg-black/20 px-3 py-2"
                >
                  <span className="flex items-center gap-2 text-sm text-zinc-300">
                    <AlertTriangle className={`h-4 w-4 ${tone === 'warning' ? 'text-amber-400' : 'text-red-400'}`} />
                    {label}
                  </span>
                  <span className="font-semibold text-white">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {openModal ? (
        <div className="fixed inset-0 z-40 grid place-items-center bg-black/70 p-4 backdrop-blur-md">
          <div className="w-full max-w-5xl overflow-hidden rounded-2xl border border-cyan-500/20 bg-[#07111e] shadow-[0_0_60px_rgba(14,165,233,0.18)]">
            <div className="flex items-center justify-between border-b border-cyan-500/10 px-6 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.26em] text-cyan-300">
                  component workflow
                </p>
                <h2 className="text-xl font-semibold text-white">
                  Tạo cấu kiện mới
                </h2>
              </div>
              <button
                type="button"
                onClick={() =>
                  setOpenModal(false)
                }
                className="rounded-lg border border-cyan-500/10 bg-white/5 p-2 text-zinc-300 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid gap-5 p-6 lg:grid-cols-[1fr_300px]">
              <div className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <input
                    className={compactInputClassName}
                    placeholder="Mã cấu kiện"
                    value={code}
                    onChange={(event) =>
                      setCode(
                        event.target.value,
                      )
                    }
                  />
                  <input
                    className={compactInputClassName}
                    placeholder="Tên cấu kiện"
                    value={name}
                    onChange={(event) =>
                      setName(
                        event.target.value,
                      )
                    }
                  />
                  <select
                    className={compactInputClassName}
                    value={projectId}
                    onChange={(event) =>
                      setProjectId(
                        event.target.value,
                      )
                    }
                  >
                    <option value="">
                      Chọn dự án
                    </option>
                    {projects.map((project) => (
                      <option
                        key={project.id}
                        value={project.id}
                      >
                        {project.name}
                      </option>
                    ))}
                  </select>
                  <select
                    className={compactInputClassName}
                    value={status}
                    onChange={(event) =>
                      setStatus(
                        event.target.value,
                      )
                    }
                  >
                    {statuses
                      .filter(
                        (item) =>
                          item !== 'ALL',
                      )
                      .concat(
                        statuses.length <= 1
                          ? [
                              'STOCK',
                              'DELIVERED',
                              'INSTALLED',
                            ]
                          : [],
                      )
                      .map((item) => (
                        <option
                          key={item}
                          value={item}
                        >
                          {item}
                        </option>
                      ))}
                  </select>
                  <input
                    className={compactInputClassName}
                    placeholder="Tầng / phân đoạn"
                    value={floor}
                    onChange={(event) =>
                      setFloor(
                        event.target.value,
                      )
                    }
                  />
                  <input
                    className={compactInputClassName}
                    placeholder="Zone / khu vực"
                    value={zone}
                    onChange={(event) =>
                      setZone(
                        event.target.value,
                      )
                    }
                  />
                  <input
                    className={`${compactInputClassName} md:col-span-2`}
                    placeholder="Vị trí hiện tại"
                    value={position}
                    onChange={(event) =>
                      setPosition(
                        event.target.value,
                      )
                    }
                  />
                  <input
                    type="file"
                    onChange={(event) => {
                      const file =
                        event.target.files?.[0]

                      if (file) {
                        uploadImage(file)
                      }
                    }}
                    className={`${compactInputClassName} h-auto py-2 md:col-span-2`}
                  />
                </div>
              </div>
              <div className="rounded-xl border border-cyan-500/10 bg-black/20 p-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-white">
                  Operational summary
                </h3>
                <div className="mt-4 space-y-3 text-sm">
                  {[
                    ['QR identity', code || 'auto after save'],
                    ['Project link', projectId ? 'selected' : 'pending'],
                    ['QC route', 'Design -> Fabrication -> QC -> Yard'],
                    ['Traceability', imageUrl ? 'image attached' : 'awaiting evidence'],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="flex items-center justify-between gap-3"
                    >
                      <span className="text-zinc-500">
                        {label}
                      </span>
                      <span className="text-right text-zinc-100">
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-cyan-500/10 px-6 py-4">
              <button
                type="button"
                onClick={() =>
                  setOpenModal(false)
                }
                className="rounded-lg bg-white/5 px-5 py-2 text-sm font-semibold text-zinc-300 hover:text-white"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={createComponent}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-500"
              >
                Lưu cấu kiện
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {detailComponent ? (
        <FullscreenComponentWorkspace
          component={detailComponent}
          onClose={() =>
            setDetailComponent(null)
          }
        />
      ) : null}
    </PageLayout>
  )
}
