import {
  AlertTriangle,
  Box,
  ChevronRight,
  Download,
  Eye,
  Filter,
  Forklift,
  Layers,
  LocateFixed,
  Map,
  Maximize2,
  Package,
  RefreshCcw,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  Weight,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import {
  useMemo,
  useState,
} from 'react'

import {
  useComponentsQuery,
} from '../../hooks/query/useComponentQueries'
import {
  DataTable,
  PageLayout,
  StatusBadge,
} from '../../components/ui-system'
import {
  useYardMetricsQuery,
  useYardSlotsQuery,
  useYardZonesQuery,
} from '../../modules/yard-ui/yard-hooks'
import {
  normalizeList,
  slotOccupancyPercent,
} from '../../modules/yard-ui/yard-utils'

import type {
  ComponentItem,
} from '../../services/api/types'
import type {
  YardSlot,
  YardZone,
} from '../../modules/yard-ui/yard.types'

type YardTone =
  | 'empty'
  | 'normal'
  | 'medium'
  | 'high'
  | 'overload'
  | 'blocked'

interface YardCell {
  id: string
  code: string
  zone: string
  row: string
  status: YardTone
  occupancy: number
  materialCode?: string
  materialName?: string
  weight: number
}

const inputClassName =
  'h-10 rounded-lg border border-cyan-500/10 bg-[#071321] px-3 text-sm text-zinc-100 outline-none transition focus:border-blue-400/60 focus:ring-1 focus:ring-blue-400/30'

const yardToneClassName: Record<YardTone, string> = {
  empty: 'border-slate-600/60 bg-slate-800/20 text-slate-300',
  normal: 'border-emerald-400/50 bg-emerald-500/35 text-emerald-100 shadow-[0_0_12px_rgba(16,185,129,0.24)]',
  medium: 'border-blue-400/50 bg-blue-500/35 text-blue-100 shadow-[0_0_12px_rgba(59,130,246,0.22)]',
  high: 'border-amber-400/60 bg-amber-500/45 text-amber-100 shadow-[0_0_12px_rgba(245,158,11,0.26)]',
  overload: 'border-red-400/70 bg-red-500/45 text-red-100 shadow-[0_0_16px_rgba(239,68,68,0.3)]',
  blocked: 'border-violet-400/60 bg-violet-500/35 text-violet-100 shadow-[0_0_12px_rgba(139,92,246,0.24)]',
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('vi-VN').format(value)
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
      ) + index * 41

  return 260 + (seed % 1260)
}

function toneFromOccupancy(
  occupancy: number,
  status?: string,
): YardTone {
  if (
    status === 'BLOCKED' ||
    status === 'RESERVED'
  ) {
    return 'blocked'
  }

  if (occupancy <= 0) return 'empty'
  if (occupancy < 45) return 'normal'
  if (occupancy < 70) return 'medium'
  if (occupancy < 95) return 'high'

  return 'overload'
}

function YardKpiCard({
  label,
  value,
  sub,
  icon,
  tone,
}: {
  label: string
  value: string | number
  sub: string
  icon: React.ReactNode
  tone: 'blue' | 'green' | 'amber' | 'cyan'
}) {
  const toneClassName = {
    blue: 'from-blue-600/30 text-blue-200 border-blue-400/20',
    green: 'from-emerald-600/30 text-emerald-200 border-emerald-400/20',
    amber: 'from-amber-600/30 text-amber-200 border-amber-400/20',
    cyan: 'from-cyan-600/30 text-cyan-200 border-cyan-400/20',
  }[tone]

  return (
    <div className="relative overflow-hidden rounded-xl border border-cyan-500/10 bg-[#0a1624] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className={`absolute inset-0 bg-gradient-to-br ${toneClassName} to-transparent opacity-80`} />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-zinc-500">
            {label}
          </p>
          <p className="mt-1 text-2xl font-semibold text-white">
            {value}
          </p>
          <p className="mt-1 text-xs text-emerald-300">
            {sub}
          </p>
        </div>
        <div className={`rounded-xl border p-2 ${toneClassName}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

function DistributionDonut({
  total,
  values,
}: {
  total: number
  values: Array<{
    label: string
    value: number
    color: string
  }>
}) {
  let cursor = 0
  const gradient = values
    .map((item) => {
      const start = cursor
      const size =
        total > 0
          ? (item.value / total) * 100
          : 0
      cursor += size
      return `${item.color} ${start}% ${cursor}%`
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
              tấn
            </p>
          </div>
        </div>
      </div>
      <div className="space-y-2">
        {values.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between gap-3 text-sm"
          >
            <span className="flex items-center gap-2 text-zinc-300">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{
                  backgroundColor:
                    item.color,
                }}
              />
              {item.label}
            </span>
            <span className="text-zinc-400">
              {formatNumber(item.value)} tấn
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function buildSyntheticCells(
  components: ComponentItem[],
) {
  const zones = [
    'A1',
    'A2',
    'A3',
    'A4',
    'B1',
    'B2',
    'B3',
    'C1',
  ]

  return zones.flatMap((zone, zoneIndex) =>
    Array.from({
      length:
        zone.startsWith('A')
          ? 48
          : 32,
    }).map((_, index) => {
      const component =
        components[
          (zoneIndex * 13 + index) %
            Math.max(components.length, 1)
        ]
      const occupied =
        components.length > 0 &&
        (index + zoneIndex) % 5 !== 0
      const occupancy =
        occupied
          ? 18 +
            ((index * 17 +
              zoneIndex * 11) %
              92)
          : 0
      const status =
        (index + zoneIndex) % 19 === 0
          ? 'RESERVED'
          : undefined

      return {
        id: `${zone}-${index}`,
        code: `${zone}-${String(index + 1).padStart(2, '0')}`,
        zone,
        row: zone[0],
        status: toneFromOccupancy(
          occupancy,
          status,
        ),
        occupancy:
          Math.min(occupancy, 100),
        materialCode:
          occupied && component
            ? component.code
            : undefined,
        materialName:
          occupied && component
            ? component.name
            : undefined,
        weight:
          occupied && component
            ? componentWeight(
                component,
                index,
              )
            : 0,
      }
    }),
  )
}

function buildCellsFromSlots(
  slots: YardSlot[],
  components: ComponentItem[],
) {
  if (slots.length === 0) {
    return buildSyntheticCells(
      components,
    )
  }

  return slots.map((slot, index) => {
    const occupancy =
      slotOccupancyPercent(slot)
    const placement =
      slot.placements?.[0]
    const component =
      components[
        index %
          Math.max(components.length, 1)
      ]

    return {
      id: slot.id,
      code: slot.code,
      zone:
        slot.zone?.code ??
        `Z${slot.zoneId.slice(0, 3)}`,
      row: slot.row?.code ?? 'A',
      status: toneFromOccupancy(
        occupancy,
        slot.status,
      ),
      occupancy,
      materialCode:
        placement?.itemCode ??
        component?.code,
      materialName:
        placement?.itemName ??
        component?.name,
      weight:
        placement?.weight ??
        (component
          ? componentWeight(
              component,
              index,
            )
          : 0),
    }
  })
}

function YardSpatialMap({
  cells,
  selectedCell,
  onSelectCell,
}: {
  cells: YardCell[]
  selectedCell?: YardCell | null
  onSelectCell: (cell: YardCell) => void
}) {
  const grouped = useMemo(
    () =>
      cells.reduce<
        Record<string, YardCell[]>
      >((acc, cell) => {
        acc[cell.zone] =
          acc[cell.zone] ?? []
        acc[cell.zone].push(cell)
        return acc
      }, {}),
    [cells],
  )

  return (
    <div className="relative min-h-[520px] overflow-hidden rounded-xl border border-cyan-500/10 bg-[#0b1522]">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.05)_1px,transparent_1px)] bg-[size:28px_28px]" />
      <div className="absolute left-4 top-4 z-10 flex items-center gap-2 rounded-lg border border-cyan-500/10 bg-black/35 px-3 py-2 text-xs text-zinc-300 backdrop-blur">
        <Map className="h-4 w-4 text-cyan-300" />
        Sơ đồ bãi 2D / slot occupancy
      </div>
      <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
        {[ZoomIn, ZoomOut, Maximize2, Layers].map((Icon) => (
          <button
            key={Icon.name}
            type="button"
            className="rounded-lg border border-cyan-500/10 bg-black/35 p-2 text-zinc-300 backdrop-blur hover:text-white"
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
      </div>
      <div className="relative grid min-h-[520px] grid-cols-4 gap-4 p-14">
        {Object.entries(grouped).map(
          ([zone, zoneCells]) => (
            <div
              key={zone}
              className="rounded-xl border border-slate-600/30 bg-black/20 p-3"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="rounded-md bg-blue-500/15 px-2 py-1 text-sm font-semibold text-blue-200">
                  {zone}
                </span>
                <span className="text-xs text-zinc-500">
                  {zoneCells.length} vị trí
                </span>
              </div>
              <div className="grid grid-cols-8 gap-1.5">
                {zoneCells.map((cell) => (
                  <button
                    key={cell.id}
                    type="button"
                    title={`${cell.code} / ${cell.occupancy}%`}
                    onClick={() =>
                      onSelectCell(cell)
                    }
                    className={`h-7 rounded border text-[9px] transition hover:scale-110 ${yardToneClassName[cell.status]} ${selectedCell?.id === cell.id ? 'ring-2 ring-cyan-300' : ''}`}
                  >
                    {cell.occupancy > 0
                      ? Math.round(
                          cell.occupancy,
                        )
                      : ''}
                  </button>
                ))}
              </div>
            </div>
          ),
        )}
      </div>
      <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-cyan-500/10 bg-black/35 px-4 py-3 text-xs text-zinc-300 backdrop-blur">
        <div className="flex flex-wrap items-center gap-4">
          {[
            ['empty', 'Trống'],
            ['normal', 'Đang sử dụng'],
            ['medium', 'Trung bình'],
            ['high', 'Cao'],
            ['overload', 'Quá tải'],
            ['blocked', 'Chặn/QC'],
          ].map(([tone, label]) => (
            <span
              key={tone}
              className="flex items-center gap-2"
            >
              <span className={`h-3 w-3 rounded border ${yardToneClassName[tone as YardTone]}`} />
              {label}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2">
            <Forklift className="h-4 w-4 text-amber-300" />
            Xe nâng
          </span>
          <span className="flex items-center gap-2">
            <LocateFixed className="h-4 w-4 text-blue-300" />
            Cổng ra vào
          </span>
          <span className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-red-300" />
            Khu vực chặn
          </span>
        </div>
      </div>
    </div>
  )
}

function zoneSummary(
  zones: YardZone[],
  cells: YardCell[],
) {
  if (zones.length > 0) {
    return zones.map((zone) => {
      const zoneCells = cells.filter(
        (cell) =>
          cell.zone === zone.code,
      )
      return {
        id: zone.id,
        code: zone.code,
        name: zone.name,
        slots: zoneCells.length,
        occupied: zoneCells.filter(
          (cell) =>
            cell.occupancy > 0,
        ).length,
      }
    })
  }

  return ['A', 'B', 'C'].map((row) => {
    const rowCells = cells.filter(
      (cell) => cell.row === row,
    )
    return {
      id: row,
      code: `Yard ${row}`,
      name: `Bãi ${row}`,
      slots: rowCells.length,
      occupied: rowCells.filter(
        (cell) =>
          cell.occupancy > 0,
      ).length,
    }
  })
}

export function YardMapPage() {
  const [search, setSearch] =
    useState('')
  const [
    selectedCell,
    setSelectedCell,
  ] = useState<YardCell | null>(null)

  const {
    data: components = [],
    isLoading,
  } = useComponentsQuery()
  const zonesQuery =
    useYardZonesQuery({
      limit: 100,
    })
  const slotsQuery =
    useYardSlotsQuery({
      limit: 500,
    })
  const metricsQuery =
    useYardMetricsQuery()

  const zones = normalizeList<YardZone>(
    zonesQuery.data,
  )
  const slots = normalizeList<YardSlot>(
    slotsQuery.data,
  )

  const cells = useMemo(
    () =>
      buildCellsFromSlots(
        slots,
        components,
      ),
    [components, slots],
  )

  const activeCell =
    selectedCell ?? cells[0] ?? null

  const occupiedCells =
    cells.filter(
      (cell) => cell.occupancy > 0,
    )
  const totalWeight =
    occupiedCells.reduce(
      (sum, cell) =>
        sum + cell.weight,
      0,
    )
  const overloaded =
    cells.filter(
      (cell) =>
        cell.status === 'overload',
    ).length
  const blocked =
    cells.filter(
      (cell) =>
        cell.status === 'blocked',
    ).length
  const occupancyRate =
    metricsQuery.data?.occupancyRate ??
    (cells.length > 0
      ? Math.round(
          (occupiedCells.length /
            cells.length) *
            100,
        )
      : 0)
  const summaries =
    zoneSummary(zones, cells)

  const filteredMaterials =
    components.filter((component) =>
      `${component.code} ${component.name} ${component.zone ?? ''} ${component.position ?? ''}`
        .toLowerCase()
        .includes(
          search.toLowerCase(),
        ),
    )

  const distribution = [
    {
      label: 'Thép hình',
      value: Math.round(
        totalWeight * 0.49,
      ),
      color: '#10b981',
    },
    {
      label: 'Thép tấm',
      value: Math.round(
        totalWeight * 0.28,
      ),
      color: '#2563eb',
    },
    {
      label: 'Thép hộp',
      value: Math.round(
        totalWeight * 0.16,
      ),
      color: '#8b5cf6',
    },
    {
      label: 'Thép ống',
      value: Math.max(
        Math.round(
          totalWeight * 0.07,
        ),
        0,
      ),
      color: '#ef4444',
    },
  ]

  return (
    <PageLayout
      title="Bãi vật liệu"
      description="Quản lý vật liệu, vị trí, tình trạng, sức chứa bãi và bản đồ slot vận hành."
      actions={
        <div className="flex items-center gap-2">
          <button className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-[0_0_28px_rgba(37,99,235,0.28)] hover:bg-blue-500">
            <Package className="h-4 w-4" />
            Nhập vật liệu
          </button>
          <button className="inline-flex h-10 items-center gap-2 rounded-lg border border-cyan-500/10 bg-[#0a1624] px-4 text-sm font-semibold text-zinc-200 hover:border-cyan-400/40">
            <Download className="h-4 w-4" />
            Xuất Excel
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <YardKpiCard
            label="Tổng vị trí"
            value={formatNumber(
              cells.length,
            )}
            sub="slot trong bãi"
            tone="blue"
            icon={
              <Box className="h-5 w-5" />
            }
          />
          <YardKpiCard
            label="Đang sử dụng"
            value={formatNumber(
              occupiedCells.length,
            )}
            sub={`${occupancyRate}% occupancy`}
            tone="green"
            icon={
              <Layers className="h-5 w-5" />
            }
          />
          <YardKpiCard
            label="Còn trống"
            value={formatNumber(
              Math.max(
                cells.length -
                  occupiedCells.length,
                0,
              ),
            )}
            sub={`${Math.max(100 - occupancyRate, 0)}% available`}
            tone="blue"
            icon={
              <Package className="h-5 w-5" />
            }
          />
          <YardKpiCard
            label="Tổng khối lượng"
            value={`${formatNumber(
              Math.round(totalWeight),
            )} kg`}
            sub="trong bãi"
            tone="amber"
            icon={
              <Weight className="h-5 w-5" />
            }
          />
          <YardKpiCard
            label="Quá tải"
            value={overloaded}
            sub="slot cần xử lý"
            tone="amber"
            icon={
              <AlertTriangle className="h-5 w-5" />
            }
          />
          <YardKpiCard
            label="Chặn / QC"
            value={blocked}
            sub="không được xuất"
            tone="cyan"
            icon={
              <ShieldAlert className="h-5 w-5" />
            }
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-[220px_1fr_360px]">
          <div className="space-y-3">
            <div className="rounded-xl border border-cyan-500/10 bg-[#081421] p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-white">
                  Bãi & khu vực
                </h2>
                <button className="rounded-md border border-cyan-500/10 bg-white/5 p-1.5 text-zinc-300 hover:text-white">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-1">
                {summaries.map((zone) => (
                  <button
                    key={zone.id}
                    type="button"
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-zinc-300 hover:bg-blue-500/10 hover:text-white"
                  >
                    <span>
                      <span className="block font-medium">
                        {zone.name}
                      </span>
                      <span className="text-xs text-zinc-500">
                        {zone.code}
                      </span>
                    </span>
                    <span className="text-xs text-zinc-500">
                      {zone.occupied}/{zone.slots}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-cyan-500/10 bg-[#081421] p-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-white">
                Bộ lọc nhanh
              </h2>
              <div className="mt-4 space-y-3">
                {[
                  'Loại vật liệu',
                  'Kích thước',
                  'Trạng thái',
                ].map((label) => (
                  <select
                    key={label}
                    className={`${inputClassName} w-full`}
                  >
                    <option>{label}</option>
                    <option>Tất cả</option>
                    <option>Đang sử dụng</option>
                    <option>Quá tải</option>
                    <option>Chặn QC</option>
                  </select>
                ))}
                <button className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 text-sm font-semibold text-white hover:bg-blue-500">
                  <Filter className="h-4 w-4" />
                  Áp dụng
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-cyan-500/10 bg-[#081421] p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-white">
                  Sơ đồ bãi
                </h2>
                <select className={inputClassName}>
                  <option>Bãi chính - Yard A</option>
                  <option>Bãi phụ - Yard B</option>
                  <option>Bãi thành phẩm - Yard C</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <button className="rounded-lg border border-cyan-500/10 bg-white/5 px-3 py-2 text-xs text-zinc-300 hover:text-white">
                  3D
                </button>
                <button className="rounded-lg border border-cyan-500/10 bg-white/5 p-2 text-zinc-300 hover:text-white">
                  <RefreshCcw className="h-4 w-4" />
                </button>
                <button className="rounded-lg border border-cyan-500/10 bg-white/5 p-2 text-zinc-300 hover:text-white">
                  <SlidersHorizontal className="h-4 w-4" />
                </button>
              </div>
            </div>
            <YardSpatialMap
              cells={cells}
              selectedCell={activeCell}
              onSelectCell={setSelectedCell}
            />
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-cyan-500/10 bg-[#081421] p-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-white">
                Tổng quan theo loại vật liệu
              </h2>
              <div className="mt-5">
                <DistributionDonut
                  total={Math.round(
                    totalWeight,
                  )}
                  values={distribution}
                />
              </div>
            </div>
            <div className="rounded-xl border border-cyan-500/10 bg-[#081421] p-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-white">
                Tình trạng bãi
              </h2>
              <div className="mt-4 space-y-3">
                {[
                  ['Đang sử dụng', occupancyRate, 'bg-emerald-500'],
                  ['Còn trống', Math.max(100 - occupancyRate, 0), 'bg-blue-500'],
                  ['Quá tải', cells.length > 0 ? Math.round((overloaded / cells.length) * 100) : 0, 'bg-red-500'],
                  ['Bảo trì', 3, 'bg-amber-500'],
                  ['Khu vực chặn', cells.length > 0 ? Math.round((blocked / cells.length) * 100) : 0, 'bg-violet-500'],
                ].map(([label, value, color]) => (
                  <div
                    key={label as string}
                    className="grid grid-cols-[90px_1fr_44px] items-center gap-3 text-sm"
                  >
                    <span className="text-zinc-400">
                      {label as string}
                    </span>
                    <div className="h-2 rounded-full bg-slate-800">
                      <div
                        className={`h-full rounded-full ${color as string}`}
                        style={{
                          width: `${value as number}%`,
                        }}
                      />
                    </div>
                    <span className="text-right text-zinc-300">
                      {value as number}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-cyan-500/10 bg-[#081421] p-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-white">
                Chi tiết vị trí
              </h2>
              <div className="mt-4 space-y-2 text-sm">
                {[
                  ['Slot', activeCell?.code ?? '-'],
                  ['Zone', activeCell?.zone ?? '-'],
                  ['Occupancy', activeCell ? `${activeCell.occupancy}%` : '-'],
                  ['Vật liệu', activeCell?.materialCode ?? 'Trống'],
                  ['Tên', activeCell?.materialName ?? '-'],
                  ['Khối lượng', activeCell ? `${formatNumber(activeCell.weight)} kg` : '-'],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between border-b border-cyan-500/10 py-2"
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

        <div className="rounded-xl border border-cyan-500/10 bg-[#081421] p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-white">
                Danh sách vật liệu trong bãi
              </h2>
              <p className="text-xs text-zinc-500">
                Bảng vận hành theo mã vật liệu, vị trí, khối lượng, ngày nhập và trạng thái slot.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value,
                    )
                  }
                  placeholder="Tìm kiếm..."
                  className={`${inputClassName} w-64 pl-9`}
                />
              </div>
              <button className="rounded-lg border border-cyan-500/10 bg-white/5 p-2 text-zinc-300 hover:text-white">
                <Filter className="h-4 w-4" />
              </button>
            </div>
          </div>
          <DataTable
            data={filteredMaterials}
            loading={isLoading}
            rowKey={(row) => row.id}
            density="compact"
            stickyHeader
            savedViewName="Yard material control"
            empty="Chưa có vật liệu trong bãi"
            statusTone={(row) =>
              row.status === 'INSTALLED'
                ? 'success'
                : row.status === 'DELIVERED'
                  ? 'warning'
                  : 'info'
            }
            rowActions={() => (
              <div className="flex justify-end gap-1">
                <button className="rounded-md border border-cyan-500/10 bg-white/5 p-1.5 text-zinc-300 hover:text-white">
                  <Eye className="h-4 w-4" />
                </button>
                <button className="rounded-md border border-cyan-500/10 bg-white/5 p-1.5 text-zinc-300 hover:text-white">
                  <LocateFixed className="h-4 w-4" />
                </button>
              </div>
            )}
            columns={[
              {
                key: 'code',
                header: 'Mã vật liệu',
                pinned: 'left',
                render: (row) => (
                  <span className="font-semibold text-blue-400">
                    {row.code}
                  </span>
                ),
              },
              {
                key: 'name',
                header: 'Tên vật liệu',
                render: (row) => row.name,
              },
              {
                key: 'type',
                header: 'Loại',
                render: (row) => {
                  const index =
                    filteredMaterials.indexOf(
                      row,
                    )

                  return [
                    'Thép hình',
                    'Thép tấm',
                    'Thép hộp',
                    'Thép ống',
                    'Phụ kiện',
                  ][Math.max(index, 0) % 5]
                },
              },
              {
                key: 'size',
                header: 'Kích thước',
                render: (row) => {
                  const index =
                    filteredMaterials.indexOf(
                      row,
                    )

                  return [
                    'HEA 300',
                    '12mm',
                    '200x100x6',
                    'Ø114x4.5',
                    'M20 x 60',
                  ][Math.max(index, 0) % 5]
                },
              },
              {
                key: 'location',
                header: 'Vị trí',
                render: (row) =>
                  [
                    row.floor,
                    row.zone,
                    row.position,
                  ]
                    .filter(Boolean)
                    .join(' / ') ||
                  activeCell?.code ||
                  'A1-03-05',
              },
              {
                key: 'weight',
                header: 'Khối lượng',
                align: 'right',
                render: (row) => {
                  const index =
                    filteredMaterials.indexOf(
                      row,
                    )

                  return `${formatNumber(
                    componentWeight(
                      row,
                      Math.max(index, 0),
                    ),
                  )} kg`
                },
              },
              {
                key: 'quantity',
                header: 'Số lượng',
                align: 'right',
                render: (row) => {
                  const index =
                    filteredMaterials.indexOf(
                      row,
                    )

                  return 8 + (index % 64)
                },
              },
              {
                key: 'status',
                header: 'Trạng thái',
                render: (row) => (
                  <StatusBadge
                    tone={
                      row.status ===
                      'INSTALLED'
                        ? 'success'
                        : row.status ===
                            'DELIVERED'
                          ? 'warning'
                          : 'info'
                    }
                  >
                    {row.status}
                  </StatusBadge>
                ),
              },
              {
                key: 'date',
                header: 'Ngày nhập',
                render: (row) => {
                  const index =
                    filteredMaterials.indexOf(
                      row,
                    )

                  return `${String(1 + (index % 28)).padStart(2, '0')}/06/2025`
                },
              },
            ]}
          />
        </div>
      </div>
    </PageLayout>
  )
}
