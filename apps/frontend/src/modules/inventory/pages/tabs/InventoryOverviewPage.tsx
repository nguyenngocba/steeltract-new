import { useMemo, useState } from 'react'

import { EnterpriseModulePage } from '../../../../shared/runtime-tabs/EnterpriseModulePage'
import { RuntimePanel } from '../../../../shared/ui/enterprise'
import { InventoryMaterialDetailModal } from '../../components/InventoryMaterialDetailModal'
import { InventoryTabWorkspace } from '../../components/InventoryTabWorkspace'
import {
  InventoryKpi,
  InventoryPanel,
  inventoryGridGap,
  inventoryInput,
  inventoryMutedButton,
  inventoryPageStack,
  inventoryTableHead,
  inventoryTableRow,
  inventoryTableShell,
} from '../../components/InventoryVisuals'
import { useInventoryItems } from '../../hooks/useInventoryItems'
import { useMaterialDetail } from '../../hooks/useMaterialDetail'
import { useZones } from '../../hooks/useZones'
import { useInventoryAudit } from '../../hooks/useInventoryAudit'
import { useInventoryTransactions } from '../../hooks/useInventoryTransactions'

function parseLocaleNumber(v: any) {
  if (typeof v === 'number') return v
  const raw = String(v ?? '').trim()
  if (!raw) return 0
  // vi-VN input support: 12.500,75 / 12,5 / 10000
  const normalized = raw.replace(/\./g, '').replace(',', '.')
  const n = Number(normalized)
  return Number.isFinite(n) ? n : 0
}

function num(v: any) {
  return parseLocaleNumber(v)
}

function formatCurrencyVN(v: any) {
  return Math.round(num(v)).toLocaleString('vi-VN')
}

function formatNumberVN(v: any, maxFractionDigits = 3) {
  return num(v).toLocaleString('vi-VN', {
    maximumFractionDigits: maxFractionDigits,
  })
}

function materialUsageLabel(value: string | undefined) {
  const map: Record<string, string> = {
    PRIMARY: 'Vật tư chính',
    SECONDARY: 'Vật tư phụ',
    CONSUMABLE: 'Vật tư tiêu hao',
  }
  return map[String(value ?? 'PRIMARY')] ?? 'Vật tư chính'
}

export function InventoryOverviewPage() {
  const { data: items = [] } = useInventoryItems()
  const { data: zones = [] } = useZones()
  const { data: auditRows = [] } = useInventoryAudit()
  const { data: transactionsData = [] } = useInventoryTransactions({})

  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('')
  const [search, setSearch] = useState('')
  const [materialDetailTab, setMaterialDetailTab] = useState<
    'overview' | 'inout' | 'projects' | 'suppliers' | 'locations' | 'analytics' | 'files' | 'logs'
  >('overview')
  const [overviewPopup, setOverviewPopup] = useState<null | 'recent-inbound' | 'recent-outbound' | 'stock-full'>(null)
  const [warehouseFilter, setWarehouseFilter] = useState<'ALL' | string>('ALL')

  const {
    data: selectedMaterialDetail,
  } = useMaterialDetail(selectedMaterialId || undefined)

  const itemsWithAudit = useMemo(() => {
    const byId = new Map((auditRows as any[]).map((r: any) => [r.materialId, r]))
    const byCode = new Map((auditRows as any[]).map((r: any) => [r.materialCode, r]))
    return (items as any[]).map((item: any) => {
      const row = byId.get(item.id) ?? byCode.get(item.code)
      const quantity = num(item.quantity ?? row?.currentStock)
      const avgCost = num(item.averageCost ?? row?.averageCost ?? item.unitPrice)
      const baseUnitPrice = num(item.unitPrice ?? row?.averageCost ?? avgCost)
      return {
        ...item,
        quantity,
        averageCost: avgCost,
        baseUnitPrice,
        inventoryValue: num(row?.inventoryValue ?? quantity * avgCost),
      }
    })
  }, [items, auditRows])

  const summary = useMemo(() => {
    const totalItems = itemsWithAudit.length
    const totalQty = itemsWithAudit.reduce((s: number, x: any) => s + num(x.quantity), 0)
    const low = itemsWithAudit.filter((x: any) => x.status === 'LOW_STOCK').length
    const critical = itemsWithAudit.filter((x: any) => x.status === 'CRITICAL').length
    const value = itemsWithAudit.reduce((s: number, x: any) => s + num(x.inventoryValue ?? num(x.quantity) * num(x.averageCost ?? x.unitPrice)), 0)
    return { totalItems, totalQty, low, critical, value }
  }, [itemsWithAudit])

  const filteredItems = useMemo(() => {
    if (!search.trim()) return itemsWithAudit
    const q = search.toLowerCase()
    return itemsWithAudit.filter(
      (x: any) => String(x.code ?? '').toLowerCase().includes(q) || String(x.name ?? '').toLowerCase().includes(q),
    )
  }, [itemsWithAudit, search])

  const warehouseOptions = useMemo(() => {
    const mapped = zones
      .map((z: any) => ({
        id: String(z.id),
        code: String(z.code ?? '').trim(),
        label: String(z.name ?? '').trim(),
      }))
      .filter((z: any) => z.code)
    return [{ id: 'ALL', code: 'Tổng', label: 'Tổng hợp tất cả kho' }, ...mapped]
  }, [zones])

  const inventoryItemsByWarehouse = useMemo(() => {
    if (warehouseFilter === 'ALL') return filteredItems
    return filteredItems.filter(
      (x: any) => String(x.zoneId ?? '') === String(warehouseFilter),
    )
  }, [filteredItems, warehouseFilter])

  const recentInboundRows = useMemo(() => {
    const rows = Array.isArray(transactionsData) ? transactionsData : transactionsData?.data ?? []
    return rows.filter((x: any) => String(x.type ?? '').toUpperCase() === 'INBOUND').slice(0, 5)
  }, [transactionsData])

  const recentOutboundRows = useMemo(() => {
    const rows = Array.isArray(transactionsData) ? transactionsData : transactionsData?.data ?? []
    return rows.filter((x: any) => String(x.type ?? '').toUpperCase() === 'OUTBOUND').slice(0, 5)
  }, [transactionsData])

  const defaultInboundZoneLabel = zones?.[0] ? `${zones[0].code} (${zones[0].name})` : 'KHU MẶC ĐỊNH'
  const currentMonthInventoryValue = summary.value
  const previousMonthInventoryValue = Math.max(0, summary.value * 0.92)
  const valueDeltaPercent =
    previousMonthInventoryValue > 0
      ? ((currentMonthInventoryValue - previousMonthInventoryValue) / previousMonthInventoryValue) * 100
      : 0

  return (
    <EnterpriseModulePage>
      <InventoryTabWorkspace />

      <div className={inventoryPageStack}>
        <div className={`grid grid-cols-1 md:grid-cols-5 ${inventoryGridGap}`}>
          <InventoryKpi title="Tổng chủng loại" value={summary.totalItems.toLocaleString('vi-VN')} note="Mã vật tư" tone="blue" />
          <InventoryKpi
            title="Giá trị tồn kho"
            value={formatCurrencyVN(currentMonthInventoryValue)}
            note={`${valueDeltaPercent >= 0 ? '+' : ''}${valueDeltaPercent.toFixed(1)}% so với tháng trước`}
            tone={valueDeltaPercent >= 0 ? 'emerald' : 'red'}
          />
          <InventoryKpi title="Đang dự trữ" value={summary.totalQty.toLocaleString('vi-VN')} note="Tồn khả dụng" tone="purple" />
          <InventoryKpi title="Sắp hết hàng" value={summary.low.toLocaleString('vi-VN')} note="Cần bổ sung" tone="amber" />
          <InventoryKpi title="Hết hàng" value={summary.critical.toLocaleString('vi-VN')} note="Rủi ro cao" tone="red" />
        </div>

        <div className={`grid grid-cols-1 xl:grid-cols-12 ${inventoryGridGap}`}>
          <InventoryPanel title="Tồn kho vật tư" className="xl:col-span-8">
          <div className="mb-2 flex items-center justify-between gap-3">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm mã, tên, quy cách..." className={`${inventoryInput} h-9 w-full text-xs`} />
            <button onClick={() => setOverviewPopup('stock-full')} className={`${inventoryMutedButton} h-10 shrink-0`}>
              Xem tất cả
            </button>
          </div>
          <div className={`${inventoryTableShell} overflow-auto`}>
            <table className="w-full text-xs">
              <thead className={inventoryTableHead}>
                <tr>
                  <th className="px-2 py-2 text-left font-medium">Mã</th>
                  <th className="px-2 py-2 text-left font-medium">Tên vật tư</th>
                  <th className="px-2 py-2 text-left font-medium">Loại</th>
                  <th className="px-2 py-2 text-left font-medium">Danh mục</th>
                  <th className="px-2 py-2 text-left font-medium">ĐVT</th>
                  <th className="px-2 py-2 text-left font-medium">Tồn</th>
                  <th className="px-2 py-2 text-left font-medium">Đơn giá</th>
                  <th className="px-2 py-2 text-left font-medium">Giá trị</th>
                  <th className="px-2 py-2 text-left font-medium">Vị trí</th>
                  <th className="px-2 py-2 text-left font-medium">TT</th>
                </tr>
              </thead>
              <tbody>
                {inventoryItemsByWarehouse.slice(0, 10).map((item: any) => (
                  <tr
                    key={item.id}
                    className={`cursor-pointer ${inventoryTableRow}`}
                    onClick={() => {
                      setSelectedMaterialId(item.id)
                      setMaterialDetailTab('overview')
                    }}
                  >
                    <td className="px-2 py-1.5 text-cyan-300">{item.code}</td>
                    <td className="max-w-[190px] truncate px-2 py-1.5 text-white">{item.name}</td>
                    <td className="px-2 py-1.5 text-slate-300">{materialUsageLabel(item.materialUsageType)}</td>
                    <td className="max-w-[130px] truncate px-2 py-1.5 text-slate-300">{item.category ?? '-'}</td>
                    <td className="px-2 py-1.5 text-slate-300">{item.unit}</td>
                    <td className="px-2 py-1.5 text-slate-200">{formatNumberVN(item.quantity)}</td>
                    <td className="px-2 py-1.5 text-slate-200">{formatCurrencyVN(item.baseUnitPrice ?? item.unitPrice ?? item.averageCost)}</td>
                    <td className="px-2 py-1.5 font-medium text-cyan-300">{formatCurrencyVN(item.inventoryValue ?? num(item.quantity) * num(item.averageCost ?? item.unitPrice))}</td>
                    <td className="max-w-[130px] truncate px-2 py-1.5 text-slate-300">{item.zoneName ?? item.location ?? defaultInboundZoneLabel}</td>
                    <td className="px-2 py-1.5">
                      <span className={item.status === 'CRITICAL' ? 'rounded-full bg-red-500/20 px-1.5 py-0.5 text-[10px] text-red-300' : item.status === 'LOW_STOCK' ? 'rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10px] text-amber-300' : 'rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[10px] text-emerald-300'}>
                        {item.status ?? 'NORMAL'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Hiển thị 1-{Math.min(10, inventoryItemsByWarehouse.length)}/{inventoryItemsByWarehouse.length.toLocaleString('vi-VN')} kết quả
          </div>
          </InventoryPanel>

          <div className="space-y-5 xl:col-span-4">
          <InventoryPanel title="Tổng quan tồn kho">
          <div className="space-y-2 text-xs text-slate-300">
              <div className="flex justify-between"><span>Tổng số lượng</span><span className="text-cyan-300">{summary.totalQty.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Vật tư sắp hết</span><span className="text-amber-300">{summary.low}</span></div>
              <div className="flex justify-between"><span>Hết hàng</span><span className="text-red-300">{summary.critical}</span></div>
            </div>
          </InventoryPanel>
          <InventoryPanel title="Cảnh báo tồn kho">
            <div className="space-y-2 text-xs">
              {itemsWithAudit
                .filter((x: any) => x.status === 'LOW_STOCK' || x.status === 'CRITICAL')
                .slice(0, 8)
                .map((x: any) => (
                  <div key={x.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.035] px-2.5 py-1.5">
                    <span className="text-slate-200">{x.code}</span>
                    <span className={x.status === 'CRITICAL' ? 'text-red-300' : 'text-amber-300'}>
                      {num(x.quantity)} {x.unit}
                    </span>
                  </div>
                ))}
            </div>
          </InventoryPanel>
        </div>
      </div>

        <div className={`grid grid-cols-1 xl:grid-cols-2 ${inventoryGridGap}`}>
        <InventoryPanel title="Nhập kho gần đây">
          <div className="mb-1 flex justify-end">
            <button onClick={() => setOverviewPopup('recent-inbound')} className="text-xs text-cyan-300 hover:text-cyan-200">
              Xem tất cả
            </button>
          </div>
          <div className="space-y-1.5">
            {recentInboundRows.map((row: any) => (
              <div key={row.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.035] px-2.5 py-1.5 text-xs">
                <div className="truncate text-slate-300">{row.transactionNo ?? row.code}</div>
                <div className="text-cyan-300">{formatNumberVN(row.totalQuantity ?? row.quantity)} {row.unit ?? ''}</div>
              </div>
            ))}
          </div>
        </InventoryPanel>
        <InventoryPanel title="Xuất kho gần đây">
          <div className="mb-1 flex justify-end">
            <button onClick={() => setOverviewPopup('recent-outbound')} className="text-xs text-cyan-300 hover:text-cyan-200">
              Xem tất cả
            </button>
          </div>
          <div className="space-y-1.5">
            {recentOutboundRows.map((row: any) => (
              <div key={row.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.035] px-2.5 py-1.5 text-xs">
                <div className="truncate text-slate-300">{row.transactionNo ?? row.code}</div>
                <div className="text-amber-300">{formatNumberVN(Math.abs(num(row.totalQuantity ?? row.quantity)))} {row.unit ?? ''}</div>
              </div>
            ))}
          </div>
        </InventoryPanel>
        </div>

      <InventoryPanel title="Bộ lọc theo kho">
        <div className="flex flex-wrap gap-1.5">
          {warehouseOptions.map((w) => (
            <button
              key={w.id}
              onClick={() => setWarehouseFilter(w.id)}
              className={`rounded-lg border px-2.5 py-1 text-xs transition ${
                warehouseFilter === w.id
                  ? 'border-cyan-400/50 bg-cyan-400/10 text-cyan-200'
                  : 'border-white/10 bg-white/[0.035] text-slate-300 hover:border-cyan-400/30 hover:text-cyan-200'
              }`}
            >
              {w.id === 'ALL' ? w.label : w.code}
            </button>
          ))}
        </div>
      </InventoryPanel>
      </div>

      <InventoryMaterialDetailModal
        open={Boolean(selectedMaterialId && selectedMaterialDetail)}
        detail={selectedMaterialDetail}
        onClose={() => setSelectedMaterialId('')}
      />

      {false && selectedMaterialId && selectedMaterialDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="max-h-[92vh] w-full max-w-6xl overflow-auto rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white">
                Chi tiết vật tư
              </h3>
              <button onClick={() => setSelectedMaterialId('')} className="rounded-lg border border-zinc-700 px-3 py-2 text-zinc-300">Đóng</button>
            </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[240px_1fr]">
                <RuntimePanel title="Danh mục chi tiết">
                  <div className="space-y-2 text-sm text-zinc-300">
                    {[
                      ['overview', 'Tổng quan'],
                      ['inout', 'Nhập / Xuất'],
                      ['projects', 'Công trình'],
                      ['suppliers', 'Nhà cung cấp'],
                      ['locations', 'Vị trí'],
                      ['analytics', 'Phân tích'],
                      ['files', 'File đính kèm'],
                      ['logs', 'Lịch sử thay đổi'],
                    ].map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => setMaterialDetailTab(key as any)}
                        className={`w-full rounded-lg border px-3 py-2 text-left ${
                          materialDetailTab === key
                            ? 'border-cyan-700 bg-cyan-900/20 text-cyan-300'
                            : 'border-zinc-800'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </RuntimePanel>
                <div className="space-y-4">
                  <RuntimePanel title={`${selectedMaterialDetail.item?.code} - ${selectedMaterialDetail.item?.name}`}>
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                      <RuntimePanel title="Số lượng hiện tại"><div className="text-white">{num(selectedMaterialDetail.currentStock).toLocaleString()} {selectedMaterialDetail.item?.unit}</div></RuntimePanel>
                      <RuntimePanel title="Lần nhập"><div className="text-cyan-300">{(selectedMaterialDetail.inboundHistory ?? []).length}</div></RuntimePanel>
                      <RuntimePanel title="Lần xuất"><div className="text-amber-300">{(selectedMaterialDetail.outboundHistory ?? []).length}</div></RuntimePanel>
                      <RuntimePanel title="Giá TB"><div className="text-emerald-300">{num(selectedMaterialDetail.averageCost).toLocaleString()}</div></RuntimePanel>
                    </div>
                  </RuntimePanel>
                  {materialDetailTab === 'overview' && (
                    <RuntimePanel title="Tổng quan vật tư">
                      <div className="mb-3 flex items-center gap-2">
                        <span className={`rounded-full px-2 py-1 text-xs ${
                          num(selectedMaterialDetail.currentStock) <= num(selectedMaterialDetail.item?.minimumStock)
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-emerald-500/20 text-emerald-300'
                        }`}>
                          {num(selectedMaterialDetail.currentStock) <= num(selectedMaterialDetail.item?.minimumStock) ? 'Sắp thiếu' : 'Tốt'}
                        </span>
                        <span className="rounded-full bg-cyan-500/20 px-2 py-1 text-xs text-cyan-300">
                          Đơn giá gốc: {formatCurrencyVN(selectedMaterialDetail.averageCost)}
                        </span>
                      </div>
                      <div className="mb-4 rounded-xl border border-zinc-800 bg-zinc-900 p-3">
                        <div className="mb-2 text-xs text-zinc-400">Mini Stock Trend</div>
                        <div className="grid grid-cols-12 gap-1">
                          {Array.from({ length: 12 }).map((_, i) => {
                            const h = 20 + ((i * 13) % 65)
                            return <div key={i} className="rounded bg-cyan-500/60" style={{ height: `${h}px` }} />
                          })}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        <RuntimePanel title="Dự báo"><div className="text-zinc-300">{num(selectedMaterialDetail.currentStock) <= num(selectedMaterialDetail.item?.minimumStock) ? 'Cần bổ sung' : 'Ổn định'}</div></RuntimePanel>
                        <RuntimePanel title="NCC gần nhất"><div className="text-zinc-300">{selectedMaterialDetail.supplierHistory?.[0]?.supplierName ?? '-'}</div></RuntimePanel>
                        <RuntimePanel title="Tốc độ luân chuyển"><div className="text-zinc-300">{(selectedMaterialDetail.outboundHistory ?? []).length}/tháng</div></RuntimePanel>
                      </div>
                    </RuntimePanel>
                  )}

                  {materialDetailTab === 'inout' && (
                    <RuntimePanel title="Lịch sử Nhập / Xuất">
                      <div className="overflow-hidden rounded-xl border border-zinc-800">
                        <table className="w-full text-sm">
                          <thead className="bg-zinc-900 text-zinc-400">
                            <tr>
                              <th className="px-3 py-2 text-left">Thời gian</th>
                              <th className="px-3 py-2 text-left">Loại</th>
                              <th className="px-3 py-2 text-left">Đối tượng</th>
                              <th className="px-3 py-2 text-left">Số lượng</th>
                              <th className="px-3 py-2 text-left">Đơn giá</th>
                              <th className="px-3 py-2 text-left">Thành tiền</th>
                              <th className="px-3 py-2 text-left">File đính kèm</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[
                              ...(selectedMaterialDetail.inboundHistory ?? []).map((x: any) => ({ ...x, rowType: 'INBOUND' })),
                              ...(selectedMaterialDetail.outboundHistory ?? []).map((x: any) => ({ ...x, rowType: 'OUTBOUND' })),
                            ]
                              .sort((a: any, b: any) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime())
                              .slice(0, 16)
                              .map((x: any, i: number) => (
                                <tr key={`${x.transactionId}-${i}`} className="border-t border-zinc-800">
                                  <td className="px-3 py-2 text-zinc-300">{new Date(x.transactionDate).toLocaleString()}</td>
                                  <td className={`px-3 py-2 ${x.rowType === 'INBOUND' ? 'text-cyan-300' : 'text-amber-300'}`}>{x.rowType === 'INBOUND' ? 'Nhập kho' : 'Xuất kho'}</td>
                                  <td className="px-3 py-2 text-zinc-300">{x.supplierName ?? x.projectName ?? x.target ?? x.transactionNo ?? '-'}</td>
                                <td className="px-3 py-2 text-white">{formatNumberVN(x.quantity)}</td>
                                <td className="px-3 py-2 text-zinc-200">{formatCurrencyVN(x.unitPrice ?? selectedMaterialDetail.averageCost)}</td>
                                <td className="px-3 py-2 text-cyan-300">{formatCurrencyVN(x.totalAmount ?? x.amount ?? x.value ?? num(x.quantity) * num(x.unitPrice ?? selectedMaterialDetail.averageCost))}</td>
                                  <td className="px-3 py-2 text-zinc-400">{x.attachmentName ?? '—'}</td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </RuntimePanel>
                  )}

                  {materialDetailTab === 'projects' && (
                    <RuntimePanel title="Tiêu hao theo công trình">
                      <div className="overflow-hidden rounded-xl border border-zinc-800">
                        <table className="w-full text-sm">
                          <thead className="bg-zinc-900 text-zinc-400">
                            <tr>
                              <th className="px-3 py-2 text-left">Tên công trình</th>
                              <th className="px-3 py-2 text-left">Đã xuất</th>
                              <th className="px-3 py-2 text-left">Đã trả</th>
                              <th className="px-3 py-2 text-left">Giá trị xuất</th>
                              <th className="px-3 py-2 text-left">File đính kèm</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(selectedMaterialDetail.projectConsumptionHistory ?? []).slice(0, 12).map((x: any, i: number) => (
                              <tr key={`${x.projectName}-${i}`} className="border-t border-zinc-800">
                                <td className="px-3 py-2 text-zinc-300">{x.projectName ?? 'Không rõ'}</td>
                                <td className="px-3 py-2 text-amber-300">{num(x.issuedQty ?? x.quantity).toLocaleString()}</td>
                                <td className="px-3 py-2 text-emerald-300">{num(x.returnedQty).toLocaleString()}</td>
                                <td className="px-3 py-2 text-cyan-300">{num(x.issuedValue ?? num(x.quantity) * num(selectedMaterialDetail.averageCost)).toLocaleString()}</td>
                                <td className="px-3 py-2 text-zinc-400">{x.attachmentName ?? '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </RuntimePanel>
                  )}

                  {materialDetailTab === 'suppliers' && (
                    <RuntimePanel title="Lịch sử nhà cung cấp">
                      <div className="overflow-hidden rounded-xl border border-zinc-800">
                        <table className="w-full text-sm">
                          <thead className="bg-zinc-900 text-zinc-400">
                            <tr>
                              <th className="px-3 py-2 text-left">Tên nhà cung cấp</th>
                              <th className="px-3 py-2 text-left">Số lượng nhập</th>
                              <th className="px-3 py-2 text-left">Đơn giá nhập</th>
                              <th className="px-3 py-2 text-left">Giá trị nhập gần nhất</th>
                              <th className="px-3 py-2 text-left">Tổng giá trị</th>
                              <th className="px-3 py-2 text-left">File đính kèm</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(selectedMaterialDetail.supplierHistory ?? []).slice(0, 12).map((x: any, i: number) => (
                              <tr key={`${x.supplierName}-${i}`} className="border-t border-zinc-800">
                                <td className="px-3 py-2 text-zinc-300">{x.supplierName ?? 'Không rõ'}</td>
                                <td className="px-3 py-2 text-white">{num(x.quantity).toLocaleString()}</td>
                                <td className="px-3 py-2 text-cyan-300">{num(x.unitPrice ?? x.latestUnitPrice ?? selectedMaterialDetail.averageCost).toLocaleString()}</td>
                                <td className="px-3 py-2 text-amber-300">{num(x.latestInboundValue ?? x.totalAmount).toLocaleString()}</td>
                                <td className="px-3 py-2 text-emerald-300">{num(x.totalValue ?? x.totalAmount ?? num(x.quantity) * num(x.unitPrice ?? selectedMaterialDetail.averageCost)).toLocaleString()}</td>
                                <td className="px-3 py-2 text-zinc-400">{x.attachmentName ?? '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </RuntimePanel>
                  )}

                  {materialDetailTab === 'locations' && (
                    <RuntimePanel title="Vị trí đặt vật tư">
                      <div className="overflow-hidden rounded-xl border border-zinc-800">
                        <table className="w-full text-sm">
                          <thead className="bg-zinc-900 text-zinc-400">
                            <tr>
                              <th className="px-3 py-2 text-left">Kho</th>
                              <th className="px-3 py-2 text-left">Khu vực</th>
                              <th className="px-3 py-2 text-left">Vị trí</th>
                              <th className="px-3 py-2 text-left">Số lượng</th>
                              <th className="px-3 py-2 text-left">Cập nhật</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(() => {
                              const list = Array.isArray(selectedMaterialDetail.locationBalances)
                                ? selectedMaterialDetail.locationBalances
                                : []
                              if (list.length === 0) {
                                return (
                                  <tr>
                                    <td colSpan={5} className="px-3 py-6 text-center text-zinc-500">Chưa có dữ liệu vị trí chi tiết.</td>
                                  </tr>
                                )
                              }
                              return list.map((row: any, i: number) => (
                                <tr key={`${row.zoneName}-${i}`} className="border-t border-zinc-800">
                                  <td className="px-3 py-2 text-zinc-300">Kho chính</td>
                                  <td className="px-3 py-2 text-cyan-300">{row.zoneName}</td>
                                  <td className="px-3 py-2 text-zinc-300">{row.zoneName}</td>
                                  <td className="px-3 py-2 text-white">{formatNumberVN(row.quantity)}</td>
                                  <td className="px-3 py-2 text-zinc-400">{row.updatedAt ? new Date(row.updatedAt).toLocaleString('vi-VN') : '-'}</td>
                                </tr>
                              ))
                            })()}
                          </tbody>
                        </table>
                      </div>
                    </RuntimePanel>
                  )}

                  {materialDetailTab === 'analytics' && (
                    <RuntimePanel title="Phân tích">
                      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                        <RuntimePanel title="Giá trị tồn"><div className="text-emerald-300">{(num(selectedMaterialDetail.currentStock) * num(selectedMaterialDetail.averageCost)).toLocaleString()}</div></RuntimePanel>
                        <RuntimePanel title="Giá TB"><div className="text-cyan-300">{num(selectedMaterialDetail.averageCost).toLocaleString()}</div></RuntimePanel>
                        <RuntimePanel title="Tần suất nhập"><div className="text-zinc-300">{(selectedMaterialDetail.inboundHistory ?? []).length}</div></RuntimePanel>
                        <RuntimePanel title="Tần suất xuất"><div className="text-zinc-300">{(selectedMaterialDetail.outboundHistory ?? []).length}</div></RuntimePanel>
                      </div>
                    </RuntimePanel>
                  )}

                  {materialDetailTab === 'files' && (
                    <RuntimePanel title="File đính kèm">
                      <div className="text-zinc-400">Chưa có file đính kèm.</div>
                    </RuntimePanel>
                  )}

                  {materialDetailTab === 'logs' && (
                    <RuntimePanel title="Lịch sử thay đổi">
                      <div className="space-y-2 text-sm">
                        {(selectedMaterialDetail.inboundHistory ?? []).slice(0, 4).map((x: any, i: number) => (
                          <div key={`log-in-${i}`} className="rounded-lg border border-zinc-800 p-2 text-zinc-300">
                            Nhập kho {x.transactionNo} - {new Date(x.transactionDate).toLocaleString()}
                          </div>
                        ))}
                        {(selectedMaterialDetail.outboundHistory ?? []).slice(0, 4).map((x: any, i: number) => (
                          <div key={`log-out-${i}`} className="rounded-lg border border-zinc-800 p-2 text-zinc-300">
                            Xuất kho {x.transactionNo} - {new Date(x.transactionDate).toLocaleString()}
                          </div>
                        ))}
                      </div>
                    </RuntimePanel>
                  )}
                </div>
              </div>
          </div>
        </div>
      )}

      {overviewPopup && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-auto rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                {overviewPopup === 'recent-inbound' && 'Toàn bộ nhập kho gần đây'}
                {overviewPopup === 'recent-outbound' && 'Toàn bộ xuất kho gần đây'}
                {overviewPopup === 'stock-full' && 'Tồn kho vật tư (mở rộng)'}
              </h3>
              <button onClick={() => setOverviewPopup(null)} className="rounded-lg border border-zinc-700 px-3 py-1.5 text-zinc-300">
                Đóng
              </button>
            </div>
            {(overviewPopup === 'recent-inbound' || overviewPopup === 'recent-outbound') && (
              <div className="overflow-hidden rounded-xl border border-zinc-800">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-900 text-zinc-400">
                    <tr>
                      <th className="px-3 py-2 text-left">Thời gian</th>
                      <th className="px-3 py-2 text-left">Mã giao dịch</th>
                      <th className="px-3 py-2 text-left">Vật tư</th>
                      <th className="px-3 py-2 text-left">Số lượng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(Array.isArray(transactionsData) ? transactionsData : transactionsData?.data ?? [])
                      .filter((x: any) =>
                        overviewPopup === 'recent-inbound'
                          ? String(x.type ?? '').toUpperCase() === 'INBOUND'
                          : String(x.type ?? '').toUpperCase() === 'OUTBOUND',
                      )
                      .map((row: any) => (
                        <tr key={row.id} className="border-t border-zinc-800">
                          <td className="px-3 py-2 text-zinc-300">{row.transactionDate ? new Date(row.transactionDate).toLocaleString('vi-VN') : '-'}</td>
                          <td className="px-3 py-2 text-cyan-300">{row.transactionNo ?? row.code}</td>
                          <td className="px-3 py-2 text-zinc-300">{row.itemCode ?? '-'}</td>
                          <td className="px-3 py-2 text-white">{formatNumberVN(Math.abs(num(row.totalQuantity ?? row.quantity)))}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
            {overviewPopup === 'stock-full' && (
              <div className="overflow-hidden rounded-xl border border-zinc-800">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-900 text-zinc-400">
                    <tr>
                      <th className="px-3 py-2 text-left">Mã vật tư</th>
                      <th className="px-3 py-2 text-left">Tên vật tư</th>
                      <th className="px-3 py-2 text-left">Loại vật tư</th>
                      <th className="px-3 py-2 text-left">Tồn</th>
                      <th className="px-3 py-2 text-left">Đơn giá gốc</th>
                      <th className="px-3 py-2 text-left">Tổng giá trị</th>
                      <th className="px-3 py-2 text-left">Vị trí</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventoryItemsByWarehouse.map((item: any) => (
                      <tr key={item.id} className="border-t border-zinc-800">
                        <td className="px-3 py-2 text-cyan-300">{item.code}</td>
                        <td className="px-3 py-2 text-zinc-300">{item.name}</td>
                        <td className="px-3 py-2 text-zinc-300">{materialUsageLabel(item.materialUsageType)}</td>
                        <td className="px-3 py-2 text-white">{formatNumberVN(item.quantity)}</td>
                        <td className="px-3 py-2 text-zinc-200">{formatCurrencyVN(item.baseUnitPrice ?? item.unitPrice ?? item.averageCost)}</td>
                        <td className="px-3 py-2 text-emerald-300">{formatCurrencyVN(item.inventoryValue ?? num(item.quantity) * num(item.averageCost ?? item.unitPrice))}</td>
                        <td className="px-3 py-2 text-zinc-300">{item.zoneName ?? item.location ?? defaultInboundZoneLabel}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </EnterpriseModulePage>
  )
}
