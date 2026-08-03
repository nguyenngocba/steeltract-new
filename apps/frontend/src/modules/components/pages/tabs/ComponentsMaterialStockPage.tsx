import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, Clock, Layers, Package, Wrench } from 'lucide-react'

import { EnterpriseModulePage } from '@/shared/runtime-tabs/EnterpriseModulePage'
import { EnterpriseKpiCard } from '../../../../shared/ui/cockpit'
import { ModuleDetailDrawer, ModuleEmptyState, ModuleLoadingState } from '../../../../shared/ui/modules'
import {
  InventoryChartCard,
  InventoryPagination,
  InventoryPanel,
  inventoryTableHead,
  inventoryTableRow,
} from '../../../inventory/components/InventoryVisuals'
import { useCreateTransaction } from '../../../inventory/hooks/useCreateTransaction'
import { useInventoryAudit } from '../../../inventory/hooks/useInventoryAudit'
import { useInventoryItems } from '../../../inventory/hooks/useInventoryItems'
import { useInventoryTransactions } from '../../../inventory/hooks/useInventoryTransactions'
import { useProductionReservations } from '../../../production/hooks/useProductionCockpit'
import { componentsInput, componentsMutedButton, componentsPrimaryButton } from './ComponentsCockpitShared'
import { formatLocalDateTimeInput } from '@/shared/utils/date-time'
import { formatCurrencyVnd, formatDateTime, formatQuantity, formatQuantityInput, parseLocaleNumber } from '@/shared/utils/number-format'

type MaterialStockRow = {
  id: string
  inventoryItemId: string
  code: string
  name: string
  materialUsageType: string
  unit: string
  warehouseId?: string
  zoneId?: string
  slotId?: string
  level?: string
  returnWarehouseId?: string
  returnZoneId?: string
  warehouse: string
  location: string
  currentStock: number
  reserved: number
  available: number
  averageCost: number
  inventoryValue: number
  status: 'Sẵn sàng' | 'Cảnh báo' | 'Thiếu'
  updatedAt?: string
}

type LocationBalanceLike = {
  warehouseId?: string
  zoneId?: string
  slotId?: string
  level?: string
  warehouseCode?: string
  warehouseName?: string
  zoneCode?: string
  zoneName?: string
  quantity?: number
}

type InventoryItemLike = {
  id: string
  code: string
  name: string
  materialUsageType?: string
  specification?: string
  unit?: string
  unitMaster?: { symbol?: string }
  unitPrice?: number
  minimumStock?: number
  averageCost?: number
  updatedAt?: string
  zone?: { id?: string; warehouse?: { id?: string; code?: string } }
  locationBalances?: LocationBalanceLike[]
}

const money = (value: number) => formatCurrencyVnd(value)

function materialUsageLabel(value: string | undefined) {
  const map: Record<string, string> = {
    PRIMARY: 'Vật tư chính',
    SECONDARY: 'Vật tư phụ',
    CONSUMABLE: 'Vật tư tiêu hao',
  }
  return map[String(value ?? 'PRIMARY')] ?? 'Vật tư chính'
}

function numeric(value: unknown) {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function isProductionWarehouseBalance(location: LocationBalanceLike) {
  const code = String(location.warehouseCode ?? '').trim().toUpperCase()
  const name = String(location.warehouseName ?? '').trim().toLowerCase()
  return code === 'PRODUCTION' || name.includes('sản xuất') || name.includes('san xuat')
}

function isProductionTransactionLine(line: any, transaction?: any) {
  const code = String(
    line?.warehouse?.code ??
      line?.zone?.warehouse?.code ??
      transaction?.warehouse?.code ??
      '',
  ).trim().toUpperCase()
  const name = String(
    line?.warehouse?.name ??
      line?.zone?.warehouse?.name ??
      transaction?.warehouse?.name ??
      '',
  ).trim().toLowerCase()
  return code === 'PRODUCTION' || name.includes('sản xuất') || name.includes('san xuat')
}

function productionBalanceLocationLabel(location: LocationBalanceLike) {
  const zone = [location.zoneCode, location.zoneName].filter(Boolean).join(' - ') || location.zoneId || 'Vị trí SX chưa gán'
  const slot = location.slotId ? ` / ${location.slotId}` : ''
  const level = location.level ? ` / ${String(location.level).startsWith('L') ? location.level : `L${location.level}`}` : ''
  return `${zone}${slot}${level}`
}

export function ComponentsMaterialStockPage() {
  const { data: inventoryItems = [], isLoading } = useInventoryItems()
  const { data: auditRows = [] } = useInventoryAudit()
  const { data: transactionsData = [], isLoading: isTransactionsLoading } = useInventoryTransactions({})
  const { data: reservations = [] } = useProductionReservations()
  const createTransaction = useCreateTransaction()
  const [query, setQuery] = useState('')
  const [searchDraft, setSearchDraft] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [selectedRow, setSelectedRow] = useState<MaterialStockRow | null>(null)
  const [expandedModalOpen, setExpandedModalOpen] = useState(false)
  const [returnForm, setReturnForm] = useState({ returnedAt: formatLocalDateTimeInput(), quantity: '', note: '' })

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

  useEffect(() => {
    if (!selectedRow) return
    setReturnForm((prev) => ({
      ...prev,
      quantity: '',
      note: '',
      returnedAt: formatLocalDateTimeInput(),
    }))
  }, [selectedRow])

  const rows = useMemo<MaterialStockRow[]>(() => {
    const auditById = new Map(
      (auditRows as any[]).map((row) => [String(row.materialId ?? row.inventoryItemId), row]),
    )
    const reservedByMaterial = new Map<string, number>()
    ;(reservations as any[])
      .filter((reservation) => ['RESERVED', 'PARTIALLY_ISSUED'].includes(String(reservation.status ?? '')))
      .forEach((reservation) => {
        ;(reservation.lines ?? []).forEach((line: any) => {
          const reserved = Math.max(
            0,
            numeric(line.reservedQty) -
              numeric(line.issuedQty) -
              numeric(line.returnedQty),
          )
          reservedByMaterial.set(
            String(line.inventoryItemId),
            (reservedByMaterial.get(String(line.inventoryItemId)) ?? 0) + reserved,
          )
        })
      })
    return (inventoryItems as InventoryItemLike[]).flatMap((item) => {
      const productionLocations = (item.locationBalances ?? [])
        .filter(isProductionWarehouseBalance)
        .filter((location) => numeric(location.quantity) > 0)
      if (!productionLocations.length) return []
      const audit = auditById.get(String(item.id))
      const minimumStock = numeric(item.minimumStock)
      const averageCost = numeric(audit?.averageCost ?? item.averageCost ?? item.unitPrice)
      const itemReserved = reservedByMaterial.get(String(item.id)) ?? 0
      const itemProductionStock = productionLocations.reduce((sum, location) => sum + numeric(location.quantity), 0)
      return productionLocations.map((location) => {
        const currentStock = numeric(location.quantity)
        const locationShare = itemProductionStock > 0 ? currentStock / itemProductionStock : 0
        const reserved = itemReserved * locationShare
        const available = Math.max(currentStock - reserved, 0)
        return {
        id: item.id,
        inventoryItemId: item.id,
        code: item.code,
        name: item.name,
        materialUsageType: item.materialUsageType ?? 'PRIMARY',
        unit: item.unitMaster?.symbol ?? item.unit ?? '-',
        warehouseId: location.warehouseId,
        zoneId: location.zoneId,
        slotId: location.slotId,
        level: location.level,
        returnWarehouseId: item.zone?.warehouse?.code === 'MAIN' ? item.zone.warehouse.id : undefined,
        returnZoneId: item.zone?.warehouse?.code === 'MAIN' ? item.zone.id : undefined,
        warehouse: location.warehouseName ?? 'Kho vật tư sản xuất',
        location: productionBalanceLocationLabel(location),
        currentStock,
        reserved,
        available,
        averageCost,
        inventoryValue: currentStock * averageCost,
        status:
          available <= 0
            ? 'Thiếu'
            : minimumStock > 0 && available <= minimumStock
            ? 'Cảnh báo'
            : 'Sẵn sàng',
        updatedAt: item.updatedAt,
        }
      })
    })
  }, [auditRows, inventoryItems, reservations])

  const filtered = rows.filter((row) => {
    if (status && row.status !== status) return false
    if (query && !`${row.code} ${row.name}`.toLowerCase().includes(query.toLowerCase())) return false
    return true
  })
  const totalValue = rows.reduce((sum, row) => sum + row.inventoryValue, 0)
  const totalAvailable = rows.reduce((sum, row) => sum + row.available, 0)
  const warningCount = rows.filter((row) => row.status !== 'Sẵn sàng').length
  const topMaterials = [...rows].sort((a, b) => b.available - a.available).slice(0, 5)
  const pageSize = 14
  const paginatedRows = filtered.slice((page - 1) * pageSize, page * pageSize)
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const recentProductionTransactions = useMemo(() => {
    const transactionRows = Array.isArray(transactionsData)
      ? transactionsData
      : (transactionsData as any)?.data ?? []
    return (transactionRows as any[])
      .filter((transaction) => (transaction.items ?? []).some((line: any) => isProductionTransactionLine(line, transaction)))
      .slice(0, 5)
  }, [transactionsData])

  const selectedHistory = useMemo(() => {
    if (!selectedRow) return []
    const transactionRows = Array.isArray(transactionsData)
      ? transactionsData
      : (transactionsData as any)?.data ?? []
    return (transactionRows as any[])
      .flatMap((transaction) => (transaction.items ?? [])
        .filter((line: any) =>
          String(line.inventoryItemId ?? line.inventoryItem?.id ?? '') === selectedRow.inventoryItemId &&
          isProductionTransactionLine(line, transaction)
        )
        .map((line: any) => ({ transaction, line })))
  }, [selectedRow, transactionsData])

  useEffect(() => {
    if (page > pageCount) setPage(pageCount)
  }, [page, pageCount])

  async function returnToMainWarehouse(row: MaterialStockRow) {
    const quantity = parseLocaleNumber(returnForm.quantity)
    if (!quantity || quantity <= 0 || quantity > row.available || !row.zoneId) return

    await createTransaction.mutateAsync({
      type: 'TRANSFER',
      transactionDate: returnForm.returnedAt,
      remarks: `[COMPONENT_PRODUCTION_RETURN] ${returnForm.note || `Trả ${row.code} từ kho vật tư SX về kho chính`}`,
      items: [
        {
          inventoryItemId: row.inventoryItemId,
          quantity: -Math.abs(quantity),
          warehouseId: row.warehouseId,
          zoneId: row.zoneId,
          slotId: row.slotId,
          unitPrice: row.averageCost,
          totalAmount: -Math.abs(quantity) * row.averageCost,
        },
        {
          inventoryItemId: row.inventoryItemId,
          quantity: Math.abs(quantity),
          warehouseId: row.returnWarehouseId,
          zoneId: row.returnZoneId,
          unitPrice: row.averageCost,
          totalAmount: Math.abs(quantity) * row.averageCost,
        },
      ],
    })
    setSelectedRow(null)
    setReturnForm({ returnedAt: formatLocalDateTimeInput(), quantity: '', note: '' })
  }

  return (
    <EnterpriseModulePage>
      <div className="w-full min-w-0 flex-1 space-y-1 -mt-2">
        <div className="grid grid-cols-1 gap-1 md:grid-cols-2 xl:grid-cols-6">
          <EnterpriseKpiCard
            title="Mã vật tư trong kho SX"
            value={formatQuantity(rows.length, 0)}
            tone="cyan"
            icon={<Layers size={15} />}
            isLoading={isLoading || isTransactionsLoading}
          />
          <EnterpriseKpiCard
            title="Giá trị tồn kho SX"
            value={money(totalValue)}
            tone="emerald"
            icon={<CheckCircle2 size={15} />}
            isLoading={isLoading || isTransactionsLoading}
          />
          <EnterpriseKpiCard
            title="Giao dịch gần đây"
            value={formatQuantity(recentProductionTransactions.length, 0)}
            tone="purple"
            icon={<Clock size={15} />}
            isLoading={isLoading || isTransactionsLoading}
          />
          <EnterpriseKpiCard
            title="Khả dụng sản xuất"
            value={formatQuantity(totalAvailable)}
            tone="blue"
            icon={<Package size={15} />}
            isLoading={isLoading || isTransactionsLoading}
          />
          <EnterpriseKpiCard
            title="Cảnh báo tồn SX"
            value={formatQuantity(warningCount, 0)}
            tone="amber"
            icon={<AlertTriangle size={15} />}
            isLoading={isLoading || isTransactionsLoading}
          />
          <EnterpriseKpiCard
            title="Vị trí có vật tư"
            value={formatQuantity(topMaterials.length, 0)}
            tone="cyan"
            icon={<Wrench size={15} />}
            isLoading={isLoading || isTransactionsLoading}
          />
        </div>

        <InventoryPanel className="rounded-xl -mt-1">
          <div className="grid grid-cols-1 gap-1 xl:grid-cols-[1fr_220px_130px_120px]">
            <input
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') applySearch()
              }}
              placeholder="Tìm vật tư theo mã, tên..."
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
              <option value="">Tất cả trạng thái</option>
              <option>Sẵn sàng</option>
              <option>Cảnh báo</option>
              <option>Thiếu</option>
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

        <div className="grid grid-cols-1 gap-1 xl:grid-cols-12 items-start">
          <div className="xl:col-span-9">
            <InventoryPanel className="rounded-xl">
              <div className="mb-1 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-white">Kho vật tư sản xuất hiện tại</h3>
                  <span className="rounded-full bg-cyan-400/10 px-2 py-0.5 text-[10px] font-medium text-cyan-300 border border-cyan-400/20">
                    {filtered.length} vật tư
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

              <div className="h-[430px] overflow-auto scrollbar-none rounded-lg border border-white/10 bg-[#08111f]/60">
                <table className="w-full min-w-[920px] table-fixed text-xs border-collapse">
                  <thead
                    className={`${inventoryTableHead} text-slate-300 border-b border-cyan-400/10 sticky top-0 z-10`}
                    style={{ backgroundColor: 'rgba(30, 41, 59, 1)' }}
                  >
                    <tr>
                      <th className="w-[240px] px-3 py-2.5 text-left font-semibold text-slate-300">Vật tư (Mã & Tên)</th>
                      <th className="w-[120px] px-2.5 py-2.5 text-left font-semibold text-slate-300">Loại vật tư</th>
                      <th className="w-[60px] px-2 py-2.5 text-center font-semibold text-slate-300">ĐVT</th>
                      <th className="w-[90px] px-2 py-2.5 text-right font-semibold text-slate-300">Tồn SX</th>
                      <th className="w-[90px] px-2 py-2.5 text-right font-semibold text-slate-300">Đã giữ</th>
                      <th className="w-[95px] px-2 py-2.5 text-right font-semibold text-slate-300">Khả dụng</th>
                      <th className="w-[140px] px-2.5 py-2.5 text-left font-semibold text-slate-300">Vị trí kho SX</th>
                      <th className="w-[90px] px-2 py-2.5 text-center font-semibold text-slate-300">Trạng thái</th>
                      <th className="w-[70px] px-2 py-2.5 text-center font-semibold text-slate-300">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {isLoading || isTransactionsLoading ? (
                      <tr>
                        <td colSpan={9} className="px-2 py-8 text-center">
                          <ModuleLoadingState label="Đang tải tồn kho vật tư..." />
                        </td>
                      </tr>
                    ) : paginatedRows.length ? (
                      paginatedRows.map((row) => (
                        <tr
                          key={`${row.id}-${row.zoneId ?? 'none'}-${row.slotId ?? 'none'}`}
                          onClick={() => setSelectedRow(row)}
                          className={`cursor-pointer transition hover:bg-white/[0.04] ${inventoryTableRow}`}
                        >
                          <td className="px-3 py-2 whitespace-nowrap min-w-0 overflow-hidden">
                            <div className="flex flex-col min-w-0">
                              <span className="text-[11px] font-mono font-semibold text-cyan-300 truncate">{row.code}</span>
                              <span className="text-xs font-medium text-slate-100 truncate" title={row.name}>{row.name}</span>
                            </div>
                          </td>
                          <td className="px-2.5 py-2 whitespace-nowrap overflow-hidden">
                            <span className="inline-block rounded-md border border-cyan-400/20 bg-cyan-400/10 px-2 py-0.5 text-[11px] text-cyan-200 truncate max-w-full">
                              {materialUsageLabel(row.materialUsageType)}
                            </span>
                          </td>
                          <td className="px-2 py-2 text-center text-slate-300 font-medium whitespace-nowrap">{row.unit}</td>
                          <td className="px-2 py-2 text-right font-mono font-medium tabular-nums text-slate-200 whitespace-nowrap">{formatQuantity(row.currentStock)}</td>
                          <td className="px-2 py-2 text-right font-mono font-medium tabular-nums text-slate-400 whitespace-nowrap">{formatQuantity(row.reserved)}</td>
                          <td className="px-2 py-2 text-right font-mono font-medium tabular-nums text-emerald-300 whitespace-nowrap">{formatQuantity(row.available)}</td>
                          <td className="px-2.5 py-2 text-slate-300 text-[11px] font-mono whitespace-nowrap overflow-hidden truncate" title={row.location}>
                            {row.location}
                          </td>
                          <td className="px-2 py-2 text-center whitespace-nowrap">
                            <span
                              className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-medium ${
                                row.status === 'Thiếu'
                                  ? 'border border-red-500/30 bg-red-500/10 text-red-300'
                                  : row.status === 'Cảnh báo'
                                  ? 'border border-amber-500/30 bg-amber-500/10 text-amber-300'
                                  : 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                              }`}
                            >
                              {row.status}
                            </span>
                          </td>
                          <td className="px-2 py-2 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedRow(row)
                              }}
                              className="rounded border border-white/10 bg-white/5 px-2 py-1 text-[11px] font-medium text-cyan-300 transition hover:bg-white/10 hover:text-white"
                            >
                              Chi tiết
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={9} className="px-2 py-10">
                          <ModuleEmptyState icon={<Package size={18} />} title="Chưa có tồn kho sản xuất" description="Không tìm thấy balance hiện tại trong kho PRODUCTION phù hợp với bộ lọc." />
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <InventoryPagination page={page} pageSize={pageSize} pageCount={pageCount} total={filtered.length} onPageChange={setPage} containerClassName="border-t-0" />
            </InventoryPanel>
          </div>

          <div className="space-y-1 xl:col-span-3">
            <InventoryChartCard title="Thiếu vật tư" className="h-[170px]">
              <div className="flex h-full flex-col justify-center gap-1 text-xs text-slate-300">
                <div className="text-3xl font-bold font-mono text-amber-300">{formatQuantity(warningCount, 0)}</div>
                <div>Vật tư cần kiểm tra cấp phát.</div>
              </div>
            </InventoryChartCard>
            <InventoryChartCard title="Giá trị tồn kho" className="h-[170px]">
              <div className="flex h-full flex-col justify-center gap-1 text-xs text-slate-300">
                <div className="text-2xl font-bold font-mono text-emerald-300">{money(totalValue)}</div>
                <div>Khả dụng: <span className="font-mono text-cyan-300">{formatQuantity(totalAvailable)}</span></div>
              </div>
            </InventoryChartCard>
            <InventoryChartCard title="Giao dịch gần đây" className="h-[170px]">
              {recentProductionTransactions.length ? recentProductionTransactions.map((transaction: any) => (
                <div key={transaction.id} className="mb-1 flex justify-between gap-1 text-[12px] text-slate-300">
                  <span className="truncate text-cyan-300 font-mono">{transaction.transactionNo ?? transaction.code}</span>
                  <span className="shrink-0 font-mono text-slate-400">{formatDateTime(transaction.transactionDate ?? transaction.createdAt)}</span>
                </div>
              )) : (
                <ModuleEmptyState icon={<Clock size={18} />} title="Chưa có giao dịch" description="Chưa phát sinh giao dịch vật tư sản xuất." />
              )}
            </InventoryChartCard>
            <InventoryChartCard title="Top vật tư khả dụng" className="h-[170px]">
              {topMaterials.length ? topMaterials.map((row) => (
                <div key={row.id} className="mb-1 flex justify-between gap-1 text-[12px] text-slate-300">
                  <span className="font-mono">{row.code}</span>
                  <span className="text-cyan-300 font-mono">{formatQuantity(row.available)} {row.unit}</span>
                </div>
              )) : (
                <ModuleEmptyState icon={<Package size={18} />} title="Chưa có dữ liệu" description="Chưa có vật tư khả dụng." />
              )}
            </InventoryChartCard>
          </div>
        </div>
      </div>

      {expandedModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-7xl rounded-2xl border border-white/15 bg-[#08111f] p-5 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h2 className="text-base font-bold text-white">Toàn bộ kho vật tư sản xuất (Chi tiết Level 2)</h2>
                <p className="text-xs text-slate-400">Tổng cộng {filtered.length} balance vật tư hiện tại trong kho PRODUCTION với đầy đủ thông số kho, giá trị và đơn giá</p>
              </div>
              <button
                type="button"
                onClick={() => setExpandedModalOpen(false)}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition"
              >
                Đóng
              </button>
            </div>

            <div className="h-[620px] overflow-y-auto rounded-xl border border-white/10 bg-[#08111f]/60">
              <table className="w-full min-w-[1280px] text-xs table-fixed border-collapse">
                <thead
                  className={`${inventoryTableHead} text-slate-300 border-b border-cyan-400/10 sticky top-0 z-10`}
                  style={{ backgroundColor: 'rgba(30, 41, 59, 1)' }}
                >
                  <tr>
                    <th className="w-[100px] px-2 py-2 text-left font-semibold text-slate-300">Mã vật tư</th>
                    <th className="w-[200px] px-2.5 py-2 text-left font-semibold text-slate-300">Tên vật tư</th>
                    <th className="w-[110px] px-2 py-2 text-left font-semibold text-slate-300">Loại vật tư</th>
                    <th className="w-[50px] px-1 py-2 text-center font-semibold text-slate-300">ĐVT</th>
                    <th className="w-[140px] px-2 py-2 text-left font-semibold text-slate-300">Kho SX</th>
                    <th className="w-[140px] px-2 py-2 text-left font-semibold text-slate-300">Vị trí kho SX</th>
                    <th className="w-[90px] px-2 py-2 text-center font-semibold text-slate-300">Slot/Tầng</th>
                    <th className="w-[85px] px-2 py-2 text-right font-semibold text-slate-300">Tồn SX</th>
                    <th className="w-[85px] px-2 py-2 text-right font-semibold text-slate-300">Đã giữ</th>
                    <th className="w-[90px] px-2 py-2 text-right font-semibold text-slate-300">Khả dụng</th>
                    <th className="w-[95px] px-2 py-2 text-right font-semibold text-slate-300">Giá TB</th>
                    <th className="w-[110px] px-2 py-2 text-right font-semibold text-slate-300">Tổng giá trị</th>
                    <th className="w-[85px] px-2 py-2 text-center font-semibold text-slate-300">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {paginatedRows.map((row) => (
                    <tr
                      key={`${row.id}-${row.zoneId ?? 'none'}-${row.slotId ?? 'none'}`}
                      onClick={() => {
                        setSelectedRow(row)
                        setExpandedModalOpen(false)
                      }}
                      className={`${inventoryTableRow} cursor-pointer transition hover:bg-white/[0.04]`}
                    >
                      <td className="px-2 py-2 text-cyan-300 font-mono font-semibold whitespace-nowrap truncate">{row.code}</td>
                      <td className="px-2.5 py-2 text-slate-100 font-medium whitespace-nowrap truncate" title={row.name}>{row.name}</td>
                      <td className="px-2 py-2 whitespace-nowrap truncate"><span className="rounded-md border border-cyan-400/20 bg-cyan-400/10 px-2 py-0.5 text-[11px] text-cyan-200">{materialUsageLabel(row.materialUsageType)}</span></td>
                      <td className="px-1 py-2 text-center text-slate-300 font-medium whitespace-nowrap">{row.unit}</td>
                      <td className="px-2 py-2 text-slate-300 whitespace-nowrap truncate" title={row.warehouse}>{row.warehouse}</td>
                      <td className="px-2 py-2 text-slate-300 font-mono text-[11px] whitespace-nowrap truncate" title={row.location}>{row.location}</td>
                      <td className="px-2 py-2 text-center text-cyan-200 font-mono whitespace-nowrap">{[row.slotId, row.level].filter(Boolean).join(' / ') || '-'}</td>
                      <td className="px-2 py-2 text-right font-mono font-medium tabular-nums text-slate-200 whitespace-nowrap">{formatQuantity(row.currentStock)}</td>
                      <td className="px-2 py-2 text-right font-mono font-medium tabular-nums text-slate-400 whitespace-nowrap">{formatQuantity(row.reserved)}</td>
                      <td className="px-2 py-2 text-right font-mono font-medium tabular-nums text-emerald-300 whitespace-nowrap">{formatQuantity(row.available)}</td>
                      <td className="px-2 py-2 text-right font-mono font-medium tabular-nums text-slate-300 whitespace-nowrap">{money(row.averageCost)}</td>
                      <td className="px-2 py-2 text-right font-mono font-medium tabular-nums text-cyan-300 whitespace-nowrap">{money(row.inventoryValue)}</td>
                      <td className="px-2 py-2 text-center whitespace-nowrap">
                        <span
                          className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-medium ${
                            row.status === 'Thiếu'
                              ? 'border border-red-500/30 bg-red-500/10 text-red-300'
                              : row.status === 'Cảnh báo'
                              ? 'border border-amber-500/30 bg-amber-500/10 text-amber-300'
                              : 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <InventoryPagination
              page={page}
              pageSize={pageSize}
              pageCount={pageCount}
              total={filtered.length}
              onPageChange={setPage}
              containerClassName="border-t-0"
            />
          </div>
        </div>
      ) : null}

      <ModuleDetailDrawer
        open={Boolean(selectedRow)}
        title={selectedRow ? `${selectedRow.code} · ${selectedRow.name}` : 'Kho vật tư SX'}
        subtitle={selectedRow ? `${selectedRow.warehouse} / ${selectedRow.location}` : undefined}
        onClose={() => setSelectedRow(null)}
        widthClass="w-[min(48rem,calc(100vw-2rem))]"
      >
        {selectedRow ? (
          <div className="space-y-1">
            <div className="grid grid-cols-2 gap-1 md:grid-cols-4">
              <div className="rounded-lg bg-white/5 p-3">
                <div className="text-[10px] text-slate-400 uppercase">Tồn SX</div>
                <div className="font-mono text-cyan-300">{formatQuantity(selectedRow.currentStock)}</div>
              </div>
              <div className="rounded-lg bg-white/5 p-3">
                <div className="text-[10px] text-slate-400 uppercase">Khả dụng</div>
                <div className="font-mono text-emerald-300">{formatQuantity(selectedRow.available)}</div>
              </div>
              <div className="rounded-lg bg-white/5 p-3">
                <div className="text-[10px] text-slate-400 uppercase">Giá TB</div>
                <div className="font-mono text-blue-300">{money(selectedRow.averageCost)}</div>
              </div>
              <div className="rounded-lg bg-white/5 p-3">
                <div className="text-[10px] text-slate-400 uppercase">Giá trị</div>
                <div className="font-mono text-purple-300">{money(selectedRow.inventoryValue)}</div>
              </div>
            </div>
            <InventoryChartCard title="Lịch sử nhập / trả kho SX" className="h-[170px]">
              <div className="max-h-44 overflow-auto text-xs">
                {selectedHistory.map(({ transaction, line }: any) => (
                  <div key={`${transaction.id}-${line.id}`} className="mb-1 flex justify-between rounded border border-slate-800 px-2 py-1.5">
                    <span className={String(transaction.remarks ?? '').includes('RETURN') ? 'text-amber-300' : 'text-emerald-300'}>{transaction.transactionNo ?? transaction.code}</span>
                    <span className="font-mono text-slate-400">{formatDateTime(transaction.transactionDate ?? transaction.createdAt)}</span>
                    <span className="font-mono text-cyan-300">{formatQuantity(Math.abs(Number(line.quantity ?? 0)))} {selectedRow.unit}</span>
                  </div>
                ))}
                {!selectedHistory.length ? <ModuleEmptyState icon={<Clock size={18} />} title="Chưa có lịch sử" description="Chưa có lịch sử nhập/trả kho sản xuất." /> : null}
              </div>
            </InventoryChartCard>
            <div className="grid gap-1 rounded border border-amber-900/60 bg-amber-950/10 p-4 md:grid-cols-3">
              <input type="datetime-local" value={returnForm.returnedAt} onFocus={() => setReturnForm((prev) => ({ ...prev, returnedAt: formatLocalDateTimeInput() }))} onChange={(event) => setReturnForm((prev) => ({ ...prev, returnedAt: event.target.value }))} className={componentsInput} />
              <input value={returnForm.quantity} onFocus={(event) => setReturnForm((prev) => ({ ...prev, quantity: formatQuantityInput(event.target.value) }))} onBlur={(event) => setReturnForm((prev) => ({ ...prev, quantity: formatQuantity(event.target.value) }))} onChange={(event) => setReturnForm((prev) => ({ ...prev, quantity: formatQuantityInput(event.target.value) }))} inputMode="decimal" placeholder="Số lượng trả" className={componentsInput} />
              <input value={returnForm.note} onChange={(event) => setReturnForm((prev) => ({ ...prev, note: event.target.value }))} placeholder="Ghi chú trả kho" className={componentsInput} />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setSelectedRow(null)} className={componentsMutedButton}>Hủy</button>
              <button disabled={!selectedRow.zoneId || parseLocaleNumber(returnForm.quantity || 0) <= 0 || parseLocaleNumber(returnForm.quantity || 0) > selectedRow.available} onClick={() => void returnToMainWarehouse(selectedRow)} className={componentsPrimaryButton}>Trả về kho chính</button>
            </div>
          </div>
        ) : null}
      </ModuleDetailDrawer>
    </EnterpriseModulePage>
  )
}
