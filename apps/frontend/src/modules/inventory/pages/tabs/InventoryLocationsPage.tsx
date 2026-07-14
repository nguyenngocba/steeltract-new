import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Edit3, Eye, Layers3, MapPinned, Package, Power, PowerOff, Trash2, Warehouse, X } from 'lucide-react'
import { useInventoryTransactions } from '../../hooks/useInventoryTransactions'
import { EnterpriseModulePage } from '../../../../shared/runtime-tabs/EnterpriseModulePage'
import { InventoryTabWorkspace } from '../../components/InventoryTabWorkspace'
import { useInventoryAudit } from '../../hooks/useInventoryAudit'
import { moduleMutedButton } from '@/shared/ui/modules'
import {
  CompactDonutSummary,
  HorizontalBars,
  InventoryPanel,
  InventoryPagination,
  inventoryInput,
  inventoryTableRow,
  inventoryMutedButton,
} from '../../components/InventoryVisuals'
import { CockpitChartCard, CockpitKpiCard, COCKPIT_HEIGHTS, DataTablePagination } from '../../../../shared/ui/cockpit'
import { activateZone, createZone, deactivateZone, deleteZone, getZoneDetail, updateZone, type WarehouseLocation, type WarehouseLocationDetail } from '../../api/zones.api'
import { useZones } from '../../hooks/useZones'
import { useWarehouses } from '../../hooks/useWarehouses'
import { formatCurrencyVnd, formatDateTime, formatQuantity, formatQuantityInput, parseLocaleNumber } from '@/shared/utils/number-format'

const PAGE_SIZE = 5
const LOCATION_ROWS = ['A', 'B', 'C', 'D', 'E', 'F']
const LOCATION_COLUMNS = ['01', '02', '03', '04', '05', '06']
const LOCATION_LEVELS = ['L1', 'L2', 'L3', 'L4']
const TOTAL_CELL_LEVELS = LOCATION_ROWS.length * LOCATION_COLUMNS.length * LOCATION_LEVELS.length

type LocationForm = {
  id?: string
  code: string
  name: string
  row: string
  column: string
  level: string
  capacity: string
  description: string
  active: boolean
  warehouseId: string
}

type SlotMaterialView = {
  id: string
  label: string
  zoneCode: string
  slotId: string
  level: string
  quantity: number
  value: number
  materials: Array<{
    id: string
    code: string
    name: string
    quantity: number
    unit?: string | null
    value: number
  }>
}

const emptyForm: LocationForm = {
  code: '',
  name: '',
  row: '',
  column: '',
  level: '',
  capacity: '',
  description: '',
  active: true,
  warehouseId: '',
}

function n(value: unknown) {
  const parsed = parseLocaleNumber(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function formatCurrency(value: unknown) {
  return formatCurrencyVnd(n(value))
}

function transactionRows(data: any) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.data)) return data.data
  return []
}

function transactionItems(tx: any) {
  return Array.isArray(tx?.items) ? tx.items : []
}

function lineAmount(line: any) {
  const explicit = Math.abs(n(line?.totalAmount))
  if (explicit) return explicit
  return Math.abs(n(line?.quantity)) * n(line?.unitPrice)
}

function lineLocationLabel(line: any) {
  return [
    line?.zone?.code ?? line?.zoneCode,
    line?.slot?.code ?? line?.slotId,
    line?.level,
  ].filter(Boolean).join('/') || 'Không rõ vị trí'
}

function transactionActivityRows(tx: any, absoluteQuantity: boolean) {
  const items = transactionItems(tx)
  const activityItems = items.length ? items : [undefined]

  return activityItems.map((line: any) => ({
    date: tx.transactionDate ?? tx.createdAt,
    code: line?.inventoryItem?.code ?? 'N/A',
    name: line?.inventoryItem?.name ?? tx.itemName ?? 'Vật tư',
    quantity: absoluteQuantity ? Math.abs(n(line?.quantity)) : n(line?.quantity),
    slot: line?.slot?.code ?? line?.slotId ?? '-',
    level: line?.level ?? '-',
  }))
}

function materialCodeFromAudit(row: any) {
  return String(row?.materialCode ?? row?.code ?? row?.inventoryItem?.code ?? '').trim()
}

function materialCostFromAudit(row: any) {
  return n(row?.averageCost ?? row?.avgCost ?? row?.unitPrice ?? row?.costPrice ?? row?.inventoryItem?.averageCost)
}

function auditZone(zone: WarehouseLocation) {
  if (zone.code.startsWith('DEMO-')) return 'Demo record'
  if (zone.code.startsWith('ST-WH-')) return 'Warehouse-like record'
  if (zone.row || zone.column || zone.level || /^[A-Z]\d{2}$/i.test(zone.code)) return 'Real storage location'
  return 'Needs review'
}

function isRealStorageLocation(zone: WarehouseLocation) {
  return auditZone(zone) === 'Real storage location'
}
// ================= COMPONENT METRIC CARD =================
function formatShortCurrency(value: number) {
  if (value >= 1e9) {
    return `${(value / 1e9).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} tỷ`
  }
  if (value >= 1e6) {
    return `${(value / 1e6).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} triệu`
  }
  return formatCurrency(value)
}
function VerticalBarChart({
  data,
}: {
  data: Array<{ label: string; value: number; color: string }>
}) {
  const max = Math.max(1, ...data.map((d) => d.value))
  return (
    <div className={`flex h-[115px] items-end justify-around gap-2 pt-2 px-1`}>
      {data.map((item, idx) => {
        const percent = (item.value / max) * 100
        return (
          <div key={idx} className="flex flex-col items-center flex-1 h-full justify-end group">
            <span className="text-[10px] font-mono text-slate-400 mb-1 font-semibold">{item.value}</span>
            <div
              className="w-7 rounded-t transition-all duration-300 hover:brightness-110"
              style={{
                height: `${Math.max(6, (item.value / max) * 65)}px`,
                backgroundColor: item.color,
                boxShadow: `0 2px 8px ${item.color}25`,
              }}
            />
            <span className="text-[10px] text-slate-400 mt-1.5 truncate max-w-full text-center">{item.label}</span>
          </div>
        )
      })}
    </div>
  )
}

function CompactPieChart({
  segments,
}: {
  segments: Array<{ label: string; value: number; color: string }>
}) {
  const total = Math.max(1, segments.reduce((sum, item) => sum + item.value, 0))
  let cursor = 0
  const gradient = segments
    .map((item) => {
      const start = cursor
      const end = cursor + (item.value / total) * 100
      cursor = end
      return `${item.color} ${start}% ${end}%`
    })
    .join(', ')

  return (
    <div className="grid grid-cols-[100px_1fr] items-center gap-3 pt-1">
      <div
        className="relative h-20 w-20 rounded-full shadow-[0_12px_32px_rgba(0,0,0,0.3)] transition-transform hover:scale-105 duration-300 mx-auto"
        style={{ background: `conic-gradient(${gradient})` }}
      />
      <div className="space-y-1 overflow-hidden">
        {segments.slice(0, 6).map((item, idx) => {
          const percent = (item.value / total) * 100
          return (
            <div key={idx} className="grid grid-cols-[1fr_auto] items-center gap-2 text-[10px]">
              <span className="flex min-w-0 items-center gap-1.5 text-slate-300">
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="truncate">{item.label}</span>
              </span>
              <span className="whitespace-nowrap text-slate-400 font-mono">
                {formatQuantity(item.value, 0)} tấn ({percent.toFixed(0)}%)
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function LocationsChartCard({
  title,
  subtitle,
  value,
  action,
  children,
  className = '',
  heightClass = '',
}: {
  title: string
  subtitle?: string
  value?: string | number
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
  heightClass?: string
}) {
  return (
    <CockpitChartCard
      title={title}
      value={value}
      subtitle={subtitle}
      action={action}
      className={className}
      heightClass={heightClass}
    >
      {children}
    </CockpitChartCard>
  )
}

function getDeltaNote(current: number, previous: number, unit: string, isCurrency = false) {
  const diff = current - previous
  const percent = previous > 0 ? (diff / previous) * 100 : 0
  const sign = diff > 0 ? '▲' : diff < 0 ? '▼' : ''
  const colorClass = diff > 0 ? 'text-emerald-400' : diff < 0 ? 'text-red-400' : 'text-slate-400'
  
  let formattedDiff = ''
  if (isCurrency) {
    formattedDiff = formatCurrency(Math.abs(diff))
  } else {
    const decimals = (unit === 'tấn' || unit === '%') ? 1 : 0
    const space = (unit === '%' || unit === '') ? '' : ' '
    formattedDiff = `${formatQuantity(Math.abs(diff), decimals)}${space}${unit}`
  }
  
  const formattedPercent = percent >= 0 ? `+${percent.toFixed(1)}%` : `${percent.toFixed(1)}%`
  
  if (diff === 0) {
    return {
      text: `${isCurrency ? '0 đ' : `0${unit === '%' ? '' : ' '}${unit}`} (0.0%)`,
      colorClass: 'text-slate-400'
    }
  }

  return {
    text: `${sign}${formattedDiff} (${formattedPercent})`,
    colorClass
  }
}

function InventoryMetricCard({
  title,
  value,
  note,
  noteClassName,
  tone = 'blue',
  icon,
  trend,
  active,
  onClick,
}: {
  title: string
  value: React.ReactNode
  note?: React.ReactNode
  noteClassName?: string
  tone?: 'blue' | 'emerald' | 'cyan' | 'amber' | 'red' | 'purple' | 'indigo' | 'violet' | 'orange'
  icon: React.ReactNode
  trend: number[]
  active?: boolean
  onClick?: () => void
}) {
  return (
    <CockpitKpiCard
      title={title}
      value={value}
      note={note}
      noteClassName={noteClassName}
      tone={tone}
      icon={icon}
      trend={trend}
      active={active}
      onClick={onClick}
    />
  )
}

export function InventoryLocationsPage() {
  const queryClient = useQueryClient()
  const { data: zones = [], isLoading } = useZones()
  const { data: warehouses = [] } = useWarehouses()
  const { data: transactionsData = [] } = useInventoryTransactions({})
  const { data: auditRows = [] } = useInventoryAudit()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [warehouseFilter, setWarehouseFilter] = useState('')
  const [page, setPage] = useState(1)
  const [form, setForm] = useState<LocationForm | null>(null)
  const [detailId, setDetailId] = useState('')
  const [selectedSlot, setSelectedSlot] = useState<SlotMaterialView | null>(null)
  const [modalType, setModalType] = useState<'value' | 'maxStock' | 'recentInbound' | 'recentOutbound' | 'topMaterials' | 'zoneCapacity' | null>(null)
  const { data: detail } = useQuery({
    queryKey: ['inventory-zone-detail', detailId],
    queryFn: () => getZoneDetail(detailId),
    enabled: Boolean(detailId),
  })
  // State cho ô tìm kiếm (chỉ áp dụng khi nhấn nút/Enter)
  const [searchDraft, setSearchDraft] = useState('')

  // Hàm áp dụng tìm kiếm
  const applySearch = () => {
    setQuery(searchDraft)  // cập nhật query thật
    setPage(1)             // về trang 1
    refresh()              // tải lại dữ liệu
  }

  // Hàm làm mới (reset tất cả filter)
  const resetFilters = () => {
    setSearchDraft('')
    setQuery('')
    setStatus('all')
    setWarehouseFilter('')
    setPage(1)
    refresh()
  }

  // ========== 1. RECENT INBOUND / OUTBOUND DATA ==========
  const recentInboundData = useMemo(() => {
    const txRows = Array.isArray(transactionsData) ? transactionsData : transactionsData?.data ?? []
    return txRows
      .filter((tx: any) => String(tx.type ?? '').toUpperCase() === 'INBOUND')
      .sort((a: any, b: any) => {
        const dateA = a.transactionDate ?? a.createdAt ?? 0
        const dateB = b.transactionDate ?? b.createdAt ?? 0
        return new Date(dateB).getTime() - new Date(dateA).getTime()
      })
      .flatMap((tx: any) => transactionActivityRows(tx, false))
  }, [transactionsData])

  const recentOutboundData = useMemo(() => {
    const txRows = Array.isArray(transactionsData) ? transactionsData : transactionsData?.data ?? []
    return txRows
      .filter((tx: any) => String(tx.type ?? '').toUpperCase() === 'OUTBOUND')
      .sort((a: any, b: any) => {
        const dateA = a.transactionDate ?? a.createdAt ?? 0
        const dateB = b.transactionDate ?? b.createdAt ?? 0
        return new Date(dateB).getTime() - new Date(dateA).getTime()
      })
      .flatMap((tx: any) => transactionActivityRows(tx, true))
  }, [transactionsData])

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['inventory-zones'] }),
      queryClient.invalidateQueries({ queryKey: ['inventory-zone-detail'] }),
    ])
  }
  const handleSearch = () => {
    setPage(1)
    refresh()
  }

  const handleRefresh = () => {
    setPage(1)
    refresh()
  }

  const saveMutation = useMutation({
    mutationFn: async (payload: LocationForm) => {
      const body = {
        code: payload.code,
        name: payload.name,
        row: payload.row || undefined,
        column: payload.column || undefined,
        level: payload.level || undefined,
        capacity: n(payload.capacity),
        description: payload.description || undefined,
        active: payload.active,
        warehouseId: payload.warehouseId || undefined,
      }
      if (payload.id) return updateZone(payload.id, body)
      return createZone(body)
    },
    onSuccess: async () => {
      setForm(null)
      await refresh()
    },
  })
  const activateMutation = useMutation({ mutationFn: activateZone, onSuccess: refresh })
  const deactivateMutation = useMutation({ mutationFn: deactivateZone, onSuccess: refresh })
  const deleteMutation = useMutation({ mutationFn: deleteZone, onSuccess: refresh })

  const rows = useMemo(() => {
  const q = query.trim().toLowerCase()
  return (zones as WarehouseLocation[])
    .filter(isRealStorageLocation)
    .map((zone) => ({ ...zone, auditType: auditZone(zone) }))
    .filter((zone) => {
      if (status === 'active' && !zone.active) return false
      if (status === 'inactive' && zone.active) return false
      // Lọc theo kho
      if (warehouseFilter && zone.warehouseId !== warehouseFilter) return false
      if (!q) return true
      return [zone.code, zone.name, zone.row, zone.column, zone.level, zone.description, zone.auditType]
        .join(' ')
        .toLowerCase()
        .includes(q)
    })
}, [zones, query, status, warehouseFilter])
  const pagedRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const materialCostByCode = useMemo(() => {
    const map = new Map<string, number>()
    ;(auditRows as any[]).forEach((row) => {
      const code = materialCodeFromAudit(row)
      if (!code) return
      map.set(code, materialCostFromAudit(row))
    })
    return map
  }, [auditRows])

  const slotViews = useMemo<SlotMaterialView[]>(() => rows.flatMap((zone) => (zone.cellOccupancy ?? [])
    .filter((cell) => n(cell.totalQuantity) > 0 || n(cell.materialCount) > 0)
    .map((cell) => {
      const materials = (cell.materials ?? []).map((material) => {
        const quantity = n(material.quantity)
        const value = quantity * (materialCostByCode.get(material.code) ?? 0)
        return {
          id: material.id,
          code: material.code,
          name: material.name,
          quantity,
          unit: material.unit,
          value,
        }
      })
      const quantity = materials.length
        ? materials.reduce((sum, material) => sum + material.quantity, 0)
        : n(cell.totalQuantity)
      const value = materials.reduce((sum, material) => sum + material.value, 0)
      const slotId = cell.slotId || zone.code
      const level = cell.level || 'L1'
      return {
        id: `${zone.id}-${slotId}-${level}`,
        label: `${zone.code}/${slotId}/${level}`,
        zoneCode: zone.code,
        slotId,
        level,
        quantity,
        value,
        materials,
      }
    })), [materialCostByCode, rows])

  const valueByZone = useMemo(() => {
    const map = new Map<string, number>()
    slotViews.forEach((slot) => {
      map.set(slot.zoneCode, (map.get(slot.zoneCode) ?? 0) + slot.value)
    })
    return map
  }, [slotViews])

  const activeRealZones = useMemo(() => rows.filter((z) => z.active), [rows])
  const inactiveRealZones = useMemo(() => rows.filter((z) => !z.active), [rows])
  const totalActiveCapacity = activeRealZones.length * TOTAL_CELL_LEVELS
  const occupiedSlots = slotViews.length
  const freeSlots = Math.max(0, totalActiveCapacity - occupiedSlots)
  const maintenanceSlots = inactiveRealZones.length * TOTAL_CELL_LEVELS
  const totalCapacitySum = totalActiveCapacity + maintenanceSlots
  const occupancyPercent = totalCapacitySum > 0 ? (occupiedSlots / totalCapacitySum) * 100 : 0
  const inventoryValue = Array.from(valueByZone.values()).reduce((sum, value) => sum + value, 0)

  const stats = useMemo(() => ({
    total: (zones as WarehouseLocation[]).length,
    active: (zones as WarehouseLocation[]).filter((zone) => zone.active).length,
    demo: (zones as WarehouseLocation[]).filter((zone) => auditZone(zone) === 'Demo record').length,
    warehouseLike: (zones as WarehouseLocation[]).filter((zone) => auditZone(zone) === 'Warehouse-like record').length,
    real: (zones as WarehouseLocation[]).filter((zone) => auditZone(zone) === 'Real storage location').length,
    materialCount: (zones as WarehouseLocation[]).filter(isRealStorageLocation).reduce((sum, zone) => sum + n(zone.materialCount), 0),
    stock: (zones as WarehouseLocation[]).filter(isRealStorageLocation).reduce((sum, zone) => sum + n(zone.totalStockQuantity), 0),
    occupiedSlots,
    freeSlots,
    occupancyPercent,
    inventoryValue,
  }), [freeSlots, inventoryValue, occupancyPercent, occupiedSlots, zones])

  const locationSegments = useMemo(() => [
    { label: 'Đang hoạt động', value: stats.active, color: '#14c987' },
    { label: 'Ngưng dùng', value: Math.max(0, stats.total - stats.active), color: '#64748b' },
    { label: 'Vị trí thật', value: stats.real, color: '#1d7cff' },
  ], [stats.active, stats.real, stats.total])

  const stockByLocation = useMemo(() => rows
    .slice()
    .sort((a, b) => n(b.totalStockQuantity) - n(a.totalStockQuantity))
    .map((zone) => [zone.code, n(zone.totalStockQuantity)] as [string, number]), [rows])

  const valueByLocation = useMemo(() => rows
    .map((zone) => ({ code: zone.code, value: valueByZone.get(zone.code) ?? 0 }))
    .sort((a, b) => b.value - a.value), [rows, valueByZone])

  const topOccupiedSlotsData = useMemo(() => {
    return slotViews
      .map((slot) => {
        const zone = rows.find((z) => z.code === slot.zoneCode)
        const zoneCapacity = zone ? n(zone.capacity) : 1
        const percent = zoneCapacity > 0 ? (slot.quantity / zoneCapacity) * 100 : 0
        return {
          ...slot,
          percent: Math.min(100, percent),
          displayPercent: percent,
        }
      })
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 6)
  }, [slotViews, rows])

  const topMaterialsFromSlots = useMemo(() => {
    const map = new Map<string, {
      code: string
      name: string
      stock: number
      value: number
      locations: string[]
    }>()

    slotViews.forEach((slot) => {
      slot.materials.forEach((m) => {
        let entry = map.get(m.code)
        if (!entry) {
          entry = {
            code: m.code,
            name: m.name,
            stock: 0,
            value: 0,
            locations: [],
          }
          map.set(m.code, entry)
        }
        entry.stock += m.quantity
        entry.value += m.value
        if (!entry.locations.includes(slot.zoneCode)) {
          entry.locations.push(slot.zoneCode)
        }
      })
    })

    const list = Array.from(map.values()).sort((a, b) => b.stock - a.stock)
    const maxStock = list[0]?.stock || 1

    return list.map((item) => ({
      ...item,
      percent: (item.stock / maxStock) * 100,
      locationStr: item.locations.slice(0, 3).join(', ') + (item.locations.length > 3 ? '...' : ''),
    }))
  }, [slotViews])

  const zoneCapacityDist = useMemo(() => rows
    .map((zone) => {
      const zoneSlots = slotViews.filter((slot) => slot.zoneCode === zone.code).length
      const stock = n(zone.totalStockQuantity)
      const capacity = n(zone.capacity)
      return {
        id: zone.id,
        code: zone.code,
        name: zone.name,
        stock,
        capacity,
        occupiedSlots: zoneSlots,
      }
    })
    .sort((a, b) => b.stock - a.stock), [rows, slotViews])

  const [modalPage, setModalPage] = useState(1)
  const modalPageSize = 16

  const modalData = useMemo(() => {
    if (modalType === 'recentInbound') return recentInboundData
    if (modalType === 'recentOutbound') return recentOutboundData
    if (modalType === 'topMaterials') return topMaterialsFromSlots
    if (modalType === 'zoneCapacity') return zoneCapacityDist
    return []
  }, [modalType, recentInboundData, recentOutboundData, topMaterialsFromSlots, zoneCapacityDist])

  const pagedModalData = useMemo(() => {
    const start = (modalPage - 1) * modalPageSize
    return modalData.slice(start, start + modalPageSize)
  }, [modalData, modalPage])

  const totalModalPages = Math.max(1, Math.ceil(modalData.length / modalPageSize))

  useEffect(() => {
    setModalPage(1)
  }, [modalType, modalData])

  const previewValueByLocation = useMemo(() => {
    return valueByLocation.slice().sort((a, b) => b.value - a.value).slice(0, 5)
  }, [valueByLocation])

  const previewStockByLocation = useMemo(() => {
    return stockByLocation.slice().sort((a, b) => b[1] - a[1]).slice(0, 5)
  }, [stockByLocation])

  const previewRecentInbound = useMemo(() => {
    return recentInboundData.slice(0, 5)
  }, [recentInboundData])

  const previewRecentOutbound = useMemo(() => {
    return recentOutboundData.slice(0, 5)
  }, [recentOutboundData])

  const previewTopMaterials = useMemo(() => {
    return topMaterialsFromSlots.slice().sort((a, b) => b.stock - a.stock).slice(0, 5)
  }, [topMaterialsFromSlots])

  const previewZoneCapacity = useMemo(() => {
    return zoneCapacityDist.slice().sort((a, b) => b.capacity - a.capacity).slice(0, 5)
  }, [zoneCapacityDist])

  const materialUsageByCode = useMemo(() => {
    const map = new Map<string, string>()
    ;(auditRows as any[]).forEach((row) => {
      const code = materialCodeFromAudit(row)
      if (!code) return
      map.set(code, String(row.materialUsageType ?? row.usageType ?? 'PRIMARY').toUpperCase())
    })
    return map
  }, [auditRows])

  const materialTypeDistribution = useMemo(() => {
  let primaryStock = 0
  let secondaryStock = 0
  let consumableStock = 0

  slotViews.forEach((slot) => {
    slot.materials.forEach((m) => {
      const usage = materialUsageByCode.get(m.code) ?? 'PRIMARY'
      if (usage === 'PRIMARY') {
        primaryStock += m.quantity
      } else if (usage === 'SECONDARY') {
        secondaryStock += m.quantity
      } else if (usage === 'CONSUMABLE') {
        consumableStock += m.quantity
      }
    })
  })

  const total = primaryStock + secondaryStock + consumableStock

  return {
    primary: primaryStock,
    secondary: secondaryStock,
    consumable: consumableStock,
    total,
  }
}, [slotViews, materialUsageByCode])

  const zoneStatusStats = useMemo(() => {
    let using = 0
    let empty = 0
    let maintenance = 0

    rows.forEach((zone) => {
      if (!zone.active) {
        maintenance++
      } else if (n(zone.totalStockQuantity) > 0) {
        using++
      } else {
        empty++
      }
    })

    const total = using + empty + maintenance
    const percentUsing = total > 0 ? (using / total) * 100 : 0

    return {
      using,
      empty,
      maintenance,
      total,
      percentUsing,
    }
  }, [rows])

  const kpiTrendsAndDeltas = useMemo(() => {
    const now = new Date()
    const snapshotDates = Array.from({ length: 6 }).map((_, index) => {
      const monthsBack = 5 - index
      const date = new Date(now.getFullYear(), now.getMonth() - monthsBack + 1, 0, 23, 59, 59, 999)
      return date > now ? now : date
    })

    // Build current zone material stock map
    const zoneMaterialStock = new Map<string, Map<string, number>>()
    slotViews.forEach((slot) => {
      const zoneCode = slot.zoneCode
      if (!zoneMaterialStock.has(zoneCode)) {
        zoneMaterialStock.set(zoneCode, new Map<string, number>())
      }
      const matMap = zoneMaterialStock.get(zoneCode)!
      slot.materials.forEach((m) => {
        const currentQty = matMap.get(m.code) ?? 0
        matMap.set(m.code, currentQty + m.quantity)
      })
    })

    // Build current slot stock map
    const slotStockMap = new Map<string, number>()
    slotViews.forEach((slot) => {
      slotStockMap.set(slot.label, slot.quantity)
    })

    const txRows = Array.isArray(transactionsData) ? transactionsData : transactionsData?.data ?? []
    
    // Movements for zone material level rollback
    const movements = txRows.flatMap((tx: any) => {
      const txDate = tx.transactionDate ?? tx.createdAt
      if (!txDate) return []
      const dateObj = new Date(txDate)
      const items = Array.isArray(tx.items) ? tx.items : []
      return items.map((line: any) => {
        const zoneCode = line?.zone?.code ?? line?.zoneCode
        const materialCode = line?.inventoryItem?.code ?? line?.materialCode
        return {
          zoneCode: zoneCode ? String(zoneCode) : null,
          materialCode: materialCode ? String(materialCode) : null,
          quantity: n(line.quantity),
          date: dateObj,
        }
      })
    })

    // Movements for slot level rollback
    const slotMovements = txRows.flatMap((tx: any) => {
      const txDate = tx.transactionDate ?? tx.createdAt
      if (!txDate) return []
      const dateObj = new Date(txDate)
      const items = Array.isArray(tx.items) ? tx.items : []
      return items.map((line: any) => {
        const zoneCode = line?.zone?.code ?? line?.zoneCode
        const slotId = line?.slot?.code ?? line?.slotId
        const level = line?.level
        const slotLabel = [zoneCode, slotId, level].filter(Boolean).join('/')
        return {
          slotLabel,
          quantity: n(line.quantity),
          date: dateObj,
        }
      })
    })

    const getHistoricalState = (targetDate: Date) => {
      // Slot state rollback
      const slotState = new Map(slotStockMap)
      slotMovements.forEach((mv) => {
        if (mv.date > targetDate && mv.slotLabel) {
          const currentQty = slotState.get(mv.slotLabel) ?? 0
          slotState.set(mv.slotLabel, currentQty - mv.quantity)
        }
      })

      let occupiedSlotsCount = 0
      slotState.forEach((qty) => {
        if (qty > 0) {
          occupiedSlotsCount++
        }
      })

      // Zone material state rollback
      const zoneMaterialState = new Map<string, Map<string, number>>()
      zoneMaterialStock.forEach((matMap, zoneCode) => {
        zoneMaterialState.set(zoneCode, new Map(matMap))
      })

      movements.forEach((mv) => {
        if (mv.date > targetDate && mv.zoneCode && mv.materialCode) {
          const matMap = zoneMaterialState.get(mv.zoneCode)
          if (matMap) {
            const currentQty = matMap.get(mv.materialCode) ?? 0
            matMap.set(mv.materialCode, currentQty - mv.quantity)
          } else {
            const newMap = new Map<string, number>()
            newMap.set(mv.materialCode, -mv.quantity)
            zoneMaterialState.set(mv.zoneCode, newMap)
          }
        }
      })

      let occupiedLocations = 0
      let emptyLocations = 0
      let totalStock = 0
      let totalValue = 0

      rows.forEach((zone) => {
        const matMap = zoneMaterialState.get(zone.code)
        let zoneStock = 0
        let zoneValue = 0
        if (matMap) {
          matMap.forEach((qty, matCode) => {
            const safeQty = Math.max(0, qty)
            zoneStock += safeQty
            const cost = materialCostByCode.get(matCode) ?? 0
            zoneValue += safeQty * cost
          })
        }

        if (zone.active) {
          if (zoneStock > 0) {
            occupiedLocations++
          } else {
            emptyLocations++
          }
        }
        totalStock += zoneStock
        totalValue += zoneValue
      })

      const totalCapacity = rows.length * TOTAL_CELL_LEVELS
      const occupancyPercent = totalCapacity > 0 ? (occupiedSlotsCount / totalCapacity) * 100 : 0

      return {
        totalLocations: rows.length,
        occupiedLocations,
        emptyLocations,
        occupancyPercent,
        totalStock,
        totalValue,
      }
    }

    const snapshots = snapshotDates.map((date) => getHistoricalState(date))

    const totalLocationsTrend = snapshots.map((s) => s.totalLocations)
    const occupiedLocationsTrend = snapshots.map((s) => s.occupiedLocations)
    const emptyLocationsTrend = snapshots.map((s) => s.emptyLocations)
    const occupancyPercentTrend = snapshots.map((s) => s.occupancyPercent)
    const totalStockTrend = snapshots.map((s) => s.totalStock)
    const totalValueTrend = snapshots.map((s) => s.totalValue)

    return {
      snapshots,
      totalLocationsTrend,
      occupiedLocationsTrend,
      emptyLocationsTrend,
      occupancyPercentTrend,
      totalStockTrend,
      totalValueTrend,
    }
  }, [rows, slotViews, transactionsData, materialCostByCode])

  const locDelta = useMemo(() => {
    const prev = kpiTrendsAndDeltas.snapshots[4]?.totalLocations ?? 0
    const curr = kpiTrendsAndDeltas.snapshots[5]?.totalLocations ?? 0
    return getDeltaNote(curr, prev, 'vị trí')
  }, [kpiTrendsAndDeltas])

  const occupiedDelta = useMemo(() => {
    const prev = kpiTrendsAndDeltas.snapshots[4]?.occupiedLocations ?? 0
    const curr = kpiTrendsAndDeltas.snapshots[5]?.occupiedLocations ?? 0
    return getDeltaNote(curr, prev, 'vị trí')
  }, [kpiTrendsAndDeltas])

  const emptyDelta = useMemo(() => {
    const prev = kpiTrendsAndDeltas.snapshots[4]?.emptyLocations ?? 0
    const curr = kpiTrendsAndDeltas.snapshots[5]?.emptyLocations ?? 0
    return getDeltaNote(curr, prev, 'vị trí')
  }, [kpiTrendsAndDeltas])

  const capacityDelta = useMemo(() => {
    const prev = kpiTrendsAndDeltas.snapshots[4]?.occupancyPercent ?? 0
    const curr = kpiTrendsAndDeltas.snapshots[5]?.occupancyPercent ?? 0
    return getDeltaNote(curr, prev, '%')
  }, [kpiTrendsAndDeltas])

  const valDelta = useMemo(() => {
    const prev = kpiTrendsAndDeltas.snapshots[4]?.totalValue ?? 0
    const curr = kpiTrendsAndDeltas.snapshots[5]?.totalValue ?? 0
    return getDeltaNote(curr, prev, 'đ', true)
  }, [kpiTrendsAndDeltas])

  const qtyDelta = useMemo(() => {
    const prev = kpiTrendsAndDeltas.snapshots[4]?.totalStock ?? 0
    const curr = kpiTrendsAndDeltas.snapshots[5]?.totalStock ?? 0
    return getDeltaNote(curr, prev, 'tấn')
  }, [kpiTrendsAndDeltas])

  const warehouseOptions = useMemo(() => {
    const byId = new Map<string, { id: string; code: string; name: string }>()

    ;(warehouses as Array<{ id: string; code: string; name: string; active?: boolean }>).forEach((warehouse) => {
      if (!warehouse?.id) return
      byId.set(warehouse.id, {
        id: warehouse.id,
        code: warehouse.code,
        name: warehouse.code === 'MAIN'
          ? 'Kho chính'
          : warehouse.code === 'PRODUCTION'
            ? 'Kho sản xuất'
            : warehouse.name,
      })
    })

    ;(zones as WarehouseLocation[]).forEach((zone) => {
      const warehouse = zone.warehouse
      if (!warehouse?.id || byId.has(warehouse.id)) return
      byId.set(warehouse.id, {
        id: warehouse.id,
        code: warehouse.code,
        name: warehouse.code === 'MAIN'
          ? 'Kho chính'
          : warehouse.code === 'PRODUCTION'
            ? 'Kho sản xuất'
            : warehouse.name,
      })
    })

    return Array.from(byId.values()).sort((a, b) => {
      const order = (code: string) => code === 'MAIN' ? 0 : code === 'PRODUCTION' ? 1 : 2
      return order(a.code) - order(b.code) || a.name.localeCompare(b.name)
    })
  }, [warehouses, zones])

  const edit = (zone: WarehouseLocation) => setForm({
    id: zone.id,
    code: zone.code,
    name: zone.name,
    row: zone.row ?? '',
    column: zone.column ?? '',
    level: zone.level ?? '',
    capacity: String(zone.capacity ?? ''),
    description: zone.description ?? '',
    active: zone.active,
    warehouseId: zone.warehouseId ?? '',
  })

  const levelStats = useMemo(() => {
    const map = new Map<string, { count: number; stock: number }>();
    rows.forEach((zone) => {
      const level = zone.level || 'Khác';
      if (!map.has(level)) map.set(level, { count: 0, stock: 0 });
      const entry = map.get(level)!;
      entry.count += zone.materialCount || 0;
      entry.stock += zone.totalStockQuantity || 0;
    });
    return Array.from(map.entries())
      .map(([level, data]) => ({ level, ...data }))
      .sort((a, b) => b.stock - a.stock);
  }, [rows]);

  return <EnterpriseModulePage>
    <div className="w-full min-w-0 flex-1 space-y-1 -mt-2">
      <InventoryTabWorkspace />
      <div className="grid grid-cols-1 gap-1 md:grid-cols-5">
        <InventoryMetricCard
          title="Tổng vị trí"
          value={formatQuantity(rows.length, 0)}
          note={locDelta.text}
          noteClassName={locDelta.colorClass}
          tone="blue"
          icon={<MapPinned size={15} />}
          trend={kpiTrendsAndDeltas.totalLocationsTrend}
        />
        <InventoryMetricCard
          title="Đang sử dụng"
          value={formatQuantity(zoneStatusStats.using, 0)}
          note={occupiedDelta.text}
          noteClassName={occupiedDelta.colorClass}
          tone="emerald"
          icon={<Layers3 size={15} />}
          trend={kpiTrendsAndDeltas.occupiedLocationsTrend}
        />
        <InventoryMetricCard
          title="Vị trí trống"
          value={formatQuantity(zoneStatusStats.empty, 0)}
          note={emptyDelta.text}
          noteClassName={emptyDelta.colorClass}
          tone="cyan"
          icon={<Package size={15} />}
          trend={kpiTrendsAndDeltas.emptyLocationsTrend}
        />
        <InventoryMetricCard
          title="Hiệu suất sức chứa"
          value={`${stats.occupancyPercent.toFixed(1)}%`}
          note={capacityDelta.text}
          noteClassName={capacityDelta.colorClass}
          tone="purple"
          icon={<Warehouse size={15} />}
          trend={kpiTrendsAndDeltas.occupancyPercentTrend}
        />
        <InventoryMetricCard
          title="Tổng tồn theo vị trí"
          value={formatCurrency(stats.inventoryValue)}
          note={
            <span className="flex items-center gap-1.5 truncate">
              <span className={valDelta.colorClass}>{valDelta.text}</span>
              <span className="text-slate-500 font-normal">·</span>
              <span className={qtyDelta.colorClass}>{qtyDelta.text}</span>
            </span>
          }
          tone="amber"
          icon={<Warehouse size={15} />}
          trend={kpiTrendsAndDeltas.totalStockTrend}
        />
      </div>

      <InventoryPanel className="rounded-xl">
        <div className="grid grid-cols-1 gap-1 xl:grid-cols-[180px_180px_minmax(260px,1fr)_120px_120px_auto]">
          {/* Dropdown trạng thái */}
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as typeof status)
              setPage(1)
            }}
            className={`${inventoryInput} h-9 self-end`}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="inactive">Ngưng dùng</option>
          </select>

          {/* Dropdown chọn kho (thay cho phân loại) */}
          <select
            value={warehouseFilter}
            onChange={(e) => {
              setWarehouseFilter(e.target.value)
              setPage(1)
            }}
            className={`${inventoryInput} h-9 self-end`}
          >
            <option value="">Tất cả kho</option>
            {warehouseOptions.map((wh) => (
              <option key={wh.id} value={wh.id}>
                {wh.name}
              </option>
            ))}
          </select>

          {/* Ô tìm kiếm */}
          <input
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') applySearch()
            }}
            placeholder="Mã, tên, hàng, cột, tầng..."
            className={`${inventoryInput} h-9 self-end`}
          />

          {/* Nút Tìm kiếm */}
          <button
            onClick={applySearch}
            className="h-9 self-end rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500"
          >
            Tìm kiếm
          </button>

          {/* Nút Làm mới */}
          <button
            onClick={resetFilters}
            className="h-9 self-end rounded-lg border border-white/10 bg-white/[0.055] px-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
          >
            Làm mới
          </button>

          {/* Nút + Thêm vị trí */}
          <button
            onClick={() => setForm(emptyForm)}
            className="h-9 self-end rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500"
          >
            + Thêm vị trí
          </button>
        </div>
      </InventoryPanel>

            {/* Row 1 Grid */}
      <div className="grid grid-cols-12 gap-1">
        {/* Cột trái: Danh sách vị trí + 4 card dưới */}
        <div className="col-span-12 2xl:col-span-9 flex flex-col gap-1">
          {/* Bảng danh sách vị trí */}
          <LocationsChartCard title="Danh sách vị trí kho" heightClass="h-[350px]">
            <div className="flex flex-col h-full justify-between">
              {/* Phần bảng cuộn - được bọc viền */}
              <div className="overflow-auto scrollbar-none flex-1 rounded-lg border border-white/10">
                <table className="w-full text-[14px] text-left">
                  <thead className="bg-white/[0.06] sticky top-0 z-10">
                    <tr className="border-b border-white/10 text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
                        <th className="py-2 px-3 text-left">Kho</th>
                        <th className="py-2 px-3 text-left">Vị trí</th>
                        <th className="py-2 px-3 text-center">Slot</th>
                        <th className="py-2 px-3 text-center">Tầng</th>
                        <th className="py-2 px-3 text-right">Khối lượng</th>
                        <th className="py-2 px-3 text-right">Số vật tư</th>
                        <th className="py-2 px-3 text-center">Trạng thái</th>
                        <th className="py-2 px-3 text-center">Thao tác</th>
                      </tr>
                    </thead>
                  <tbody className="divide-y divide-white/5">
                    {pagedRows.map((zone) => {
                      const status = !zone.active
                        ? 'MAINTENANCE'
                        : n(zone.totalStockQuantity) > 0
                          ? 'USING'
                          : 'EMPTY';

                      return (
                        <tr key={zone.id} className={`cursor-pointer ${inventoryTableRow}`} onClick={() => setDetailId(zone.id)}>
                          <td className="py-2.5 px-1 text-slate-300 font-medium">
                            {zone.warehouse?.code === 'MAIN'
                              ? 'Kho chính'
                              : zone.warehouse?.code === 'PRODUCTION'
                                ? 'Kho sản xuất'
                                : (zone.warehouse?.code || '-')}
                          </td>
                          <td className="py-2.5 px-1 font-semibold text-cyan-300">{zone.code}</td>
                          <td className="py-2.5 px-1 text-center text-slate-200">{zone.column || '-'}</td>
                          <td className="py-2.5 px-1 text-center text-slate-200">{zone.level || '-'}</td>
                          <td className="py-2.5 px-1 text-right text-slate-200 font-mono">
                            {formatQuantity(n(zone.totalStockQuantity), 1)} tấn
                          </td>
                          <td className="py-2.5 px-1 text-right text-slate-200 font-mono">
                            {formatQuantity(n(zone.materialCount), 0)}
                          </td>
                          <td className="py-2.5 px-1 text-center">
                            {status === 'MAINTENANCE' && (
                              <span className="border border-amber-400/30 bg-amber-500/10 text-amber-300 rounded-full px-2 py-0.5 text-[10px] font-medium whitespace-nowrap">
                                Bảo trì
                              </span>
                            )}
                            {status === 'USING' && (
                              <span className="border border-cyan-400/30 bg-cyan-500/10 text-cyan-300 rounded-full px-2 py-0.5 text-[10px] font-medium whitespace-nowrap">
                                Đang dùng
                              </span>
                            )}
                            {status === 'EMPTY' && (
                              <span className="border border-emerald-400/30 bg-emerald-500/10 text-emerald-300 rounded-full px-2 py-0.5 text-[10px] font-medium whitespace-nowrap">
                                Trống
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-1" onClick={(event) => event.stopPropagation()}>
                            <div className="flex justify-center gap-1">
                              <button type="button" title="Chi tiết" onClick={() => setDetailId(zone.id)} className="rounded border border-slate-700 p-0.5 text-slate-300 hover:border-cyan-500 hover:text-cyan-200"><Eye size={12} /></button>
                              <button type="button" title="Sửa" onClick={() => edit(zone)} className="rounded border border-slate-700 p-0.5 text-slate-300 hover:border-cyan-500 hover:text-cyan-200"><Edit3 size={12} /></button>
                              <button type="button" title={zone.active ? 'Ngưng dùng' : 'Kích hoạt'} onClick={() => zone.active ? deactivateMutation.mutate(zone.id) : activateMutation.mutate(zone.id)} className="rounded border border-slate-700 p-0.5 text-slate-300 hover:border-cyan-500 hover:text-cyan-200">
                                {zone.active ? <PowerOff size={12} /> : <Power size={12} />}
                              </button>
                              <button type="button" title="Xóa" onClick={() => deleteMutation.mutate(zone.id)} className="rounded border border-slate-700 p-0.5 text-slate-300 hover:border-cyan-500 hover:text-cyan-200"><Trash2 size={12} /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="mt-0.5 shrink-0">
                <InventoryPagination
                  page={page}
                  pageCount={Math.ceil(rows.length / PAGE_SIZE)}
                  total={rows.length}
                  pageSize={PAGE_SIZE}
                  onPageChange={setPage}
                  containerClassName="grid grid-cols-1 items-center gap-1 px-4 py-0.5 text-xs text-slate-400 md:grid-cols-3"
                />
              </div>
            </div>
          </LocationsChartCard>

          {/* 4 card dưới: chia 2 cột, 2 hàng */}
            <div className="grid grid-cols-2 gap-1">
              {/* Hàng 1: Nhập gần nhất | Xuất gần nhất */}
              <LocationsChartCard
                title="Vật tư nhập gần nhất"
                heightClass="h-[185px]"
                action={
                  <button
                    type="button"
                    onClick={() => setModalType('recentInbound')}
                    className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 transition"
                  >
                    Xem tất cả
                  </button>
                }
              >
                {previewRecentInbound.length === 0 ? (
                  <div className="text-center text-xs text-slate-500 py-8">Chưa có giao dịch nhập</div>
                ) : (
                  <div className="space-y-0">
                    {previewRecentInbound.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-[100px_90px_1fr_70px_70px] items-center gap-2 border-b border-white/8 px-1.5 py-1 text-xs last:border-b-0 last:pb-0">
                        <div className="text-slate-400">{new Date(item.date).toLocaleDateString('vi-VN')}</div>
                        <div className="truncate font-medium text-cyan-300">{item.code}</div>
                        <div className="truncate text-slate-300" title={item.name}>{item.name}</div>
                        <div className="text-right text-white">{formatQuantity(item.quantity, 1)} tấn</div>
                        <div className="text-right text-emerald-300">Đã nhập</div>
                      </div>
                    ))}
                  </div>
                )}
              </LocationsChartCard>

              <LocationsChartCard
                title="Vật tư xuất gần nhất"
                heightClass="h-[185px]"
                action={
                  <button
                    type="button"
                    onClick={() => setModalType('recentOutbound')}
                    className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 transition"
                  >
                    Xem tất cả
                  </button>
                }
              >
                {previewRecentOutbound.length === 0 ? (
                  <div className="text-center text-xs text-slate-500 py-8">Chưa có giao dịch xuất</div>
                ) : (
                  <div className="space-y-0">
                    {previewRecentOutbound.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-[100px_90px_1fr_70px_70px] items-center gap-2 border-b border-white/8 px-1.5 py-1 text-xs last:border-b-0 last:pb-0">
                        <div className="text-slate-400">{new Date(item.date).toLocaleDateString('vi-VN')}</div>
                        <div className="truncate font-medium text-blue-300">{item.code}</div>
                        <div className="truncate text-slate-300" title={item.name}>{item.name}</div>
                        <div className="text-right text-white">{formatQuantity(item.quantity, 1)} tấn</div>
                        <div className="text-right text-red-400">Đã xuất</div>
                      </div>
                    ))}
                  </div>
                )}
              </LocationsChartCard>

            {/* Hàng 2: Tồn nhiều nhất | Phân bố sức chứa */}
            <LocationsChartCard
              title="Vật tư tồn nhiều nhất"
              heightClass="h-[195px]"
              action={
                <button
                  type="button"
                  onClick={() => setModalType('topMaterials')}
                  className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 transition"
                >
                  Xem tất cả
                </button>
              }
            >
              <div className="space-y-1 pt-1">
                {previewTopMaterials.map((item) => (
                  <div key={item.code}>
                    <div className="flex items-center justify-between text-xs mb-0.5">
                      <span className="font-semibold text-cyan-300">{item.code} <span className="text-slate-400 font-normal ml-1 truncate max-w-[120px] inline-block align-bottom">{item.name}</span></span>
                      <div className="flex items-center gap-1.5 font-mono">
                        <span className="text-slate-200">{formatQuantity(item.stock, 0)} tấn</span>
                        <span className="text-slate-500">·</span>
                        <span className="text-emerald-300">{formatShortCurrency(item.value)}</span>
                      </div>
                    </div>
                    <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                        style={{ width: `${item.percent}%` }}
                      />
                    </div>
                  </div>
                ))}
                {previewTopMaterials.length === 0 && (
                  <div className="text-center text-xs text-slate-500 py-8">Chưa có dữ liệu vật tư tồn kho</div>
                )}
              </div>
            </LocationsChartCard>

            <LocationsChartCard
              title="Phân bố sức chứa theo kho"
              heightClass="h-[195px]"
              action={
                <button
                  type="button"
                  onClick={() => setModalType('zoneCapacity')}
                  className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 transition"
                >
                  Xem tất cả
                </button>
              }
            >
              <div className="space-y-1 pt-1">
                {previewZoneCapacity.map((zone) => {
                  const percent = zone.capacity > 0 ? (zone.stock / zone.capacity) * 100 : 0
                  return (
                    <div key={zone.id}>
                      <div className="flex items-center justify-between text-xs mb-0.5">
                        <span className="font-medium text-cyan-300 truncate max-w-[160px]" title={zone.name}>{zone.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 font-mono">{formatQuantity(zone.stock, 1)} / {formatQuantity(zone.capacity, 0)} tấn</span>
                          <span className="text-emerald-400 font-semibold font-mono">({percent.toFixed(0)}%)</span>
                          <span className="text-slate-500 font-mono">{zone.occupiedSlots} ô</span>
                        </div>
                      </div>
                      <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400"
                          style={{ width: `${Math.min(100, percent)}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
                {previewZoneCapacity.length === 0 && (
                  <div className="text-center text-xs text-slate-500 py-8">Chưa có dữ liệu phân bố sức chứa</div>
                )}
              </div>
            </LocationsChartCard>
          </div>
        </div>

        {/* Cột phải: 3 cards nhỏ */}
        <div className="col-span-12 2xl:col-span-3 flex flex-col gap-1">
          <LocationsChartCard title="Hiệu suất sức chứa" heightClass="h-[170px]">
            <CompactDonutSummary
              segments={[
                { label: 'Đang dùng', value: occupiedSlots, color: '#06b6d4' },
                { label: 'Trống', value: freeSlots, color: '#10b981' },
                { label: 'Bảo trì', value: maintenanceSlots, color: '#f59e0b' },
              ]}
              centerValue={`${occupancyPercent.toFixed(0)}%`}
              centerLabel="Đã sử dụng"
            />
          </LocationsChartCard>

          <LocationsChartCard title="Trạng thái vị trí" heightClass="h-[170px]">
            <VerticalBarChart
              data={[
                { label: 'Đang dùng', value: zoneStatusStats.using, color: '#06b6d4' },
                { label: 'Trống', value: zoneStatusStats.empty, color: '#10b981' },
                { label: 'Bảo trì', value: zoneStatusStats.maintenance, color: '#f59e0b' },
              ]}
            />
          </LocationsChartCard>

          <LocationsChartCard title="Phân bố loại vật tư" heightClass="h-[170px]">
            <CompactDonutSummary
              segments={[
                { label: 'Vật tư chính', value: materialTypeDistribution.primary, color: '#3b82f6' },
                { label: 'Vật tư phụ', value: materialTypeDistribution.secondary, color: '#a855f7' },
                { label: 'Vật tư tiêu hao', value: materialTypeDistribution.consumable, color: '#f97316' },
              ]}
              centerValue={formatQuantity(materialTypeDistribution.total, 1)}
              centerLabel="tấn"
            />
          </LocationsChartCard>

          {/* ===== CARD THỨ 4: TỔNG HỢP THEO KHO ===== */}
          <LocationsChartCard title="Tổng hợp theo kho" heightClass="h-[170px]">
            {(() => {
              const warehouseSummary = rows.reduce((acc, zone) => {
                const warehouseCode = zone.warehouse?.code || 'KHÁC'
                const warehouseName = warehouseCode === 'MAIN' ? 'Kho chính' : warehouseCode === 'PRODUCTION' ? 'Kho sản xuất' : warehouseCode
                if (!acc[warehouseName]) {
                  acc[warehouseName] = { count: 0, stock: 0 }
                }
                acc[warehouseName].count += 1
                acc[warehouseName].stock += n(zone.totalStockQuantity)
                return acc
              }, {} as Record<string, { count: number; stock: number }>)

              const entries = Object.entries(warehouseSummary)
              const maxStock = Math.max(1, ...entries.map(([, data]) => data.stock))

              return (
                <div className="space-y-1.5 pt-1">
                  {entries.map(([name, data]) => {
                    const percent = (data.stock / maxStock) * 100
                    return (
                      <div key={name}>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-300 truncate max-w-[100px]" title={name}>{name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400 font-mono">{data.count} vị trí</span>
                            <span className="text-cyan-300 font-mono font-semibold">{formatQuantity(data.stock, 1)} tấn</span>
                          </div>
                        </div>
                        <div className="mt-0.5 h-1 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400"
                            style={{ width: `${Math.max(4, percent)}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                  {entries.length === 0 && (
                    <div className="text-center text-xs text-slate-500 py-4">Chưa có dữ liệu kho</div>
                  )}
                </div>
              )
            })()}
          </LocationsChartCard>
        </div>
      </div>
    {form ? <LocationFormModal form={form} warehouses={warehouseOptions} setForm={setForm} onClose={() => setForm(null)} onSubmit={() => saveMutation.mutate(form)} saving={saveMutation.isPending} /> : null}
    {detailId ? <LocationDetailDrawer detail={detail ?? null} onClose={() => setDetailId('')} /> : null}
    {selectedSlot ? <SlotMaterialDrawer slot={selectedSlot} onClose={() => setSelectedSlot(null)} /> : null}
    {modalType && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-md">
        <div className="max-h-[80vh] w-full max-w-4xl overflow-auto rounded-2xl border border-white/10 bg-[#08111f]/95 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.35)] flex flex-col justify-between scrollbar-thin">
          <div className="flex items-center justify-between pb-3 mb-4 shrink-0">
            <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-300">
              {modalType === 'recentInbound' && 'Toàn bộ nhập kho gần đây'}
              {modalType === 'recentOutbound' && 'Toàn bộ xuất kho gần đây'}
              {modalType === 'value' && 'Giá trị tồn theo vị trí'}
              {modalType === 'maxStock' && 'Vị trí tồn kho cao nhất'}
              {modalType === 'topMaterials' && 'Vật tư tồn nhiều nhất'}
              {modalType === 'zoneCapacity' && 'Phân bố sức chứa theo kho'}
            </h3>
            <button
              onClick={() => setModalType(null)}
              className="rounded border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300 hover:text-white transition"
            >
              Đóng
            </button>
          </div>
          <div className="flex-1 overflow-auto">
            {/* Giá trị tồn theo vị trí */}
            {modalType === 'value' && (
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400 font-semibold bg-white/[0.02]">
                    <th className="py-2 px-3">Kho</th>
                    <th className="py-2 px-3 text-right">Giá trị</th>
                    <th className="py-2 px-3 text-right">%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {valueByLocation.map((item) => {
                    const pct = inventoryValue > 0 ? (item.value / inventoryValue) * 100 : 0
                    return (
                      <tr key={item.code} className="hover:bg-white/5">
                        <td className="py-2 px-3 font-medium text-cyan-300">{item.code}</td>
                        <td className="py-2 px-3 text-right text-slate-200">{formatShortCurrency(item.value)}</td>
                        <td className="py-2 px-3 text-right text-emerald-400 font-mono">{pct.toFixed(1)}%</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}

            {modalType === 'maxStock' && (
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400 font-semibold bg-white/[0.02]">
                    <th className="py-2 px-3">Vị trí</th>
                    <th className="py-2 px-3 text-right">Khối lượng</th>
                    <th className="py-2 px-3 text-right">%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {stockByLocation.map(([code, stock]) => {
                    const pct = stats.stock > 0 ? (stock / stats.stock) * 100 : 0
                    return (
                      <tr key={code} className="hover:bg-white/5">
                        <td className="py-2 px-3 font-medium text-cyan-300">{code}</td>
                        <td className="py-2 px-3 text-right text-slate-200">{formatQuantity(stock, 1)} tấn</td>
                        <td className="py-2 px-3 text-right text-emerald-400 font-mono">{pct.toFixed(1)}%</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}

            {/* Nhập/Xuất gần nhất */}
            {(modalType === 'recentInbound' || modalType === 'recentOutbound') && (
              <>
                {modalData.length === 0 ? (
                  <div className="text-center text-xs text-slate-500 py-8">Chưa có giao dịch</div>
                ) : (
                  <div className="border border-white/10 rounded-lg overflow-hidden">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-white/10 text-slate-400 font-semibold bg-white/[0.02]">
                          <th className="py-2 px-3">Thời gian</th>
                          <th className="py-2 px-3">Mã</th>
                          <th className="py-2 px-3">Tên</th>
                          <th className="py-2 px-3">Slot</th>
                          <th className="py-2 px-3">Tầng</th>
                          <th className="py-2 px-3 text-right">Số lượng</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {pagedModalData.map((item, idx) => (
                          <tr key={idx} className="hover:bg-white/5">
                            <td className="py-2 px-3 text-slate-400">{formatDateTime(item.date)}</td>
                            <td className="py-2 px-3 font-medium text-cyan-300">{item.code}</td>
                            <td className="py-2 px-3 text-slate-200 max-w-[240px] truncate" title={item.name}>{item.name}</td>
                            <td className="py-2 px-3 text-slate-300">{item.slot}</td>
                            <td className="py-2 px-3 text-slate-300">{item.level}</td>
                            <td className="py-2 px-3 text-right text-slate-200 font-mono">{formatQuantity(item.quantity, 1)} tấn</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {totalModalPages > 1 && (
                      <div className="flex items-center justify-between gap-3 px-4 py-2 text-xs text-slate-400 border-t border-white/10">
                        <span>
                          Hiển thị {(modalData.length > 0) ? ((modalPage - 1) * modalPageSize + 1) : 0}-
                          {Math.min(modalPage * modalPageSize, modalData.length)}/{modalData.length} kết quả
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setModalPage((p) => Math.max(1, p - 1))}
                            disabled={modalPage <= 1 || modalData.length === 0}
                            className={inventoryMutedButton}
                          >
                            Trước
                          </button>
                          <span className="px-2 py-1 text-slate-300">{modalPage}/{totalModalPages}</span>
                          <button
                            onClick={() => setModalPage((p) => Math.min(totalModalPages, p + 1))}
                            disabled={modalPage >= totalModalPages || modalData.length === 0}
                            className={inventoryMutedButton}
                          >
                            Sau
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
            {modalType === 'topMaterials' && (
              <div className="overflow-hidden rounded-xl border border-white/10 bg-[#08111f]/90">
                {pagedModalData.length === 0 ? (
                  <div className="text-center text-xs text-slate-500 py-8">Chưa có dữ liệu vật tư tồn kho</div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="border-b border-white/10 text-slate-400 font-semibold bg-white/[0.02]">
                            <th className="py-2 px-3">Mã</th>
                            <th className="py-2 px-3">Tên</th>
                            <th className="py-2 px-3 text-right">Khối lượng (tấn)</th>
                            <th className="py-2 px-3 text-right">Giá trị</th>
                            <th className="py-2 px-3">Vị trí</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {pagedModalData.map((item) => (
                            <tr key={item.code} className="hover:bg-white/5">
                              <td className="py-2 px-3 font-medium text-cyan-300">{item.code}</td>
                              <td className="py-2 px-3 text-slate-200">{item.name}</td>
                              <td className="py-2 px-3 text-right font-mono text-slate-200">{formatQuantity(item.stock, 1)}</td>
                              <td className="py-2 px-3 text-right font-mono text-emerald-300">{formatShortCurrency(item.value)}</td>
                              <td className="py-2 px-3 text-slate-400">{item.locationStr}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {totalModalPages > 1 && (
                      <div className="flex items-center justify-between gap-3 px-4 py-2 text-xs text-slate-400 border-t border-white/10">
                        <span>
                          Hiển thị {(modalData.length > 0) ? ((modalPage - 1) * modalPageSize + 1) : 0}-
                          {Math.min(modalPage * modalPageSize, modalData.length)}/{modalData.length} kết quả
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setModalPage((p) => Math.max(1, p - 1))}
                            disabled={modalPage <= 1 || modalData.length === 0}
                            className={inventoryMutedButton}
                          >
                            Trước
                          </button>
                          <span className="px-2 py-1 text-slate-300">{modalPage}/{totalModalPages}</span>
                          <button
                            onClick={() => setModalPage((p) => Math.min(totalModalPages, p + 1))}
                            disabled={modalPage >= totalModalPages || modalData.length === 0}
                            className={inventoryMutedButton}
                          >
                            Sau
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

          {modalType === 'zoneCapacity' && (
            <div className="overflow-hidden rounded-xl border border-white/10 bg-[#08111f]/90">
              {pagedModalData.length === 0 ? (
                <div className="text-center text-xs text-slate-500 py-8">Chưa có dữ liệu phân bố sức chứa</div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-white/10 text-slate-400 font-semibold bg-white/[0.02]">
                          <th className="py-2 px-3">Kho</th>
                          <th className="py-2 px-3 text-right">Tồn (tấn)</th>
                          <th className="py-2 px-3 text-right">Sức chứa (tấn)</th>
                          <th className="py-2 px-3 text-right">Tỷ lệ</th>
                          <th className="py-2 px-3 text-right">Ô đang dùng</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {pagedModalData.map((zone) => {
                          const percent = zone.capacity > 0 ? (zone.stock / zone.capacity) * 100 : 0
                          return (
                            <tr key={zone.id} className="hover:bg-white/5">
                              <td className="py-2 px-3 font-medium text-cyan-300">{zone.name}</td>
                              <td className="py-2 px-3 text-right font-mono text-slate-200">{formatQuantity(zone.stock, 1)}</td>
                              <td className="py-2 px-3 text-right font-mono text-slate-200">{formatQuantity(zone.capacity, 1)}</td>
                              <td className="py-2 px-3 text-right font-mono text-emerald-300">{percent.toFixed(0)}%</td>
                              <td className="py-2 px-3 text-right text-slate-400">{zone.occupiedSlots}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                  {totalModalPages > 1 && (
                    <div className="flex items-center justify-between gap-3 px-4 py-2 text-xs text-slate-400 border-t border-white/10">
                      <span>
                        Hiển thị {(modalData.length > 0) ? ((modalPage - 1) * modalPageSize + 1) : 0}-
                        {Math.min(modalPage * modalPageSize, modalData.length)}/{modalData.length} kết quả
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setModalPage((p) => Math.max(1, p - 1))}
                          disabled={modalPage <= 1 || modalData.length === 0}
                          className={inventoryMutedButton}
                        >
                          Trước
                        </button>
                        <span className="px-2 py-1 text-slate-300">{modalPage}/{totalModalPages}</span>
                        <button
                          onClick={() => setModalPage((p) => Math.min(totalModalPages, p + 1))}
                          disabled={modalPage >= totalModalPages || modalData.length === 0}
                          className={inventoryMutedButton}
                        >
                          Sau
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
          </div>
        </div>
      </div>
    )}
    </div>
  </EnterpriseModulePage>
}

function SlotMaterialDrawer({ slot, onClose }: { slot: SlotMaterialView; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
      <aside className="h-full w-full max-w-3xl overflow-auto border-l border-slate-700 bg-[#071321] text-slate-100 shadow-2xl">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800 bg-[#071321]/95 px-6 py-5 backdrop-blur">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">Vật tư trong ô chứa</p>
            <h2 className="mt-1 text-2xl font-bold">{slot.label}</h2>
            <p className="mt-1 text-sm text-slate-400">{formatQuantity(slot.quantity, 3)} tổng lượng · {formatCurrency(slot.value)}</p>
          </div>
          <button onClick={onClose} className="rounded-lg border border-slate-700 p-2.5 text-slate-300 hover:border-cyan-500 hover:text-cyan-200"><X size={18} /></button>
        </header>

        <div className="space-y-4 p-6">
          <div className="grid gap-3 md:grid-cols-3">
            <InfoBox label="Khu vực" value={slot.zoneCode} />
            <InfoBox label="Ô chứa" value={slot.slotId} />
            <InfoBox label="Tầng" value={slot.level} />
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-800">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="bg-slate-900/80 text-[11px] uppercase tracking-[0.12em] text-slate-400">
                <tr>
                  <th className="px-4 py-3">Mã vật tư</th>
                  <th className="px-4 py-3">Tên vật tư</th>
                  <th className="px-4 py-3 text-right">Số lượng</th>
                  <th className="px-4 py-3">Đơn vị</th>
                  <th className="px-4 py-3 text-right">Giá trị</th>
                </tr>
              </thead>
              <tbody>
                {slot.materials.map((material) => (
                  <tr key={material.id} className="border-t border-slate-800/80 hover:bg-slate-900/45">
                    <td className="px-4 py-3 font-semibold text-cyan-300">{material.code}</td>
                    <td className="px-4 py-3">{material.name}</td>
                    <td className="px-4 py-3 text-right font-semibold">{formatQuantity(material.quantity, 3)}</td>
                    <td className="px-4 py-3">{material.unit ?? '-'}</td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-300">{formatCurrency(material.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!slot.materials.length ? <p className="border-t border-slate-800 px-4 py-6 text-center text-sm text-slate-500">Ô này chưa có danh sách vật tư chi tiết từ API.</p> : null}
          </div>
        </div>
      </aside>
    </div>
  )
}

function IconButton({ title, onClick, children }: { title: string; onClick: (event: React.MouseEvent<HTMLButtonElement>) => void; children: ReactNode }) {
  return <button type="button" title={title} onClick={onClick} className="rounded border border-slate-700 p-1.5 text-slate-300 hover:border-cyan-500 hover:text-cyan-200">{children}</button>
}

function AuditChip({ value }: { value: string }) {
  const labels: Record<string, string> = {
    'Real storage location': 'Vị trí lưu kho thật',
    'Demo record': 'Bản ghi demo',
    'Warehouse-like record': 'Cấu trúc kho',
    'Needs review': 'Cần kiểm tra',
  }
  const displayValue = labels[value] || value
  const tone = value === 'Real storage location' ? 'bg-emerald-950 text-emerald-300' : value === 'Demo record' ? 'bg-red-950 text-red-300' : value === 'Warehouse-like record' ? 'bg-amber-950 text-amber-300' : 'bg-slate-800 text-slate-300'
  return <span className={`rounded px-2 py-1 text-[10px] ${tone}`}>{displayValue}</span>
}

function AuditRow({ icon, label, value, note }: { icon: ReactNode; label: string; value: number; note: string }) {
  return <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-slate-300">{icon}{label}</span>
      <b className="text-cyan-300">{formatQuantity(value, 0)}</b>
    </div>
    <p className="mt-1 text-xs text-slate-500">{note}</p>
  </div>
}

function LocationFormModal({ form, warehouses, setForm, onClose, onSubmit, saving }: { form: LocationForm; warehouses: Array<{ id: string; code: string; name: string }>; setForm: (value: LocationForm) => void; onClose: () => void; onSubmit: () => void; saving: boolean }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
    <div className="w-full max-w-3xl overflow-hidden rounded-xl border border-slate-700 bg-[#071321] text-slate-100 shadow-2xl">
      <header className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
        <div><h2 className="text-lg font-semibold">{form.id ? 'Sửa vị trí kho' : 'Thêm vị trí kho'}</h2><p className="mt-1 text-xs text-slate-500">Sức chứa là tải trọng/tồn chứa vận hành; sơ đồ ô/tầng dùng cấu trúc A01-F06 và L1-L4.</p></div>
        <button onClick={onClose} className="rounded border border-slate-700 p-2 text-slate-300"><X size={16} /></button>
      </header>
      <div className="grid gap-3 p-5 md:grid-cols-2">
        <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className={inventoryInput} placeholder="Mã vị trí, ví dụ A01" />
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inventoryInput} placeholder="Tên vị trí" />
        <select value={form.warehouseId} onChange={(e) => setForm({ ...form, warehouseId: e.target.value })} className={inventoryInput}>
          <option value="">Chọn kho cha: Kho chính / Kho sản xuất</option>
          {warehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.name} ({warehouse.code})</option>)}
        </select>
        {!warehouses.length ? <div className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-sm text-amber-100">
          Chưa tải được danh sách kho cha. Cần có dữ liệu MAIN/PRODUCTION trong master warehouses.
        </div> : null}
        <input value={form.row} onChange={(e) => setForm({ ...form, row: e.target.value })} className={inventoryInput} placeholder="Hàng (Row), ví dụ A" />
        <input value={form.column} onChange={(e) => setForm({ ...form, column: e.target.value })} className={inventoryInput} placeholder="Cột (Slot), ví dụ 01" />
        <input value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} className={inventoryInput} placeholder="Tầng (Level), ví dụ L1" />
        <input value={form.capacity} onFocus={(e) => setForm({ ...form, capacity: formatQuantityInput(e.target.value) })} onBlur={(e) => setForm({ ...form, capacity: formatQuantity(e.target.value) })} onChange={(e) => setForm({ ...form, capacity: formatQuantityInput(e.target.value) })} className={inventoryInput} inputMode="decimal" placeholder="Sức chứa vận hành, ví dụ 100 tấn" />
        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={`${inventoryInput} h-24 py-2 md:col-span-2`} placeholder="Ghi chú vị trí" />
        <label className="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Đang hoạt động</label>
      </div>
      <footer className="flex justify-end gap-2 border-t border-slate-800 px-5 py-4">
        <button onClick={onClose} className="rounded border border-slate-700 px-4 py-2 text-sm text-slate-300">Hủy</button>
        <button disabled={saving || !form.code.trim() || !form.name.trim() || !form.warehouseId} onClick={onSubmit} className="rounded bg-blue-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Đang lưu...' : 'Lưu vị trí'}</button>
      </footer>
    </div>
  </div>
}

function LocationDetailDrawer({ detail, onClose }: { detail: WarehouseLocationDetail | null; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<'overview' | 'materials' | 'levels' | 'map'>('overview')
  const materials = detail
  ? buildMaterialsFromOccupancy(detail)
  : []
  const capacity = n(detail?.capacity)
  const usedQuantity = n(detail?.totalStockQuantity)
  const occupiedSlots = getOccupiedCellLevels(materials, detail).length
  const occupancy = capacity > 0 ? Math.min(100, Math.round((usedQuantity / capacity) * 100)) : 0
  const levelGroups = groupMaterialsByLevel(detail)
  const tabClass = (tab: typeof activeTab) => `rounded-lg px-3 py-2 text-sm font-semibold transition ${
    activeTab === tab
      ? 'border border-cyan-400/60 bg-cyan-400/12 text-cyan-200'
      : 'border border-slate-800 bg-slate-950/45 text-slate-400 hover:border-slate-700 hover:text-slate-200'
  }`

  return <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
    <aside className="h-full w-full max-w-6xl overflow-auto border-l border-slate-700 bg-[#071321] text-slate-100 shadow-2xl">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800 bg-[#071321]/95 px-6 py-5 backdrop-blur">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">Chi tiết vị trí kho</p>
          <h2 className="mt-1 text-2xl font-bold">{detail ? `${detail.code} · ${detail.name}` : 'Đang tải...'}</h2>
          <p className="mt-1 text-sm text-slate-400">Chế độ xem (Phase 1) · chưa hỗ trợ kéo thả hoặc thay đổi tồn kho trực tiếp.</p>
        </div>
        <button onClick={onClose} className="rounded-lg border border-slate-700 p-2.5 text-slate-300 hover:border-cyan-500 hover:text-cyan-200"><X size={18} /></button>
      </div>

      {detail ? <div className="space-y-5 p-6">
        <div className="flex flex-wrap gap-2">
          <button className={tabClass('overview')} onClick={() => setActiveTab('overview')}>Tổng quan</button>
          <button className={tabClass('materials')} onClick={() => setActiveTab('materials')}>Vật tư</button>
          <button className={tabClass('levels')} onClick={() => setActiveTab('levels')}>Phân tầng ô</button>
          <button className={tabClass('map')} onClick={() => setActiveTab('map')}>Sơ đồ 2D</button>
        </div>

        {activeTab === 'overview' ? <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
          <SectionCard title="Thông tin vị trí">
            <div className="grid grid-cols-2 gap-3 text-sm lg:grid-cols-3">
              <InfoBox label="Mã vị trí" value={detail.code} />
              <InfoBox label="Tên vị trí" value={detail.name} />
              <InfoBox label="Kho cha" value={detail.warehouse?.name ?? '-'} />
              <InfoBox label="Trạng thái" value={detail.active ? 'Hoạt động' : 'Ngưng dùng'} />
              <InfoBox label="Hàng" value={detail.row ?? '-'} />
              <InfoBox label="Cột" value={detail.column ?? '-'} />
              <InfoBox label="Tầng" value={detail.level ?? '-'} />
            </div>
            {detail.description ? <p className="mt-3 rounded-lg border border-slate-800 bg-slate-950/50 p-3 text-sm text-slate-400">{detail.description}</p> : null}
          </SectionCard>

          <SectionCard title="Thông tin sức chứa">
            <div className="grid grid-cols-2 gap-3 text-sm lg:grid-cols-4">
              <InfoBox label="Sức chứa vận hành" value={`${formatQuantity(capacity, 0)} tấn`} />
              <InfoBox label="Đang sử dụng" value={`${formatQuantity(usedQuantity, 0)} tấn`} />
              <InfoBox label="Ô/tầng đã dùng" value={`${formatQuantity(occupiedSlots, 0)} / ${TOTAL_CELL_LEVELS}`} />
              <InfoBox label="Tỷ lệ dùng" value={`${occupancy}%`} />
            </div>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-900">
              <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400" style={{ width: `${occupancy}%` }} />
            </div>
            <p className="mt-3 rounded-lg border border-slate-800 bg-slate-950/50 p-3 text-xs text-slate-400">
              Sơ đồ vị trí dùng cấu trúc cố định 6 hàng x 6 cột = 36 ô, mỗi ô có 4 tầng L1-L4 = {TOTAL_CELL_LEVELS} ô-tầng. Sức chứa không phải số ô, mà là tải trọng/tồn chứa vận hành của vị trí.
            </p>
          </SectionCard>
        </div> : null}

        {activeTab === 'materials' ? <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
          <SectionCard title="Danh sách vật tư">
            <div className="overflow-hidden rounded-xl border border-slate-800">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="bg-slate-900/80 text-[11px] uppercase tracking-[0.12em] text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Mã vật tư</th>
                    <th className="px-4 py-3">Tên vật tư</th>
                    <th className="px-4 py-3">Cột</th>
                    <th className="px-4 py-3">Tầng</th>
                    <th className="px-4 py-3 text-right">Số lượng</th>
                    <th className="px-4 py-3">Đơn vị</th>
                  </tr>
                </thead>
                <tbody>
                  {materials.map((item) => (
                    <tr
                      key={item.id}
                      className="border-t border-slate-800/80 hover:bg-slate-900/45"
                    >
                      <td className="px-4 py-3 font-semibold text-cyan-300">
                        {item.code}
                      </td>

                      <td className="px-4 py-3">
                        {item.name}
                      </td>

                      <td className="px-4 py-3">
                        {item.slotId}
                      </td>

                      <td className="px-4 py-3">
                        {item.level}
                      </td>

                      <td className="px-4 py-3 text-right font-semibold">
                        {formatQuantity(n(item.quantity), 0)}
                      </td>

                      <td className="px-4 py-3">
                        {item.unit ?? '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!materials.length ? <p className="border-t border-slate-800 px-4 py-6 text-center text-sm text-slate-500">Chưa có vật tư gán vào vị trí này.</p> : null}
            </div>
          </SectionCard>

          <SectionCard title="Nhóm vật tư theo tầng">
            <div className="space-y-1.5 self-start">
              {levelGroups.map((group) => <div key={group.level} className="rounded-xl border border-slate-800 bg-slate-950/45 p-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-semibold text-slate-100"><Layers3 size={15} className="text-cyan-300" />Tầng {group.level}</span>
                  <span className="text-xs text-slate-400">{group.items.length} vật tư</span>
                </div>
                <div className="mt-3 space-y-2">
                  {group.items.map((item) => <div key={item.id} className="flex items-center justify-between gap-3 text-xs">
                    <span className="truncate text-slate-300">{item.code} · {item.name}</span>
                    <span className="shrink-0 text-cyan-300">{formatQuantity(n(item.quantity), 0)}</span>
                  </div>)}
                </div>
              </div>)}
              {!levelGroups.length ? <p className="text-sm text-slate-500">Chưa có dữ liệu phân tầng để nhóm vật tư.</p> : null}
            </div>
          </SectionCard>
        </div> : null}

        {activeTab === 'levels' ? <SectionCard title="Chi tiết phân tầng của ô">
          <LayeredSlotDetail detail={detail} />
        </SectionCard> : null}

        {activeTab === 'map' ? <SectionCard title="Sơ đồ 2D ô chứa">
          <Location2DPreview detail={detail} />
        </SectionCard> : null}
      </div> : <p className="p-6 text-sm text-slate-500">Đang tải chi tiết...</p>}
    </aside>
  </div>
}

function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return <section className="rounded-2xl border border-slate-800 bg-slate-950/35 p-4 shadow-[0_18px_60px_rgba(0,0,0,0.18)]">
    <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-cyan-300">{title}</h3>
    {children}
  </section>
}

function Location2DPreview({ detail }: { detail: WarehouseLocationDetail }) {
  const occupancyItems = buildMaterialsFromOccupancy(detail)

  const defaultCell =
    normalizeSlotCell(
      occupancyItems.find((item) => item.slotId)?.slotId,
    ) ?? `${detail.row ?? 'A'}${detail.column ?? '01'}`
  const [selectedCell, setSelectedCell] = useState({
    row: defaultCell.slice(0, 1),
    column: defaultCell.slice(1) || '01',
  })
  const rowLabels = buildRowLabels(detail.row)
  const columnLabels = buildColumnLabels(detail.column)
  const clickedKey = `${selectedCell.row}-${selectedCell.column}`
  const selectedCellCode = `${selectedCell.row}${selectedCell.column}`
  const materialsByCell = useMemo(() => {
  const map = new Map<string, any[]>()

  for (const item of occupancyItems) {
    const key =
      normalizeSlotCell(item.slotId) ||
      `${detail.row ?? ''}${detail.column ?? ''}` ||
      'A01'

    const list = map.get(key) ?? []

    list.push(item)

    map.set(key, list)
  }

  return map
}, [detail, occupancyItems])
  const selectedCellMaterials = materialsByCell.get(selectedCellCode) ?? []
  const selectedLevels = Array.from(new Set(selectedCellMaterials.map((item) => item.level || 'L1'))).sort()

  return <div className="space-y-4">
    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
      <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded bg-cyan-400" />Vị trí đang xem</span>
      <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded bg-emerald-500" />Có vật tư</span>
      <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded border border-slate-700 bg-slate-900" />Ô trống</span>
      <span className="ml-auto text-slate-500">Mô phỏng sử dụng hàng/cột/tầng hiện có, chưa hỗ trợ kéo thả.</span>
    </div>
    <div className="grid gap-4 xl:grid-cols-[0.82fr_0.38fr]">
      <div className="overflow-auto rounded-xl border border-slate-800 bg-slate-950/60 p-3">
      <div className="grid min-w-[500px] gap-1.5" style={{ gridTemplateColumns: `44px repeat(${columnLabels.length}, minmax(56px, 1fr))` }}>
        <div />
        {columnLabels.map((column) => <div key={column} className="rounded-lg border border-slate-800 bg-slate-900/60 px-2 py-1.5 text-center text-[11px] font-semibold text-slate-400">{column}</div>)}
        {rowLabels.map((row) => [
          <div key={`${row}-label`} className="rounded-lg border border-slate-800 bg-slate-900/60 px-2 py-3 text-center text-[11px] font-semibold text-slate-400">{row}</div>,
          ...columnLabels.map((column) => {
            const isClicked = clickedKey === `${row}-${column}`
            const cellCode = `${row}${column}`
            const cellMaterials = materialsByCell.get(cellCode) ?? []
            const isOccupied = cellMaterials.length > 0
            return <button type="button" onClick={() => setSelectedCell({ row, column })} key={`${row}-${column}`} className={`min-h-[54px] rounded-lg border p-1.5 text-left transition ${isClicked ? 'ring-2 ring-cyan-300/70 border-cyan-300 bg-cyan-400/16 shadow-[0_0_22px_rgba(34,211,238,0.20)]' : isOccupied ? 'border-emerald-500/70 bg-emerald-500/14' : 'border-slate-800 bg-slate-900/45 hover:border-slate-600'}`}>
              <div className="flex h-full flex-col justify-between">
                <span className={`text-xs font-semibold ${isClicked ? 'text-cyan-200' : 'text-slate-500'}`}>{row}{column}</span>
                <span className={`text-[10px] uppercase tracking-[0.12em] ${isOccupied ? 'text-emerald-300' : isClicked ? 'text-cyan-300' : 'text-slate-600'}`}>{isOccupied ? `${cellMaterials.length} mã` : isClicked ? 'Đang chọn' : 'Trống'}</span>
              </div>
            </button>
          }),
        ])}
      </div>
      </div>
      <div className="rounded-xl border border-slate-800 bg-slate-950/55 p-4">
        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-300">Chi tiết ô</div>
        <div className="mt-2 text-lg font-bold text-white">{selectedCellCode}</div>
        <div className="mt-1 text-sm text-slate-400">Tầng có vật tư: {selectedLevels.length ? selectedLevels.join(', ') : '-'}</div>
        <div className="mt-4 space-y-2">
          {selectedCellMaterials.length ? selectedCellMaterials.map((item) => <div key={item.id} className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-xs">
            <div className="font-semibold text-cyan-300">{item.code}</div>
            <div className="mt-1 text-slate-200">{item.name}</div>
            <div className="mt-1 text-slate-500">Tầng {item.level ?? 'L1'} · {formatQuantity(n(item.quantity), 0)} {item.unitMaster?.symbol ?? item.unit ?? ''}</div>
          </div>) : <p className="text-sm text-slate-500">Ô này đang trống hoặc chưa có vật tư gán.</p>}
        </div>
      </div>
    </div>
    <div className="grid gap-3 md:grid-cols-3">
      <InfoBox label="Số tầng mẫu" value={LOCATION_LEVELS.join('-')} />
      <InfoBox label="Ô đang xem" value={selectedCellCode} />
      <InfoBox label="Trạng thái ô" value={selectedCellMaterials.length ? 'Đã dùng' : 'Trống'} />
    </div>
  </div>
}

function LayeredSlotDetail({ detail }: { detail: WarehouseLocationDetail }) {
  const rowLabels = buildRowLabels(detail.row)
  const columnLabels = buildColumnLabels(detail.column)

  const occupancyItems = buildMaterialsFromOccupancy(detail)

  const materialsByCell = useMemo(() => {
    const map = new Map<string, any[]>()

    for (const item of occupancyItems) {
      const key =
        normalizeSlotCell(item.slotId) ||
        `${detail.row ?? ''}${detail.column ?? ''}` ||
        'A01'

      const list = map.get(key) ?? []

      list.push(item)

      map.set(key, list)
    }

    return map
  }, [detail, occupancyItems])

  const defaultCell =
    normalizeSlotCell(
      occupancyItems.find((item) => item.slotId)?.slotId,
    ) ||
    `${detail.row ?? 'A'}${detail.column ?? '01'}`

  const [selectedCell, setSelectedCell] = useState(defaultCell)
  const [selectedLevel, setSelectedLevel] = useState('L2')
  const selectedItems = materialsByCell.get(selectedCell) ?? []
  const selectedLevelItems = selectedItems.filter((item) => (item.level || 'L1') === selectedLevel)
  const usedQuantity = selectedLevelItems.reduce((sum, item) => sum + n(item.quantity), 0)
  const levelStats = LOCATION_LEVELS.slice().reverse().map((level) => ({
    level,
    items: selectedItems.filter((item) => (item.level || 'L1') === level),
  }))

  return <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">Chọn ô</p>
            <h4 className="mt-1 text-lg font-bold text-white">{selectedCell}</h4>
          </div>
          <span className="rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-200">{selectedItems.length} vật tư</span>
        </div>
        <div className="grid grid-cols-6 gap-2">
          {rowLabels.flatMap((row) => columnLabels.map((column) => {
            const cell = `${row}${column}`
            const count = materialsByCell.get(cell)?.length ?? 0
            const active = selectedCell === cell
            return <button key={cell} type="button" onClick={() => setSelectedCell(cell)} className={`rounded-lg border px-2 py-2 text-left text-xs transition ${active ? 'border-cyan-300 bg-cyan-400/15 text-cyan-100 shadow-[0_0_22px_rgba(34,211,238,0.18)]' : count ? 'border-emerald-400/50 bg-emerald-500/10 text-emerald-200' : 'border-slate-800 bg-slate-900/55 text-slate-500 hover:border-slate-600'}`}>
              <div className="font-semibold">{cell}</div>
              <div className="mt-1 text-[10px]">{count ? `${count} mã` : 'Trống'}</div>
            </button>
          }))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <InfoBox label="Khu vực" value={detail.warehouse?.name ?? '-'} />
        <InfoBox label="Phân khu" value={detail.code} />
        <InfoBox label="Ô (Slot)" value={selectedCell} />
        <InfoBox label="Tầng đang nổi bật" value={selectedLevel} />
        <InfoBox label="Sức chứa tối đa" value={`${formatQuantity(n(detail.capacity), 0)} tấn`} />
        <InfoBox label="Đang sử dụng" value={`${formatQuantity(usedQuantity, 0)} tấn`} />
      </div>
    </div>

    <div className="rounded-2xl border border-slate-800 bg-[radial-gradient(circle_at_30%_15%,rgba(34,211,238,0.12),transparent_32%),#081321] p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">Mô phỏng phân tầng</p>
          <h4 className="mt-1 text-xl font-bold text-white">Ô {selectedCell}</h4>
        </div>
        <span className="text-xs text-slate-500">Mô phỏng trực quan 2.5D</span>
      </div>
      <div className="grid gap-6 lg:grid-cols-[120px_1fr]">
        <div className="space-y-3 pt-4">
          {levelStats.map((group) => <button key={group.level} type="button" onClick={() => setSelectedLevel(group.level)} className={`block w-full rounded-lg border px-3 py-2 text-sm font-semibold transition ${
            selectedLevel === group.level
              ? 'border-cyan-300 bg-cyan-400/18 text-cyan-100 shadow-[0_0_18px_rgba(34,211,238,0.18)]'
              : group.items.length
                ? 'border-emerald-400/45 bg-emerald-500/10 text-emerald-200'
                : 'border-slate-800 bg-slate-950/50 text-slate-500 hover:border-slate-700'
          }`}>
            {group.level}
          </button>)}
        </div>
        <div className={`relative min-h-[240px] overflow-hidden rounded-xl border border-slate-800 bg-slate-950/40`}>
          <div className="absolute inset-x-8 bottom-8 h-8 rounded-[40%] bg-black/35 blur-md" />
          <div className={`absolute left-1/2 top-10 h-[300px] w-[360px] -translate-x-1/2`}>
            {levelStats.map((group, index) => <button type="button" onClick={() => setSelectedLevel(group.level)} key={group.level} className="absolute left-0 w-full text-left" style={{ top: `${index * 58}px` }}>
              <div className={`relative h-14 skew-x-[-18deg] rounded-lg border transition ${
                selectedLevel === group.level
                  ? 'border-cyan-200 bg-cyan-400/30 shadow-[0_0_34px_rgba(34,211,238,0.34)]'
                  : group.items.length
                    ? 'border-emerald-300/70 bg-emerald-400/16 shadow-[0_0_22px_rgba(16,185,129,0.16)]'
                    : 'border-slate-600/70 bg-slate-800/55'
              }`}>
                <div className="absolute inset-x-4 top-1/2 h-px bg-white/12" />
                <div className="absolute left-1/3 top-0 h-full w-px bg-white/12" />
                <div className="absolute left-2/3 top-0 h-full w-px bg-white/12" />
                <div className="absolute -left-4 top-2 h-14 w-4 skew-y-[35deg] rounded-l bg-slate-900/85" />
                <div className="absolute -right-4 top-2 h-14 w-4 skew-y-[35deg] rounded-r bg-slate-900/85" />
              </div>
              <div className="absolute -left-12 top-4 text-sm font-bold text-slate-400">{group.level}</div>
              <div className="absolute right-3 top-4 rounded bg-slate-950/60 px-2 py-1 text-[10px] text-slate-200">{group.items.length ? `${group.items.length} vật tư` : 'Trống'}</div>
            </button>)}
            <div className="absolute bottom-0 left-4 h-16 w-4 rounded bg-slate-700/70" />
            <div className="absolute bottom-0 right-4 h-16 w-4 rounded bg-slate-700/70" />
          </div>
        </div>
      </div>
      <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/50 p-3">
        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Vật tư trong tầng đang nổi bật</div>
        <div className="mt-2 space-y-2">
          {selectedLevelItems.length ? selectedLevelItems.map((item) => <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-900/55 px-3 py-2 text-sm">
            <span className="truncate text-slate-200">{item.code} · {item.name}</span>
            <span className="shrink-0 text-cyan-300">{formatQuantity(n(item.quantity), 0)} {item.unitMaster?.symbol ?? item.unit ?? ''}</span>
          </div>) : <p className="text-sm text-slate-500">Tầng này chưa có vật tư.</p>}
        </div>
      </div>
    </div>
  </div>
}

function groupMaterialsByLevel(
  detail: WarehouseLocationDetail | null,
) {
  if (!detail) return []

  const items = buildMaterialsFromOccupancy(detail)

  const map = new Map<string, any[]>()

  items.forEach((item) => {
    const level = item.level || 'L1'
    const list = map.get(level) ?? []
    list.push(item)
    map.set(level, list)
  })

  return Array.from(map.entries())
    .map(([level, items]) => ({
      level,
      items,
    }))
    .sort((a, b) => b.level.localeCompare(a.level))
}

function normalizeSlotCell(slotId?: string | null) {
  const value = String(slotId ?? '').trim().toUpperCase()
  if (!value) return ''
  return value.includes(':') ? value.split(':')[0] : value
}
function buildMaterialsFromOccupancy(detail: WarehouseLocationDetail) {
  const rows: Array<{
    id: string
    code: string
    name: string
    quantity: number
    unit?: string | null
    unitMaster?: { symbol?: string | null } | null
    slotId: string
    level: string
  }> = []

  ;(detail.cellOccupancy ?? []).forEach((cell) => {
    ;(cell.materials ?? []).forEach((material) => {
      rows.push({
        id: `${material.id}-${cell.slotId}-${cell.level}`,
        code: material.code,
        name: material.name,
        quantity: material.quantity,
        unit: material.unit,
        unitMaster: null,
        slotId: cell.slotId,
        level: cell.level,
      })
    })
  })

  return rows
}

function getOccupiedCellLevels(
  items: any[], detail?: WarehouseLocationDetail | null) {
  const keys = new Set<string>()
  items.forEach((item) => {
    const cell = normalizeSlotCell(item.slotId) || `${detail?.row ?? ''}${detail?.column ?? ''}` || 'A01'
    const level = item.level || 'L1'
    keys.add(`${cell}:${level}`)
  })
  return Array.from(keys)
}

function buildRowLabels(current?: string | null) {
  const base = LOCATION_ROWS
  const row = String(current ?? '').trim().toUpperCase()
  if (!row || base.includes(row)) return base
  return [row, ...base].slice(0, 6)
}

function buildColumnLabels(current?: string | null) {
  const base = LOCATION_COLUMNS
  const column = String(current ?? '').trim().padStart(2, '0')
  if (!column || base.includes(column)) return base
  return [column, ...base].slice(0, 6)
}

function countOccupiedFromOccupancy(cellOccupancy?: WarehouseLocation['cellOccupancy']) {
  const keys = new Set<string>()
  ;(cellOccupancy ?? []).forEach((entry) => {
    const cell = String(entry.slotId ?? '').trim().toUpperCase()
    const level = String(entry.level ?? 'L1').trim().toUpperCase()
    if (cell) keys.add(`${cell}:${level}`)
  })
  return keys.size
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
    <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</div>
    <div className="mt-1 text-base font-semibold text-slate-100">{value}</div>
  </div>
}
