import { useMemo, useState } from 'react'
import { Plus, RefreshCw } from 'lucide-react'

import { EnterpriseModulePage } from '../../../../shared/runtime-tabs/EnterpriseModulePage'
import { ModuleDetailDrawer } from '../../../../shared/ui/modules'
import { InventoryTabWorkspace } from '../../components/InventoryTabWorkspace'
import {
  CompactTrendChart,
  HorizontalBars,
  InventoryChartCard,
  InventoryKpi,
  InventoryPanel,
  inventoryInput,
  inventoryMutedButton,
  inventoryTableHead,
  inventoryTableRow,
  inventoryTableShell,
} from '../../components/InventoryVisuals'
import {
  InventoryAttachmentList,
  InventoryTransactionAttachmentButton,
  InventoryTransactionAttachmentDrawer,
  useInventoryTransactionAttachmentMap,
} from '../../components/InventoryAttachmentPanel'
import { AdjustmentTransactionModal } from '../../components/InventoryTransactionModals'
import { useInventoryItems } from '../../hooks/useInventoryItems'
import { useInventoryTransactions } from '../../hooks/useInventoryTransactions'
import { formatCurrencyVnd, formatDateTime, formatQuantity } from '@/shared/utils/number-format'

const pageSize = 14

function num(value: unknown) {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function transactionItems(transaction?: any | null) {
  return Array.isArray(transaction?.items) ? transaction.items : []
}

function transactionNo(transaction: any) {
  return transaction?.transactionNo ?? transaction?.code ?? '-'
}

function transactionDate(transaction: any) {
  return transaction?.transactionDate ?? transaction?.createdAt
}

function lineQuantity(line: any) {
  return num(line?.quantity)
}

function lineValue(line: any) {
  const quantity = Math.abs(lineQuantity(line))
  const total = line?.totalAmount
  if (total != null) return Math.abs(num(total))
  return quantity * Math.abs(num(line?.unitPrice))
}

function transactionAmount(transaction: any) {
  return transactionItems(transaction).reduce((sum, line) => sum + lineValue(line), 0)
}

function transactionQuantity(transaction: any) {
  return transactionItems(transaction).reduce((sum, line) => sum + lineQuantity(line), 0)
}

function materialLabel(line: any) {
  const material = line?.inventoryItem
  if (!material) return '-'
  return `${material.code ?? ''} ${material.name ? `· ${material.name}` : ''}`.trim()
}

function transactionLineLabels(
  transaction: any,
  select: (line: any) => string,
) {
  const values = Array.from(
    new Set(transactionItems(transaction).map(select).filter((value) => value !== '-')),
  )
  return values.join(', ') || '-'
}

function locationLabel(line: any) {
  const zoneCode = line?.zone?.code ?? line?.zoneCode ?? line?.zoneId
  const slot = line?.slotId
  const level = line?.level
  return [zoneCode, slot, level].filter(Boolean).join(' / ') || '-'
}

function monthKey(date: Date) {
  return date.toISOString().slice(0, 7)
}

function dayLabel(date: Date) {
  return date.toISOString().slice(5, 10)
}

function isToday(value: unknown) {
  if (!value) return false
  return new Date(value as string).toISOString().slice(0, 10) === new Date().toISOString().slice(0, 10)
}

function isThisMonth(value: unknown) {
  if (!value) return false
  return monthKey(new Date(value as string)) === monthKey(new Date())
}

function abnormal(transaction: any) {
  const qty = Math.abs(transactionQuantity(transaction))
  const amount = transactionAmount(transaction)
  return qty >= 100 || amount >= 50_000_000
}

function adjustmentAudit(transaction: any) {
  if (!transaction?.note) return null
  try {
    const parsed = JSON.parse(transaction.note)
    return parsed?.kind === 'INVENTORY_ADJUSTMENT_AUDIT' ? parsed : null
  } catch {
    return null
  }
}

function unitOf(material: any, line?: any) {
  return material?.unitMaster?.symbol ?? material?.unit ?? line?.unit?.symbol ?? line?.inventoryItem?.unit ?? ''
}

function AdjustmentDetailDrawer({
  transaction,
  attachments,
  onClose,
}: {
  transaction: any | null
  attachments: any[]
  onClose: () => void
}) {
  if (!transaction) return null
  const items = transactionItems(transaction)
  const singleLine = items.length === 1 ? items.at(0) : null
  const qty = transactionQuantity(transaction)
  const unit = singleLine ? unitOf(singleLine.inventoryItem, singleLine) : ''
  const varianceValue = transactionAmount(transaction)
  const audit = adjustmentAudit(transaction)

  return (
    <ModuleDetailDrawer open={Boolean(transaction)} title="Chi tiết điều chỉnh" subtitle={transactionNo(transaction)} onClose={onClose} widthClass="max-w-4xl">
      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <MetricBox title="Adjustment No" value={transactionNo(transaction)} />
          <MetricBox title="Material" value={transactionLineLabels(transaction, materialLabel)} />
          <MetricBox title="Location" value={transactionLineLabels(transaction, locationLabel)} />
          <MetricBox title="System Qty" value={singleLine && audit ? `${formatQuantity(audit.systemQty)} ${unit}`.trim() : items.length > 1 ? 'Xem chi tiết từng dòng' : 'Không lưu ở phiếu cũ'} />
          <MetricBox title="Actual Qty" value={singleLine && audit ? `${formatQuantity(audit.actualQty)} ${unit}`.trim() : items.length > 1 ? 'Xem chi tiết từng dòng' : 'Không lưu ở phiếu cũ'} />
          <MetricBox title="Difference" value={`${qty > 0 ? '+' : ''}${formatQuantity(qty)} ${unit}`.trim()} tone={qty >= 0 ? 'text-emerald-300' : 'text-red-300'} />
          <MetricBox title="Variance Value" value={formatCurrencyVnd(varianceValue)} tone="text-cyan-200" />
          <MetricBox title="Reason" value={audit?.reason || transaction?.remarks || '-'} className="md:col-span-2" />
        </div>

        <InventoryPanel title="Vật tư điều chỉnh">
          <div className={`${inventoryTableShell} overflow-auto`}>
            <table className="w-full min-w-[820px] text-sm">
              <thead className={inventoryTableHead}>
                <tr>
                  {['Material', 'Location', 'Difference', 'Unit Price', 'Variance Value'].map((header) => (
                    <th key={header} className="px-3 py-2 text-left font-medium">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transactionItems(transaction).map((item: any) => (
                  <tr key={item.id} className={inventoryTableRow}>
                    <td className="px-3 py-2 font-medium text-white">{materialLabel(item)}</td>
                    <td className="px-3 py-2 text-slate-300">{locationLabel(item)}</td>
                    <td className={`px-3 py-2 ${lineQuantity(item) >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>{lineQuantity(item) > 0 ? '+' : ''}{formatQuantity(lineQuantity(item))} {unitOf(item.inventoryItem, item)}</td>
                    <td className="px-3 py-2 text-slate-300">{formatCurrencyVnd(num(item.unitPrice))}</td>
                    <td className="px-3 py-2 text-cyan-200">{formatCurrencyVnd(lineValue(item))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </InventoryPanel>

        <InventoryPanel title={`Attachments (${formatQuantity(attachments.length, 0)})`}>
          <InventoryAttachmentList attachments={attachments} />
        </InventoryPanel>
      </div>
    </ModuleDetailDrawer>
  )
}

function MetricBox({ title, value, tone = 'text-white', className = '' }: { title: string; value: string; tone?: string; className?: string }) {
  return (
    <div className={`rounded-xl border border-white/10 bg-white/[0.045] p-3 ${className}`}>
      <div className="text-[11px] uppercase tracking-[0.12em] text-slate-500">{title}</div>
      <div className={`mt-1 text-sm font-semibold ${tone}`}>{value}</div>
    </div>
  )
}

export function InventoryAdjustmentsPage() {
  const { data: materials = [] } = useInventoryItems()
  const { data: adjustments = [], isLoading } = useInventoryTransactions({ type: 'ADJUSTMENT' })
  const attachmentMap = useInventoryTransactionAttachmentMap()
  const [dateFilter, setDateFilter] = useState('')
  const [materialFilter, setMaterialFilter] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedAdjustment, setSelectedAdjustment] = useState<any | null>(null)
  const [attachmentDrawer, setAttachmentDrawer] = useState<{ transaction: any; attachments: any[] } | null>(null)

  const filteredAdjustments = useMemo(() => {
    return adjustments.filter((transaction: any) => {
      if (dateFilter && new Date(transactionDate(transaction)).toISOString().slice(0, 10) !== dateFilter) return false
      if (materialFilter && !transactionItems(transaction).some((line) => line.inventoryItemId === materialFilter)) return false
      const haystack = [
        transactionNo(transaction),
        transaction?.remarks,
        transaction?.note,
        ...transactionItems(transaction).flatMap((line) => [line?.inventoryItem?.code, line?.inventoryItem?.name]),
      ].join(' ').toLowerCase()
      return haystack.includes(search.trim().toLowerCase())
    })
  }, [adjustments, dateFilter, materialFilter, search])

  const kpis = useMemo(() => {
    const todayRows = adjustments.filter((transaction: any) => isToday(transactionDate(transaction)))
    const monthRows = adjustments.filter((transaction: any) => isThisMonth(transactionDate(transaction)))
    const monthLines = monthRows.flatMap(transactionItems)
    const increaseQty = monthLines.filter((line) => lineQuantity(line) > 0).reduce((sum, line) => sum + lineQuantity(line), 0)
    const decreaseQty = Math.abs(monthLines.filter((line) => lineQuantity(line) < 0).reduce((sum, line) => sum + lineQuantity(line), 0))
    const netAdjustment = monthLines.reduce((sum, line) => sum + lineQuantity(line), 0)
    return {
      today: todayRows.length,
      month: monthRows.length,
      increaseQty,
      decreaseQty,
      netAdjustment,
      abnormal: monthRows.filter(abnormal).length,
    }
  }, [adjustments])

  const trendRows = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - index))
      return date
    })
    return days.map((date) => ({
      label: dayLabel(date),
      value: adjustments.filter((transaction: any) => new Date(transactionDate(transaction)).toISOString().slice(0, 10) === date.toISOString().slice(0, 10)).length,
    }))
  }, [adjustments])

  const topMaterials = useMemo(() => {
    const map = new Map<string, number>()
    filteredAdjustments.forEach((transaction: any) => {
      transactionItems(transaction).forEach((line) => {
        const label = line?.inventoryItem?.code ?? line?.inventoryItem?.name ?? 'N/A'
        map.set(label, (map.get(label) ?? 0) + Math.abs(lineQuantity(line)))
      })
    })
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6)
  }, [filteredAdjustments])

  const topLocations = useMemo(() => {
    const map = new Map<string, number>()
    filteredAdjustments.forEach((transaction: any) => {
      transactionItems(transaction).forEach((line) => {
        const label = locationLabel(line)
        map.set(label, (map.get(label) ?? 0) + Math.abs(lineQuantity(line)))
      })
    })
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6)
  }, [filteredAdjustments])

  const financialImpact = useMemo(() => {
    const increase = filteredAdjustments.flatMap(transactionItems).filter((line) => lineQuantity(line) > 0).reduce((sum, line) => sum + lineValue(line), 0)
    const decrease = filteredAdjustments.flatMap(transactionItems).filter((line) => lineQuantity(line) < 0).reduce((sum, line) => sum + lineValue(line), 0)
    return [
      ['Tăng tồn', increase],
      ['Giảm tồn', decrease],
      ['Net impact', increase - decrease],
    ] as Array<[string, number]>
  }, [filteredAdjustments])

  const pageCount = Math.max(1, Math.ceil(filteredAdjustments.length / pageSize))
  const safePage = Math.min(page, pageCount)
  const pageRows = filteredAdjustments.slice((safePage - 1) * pageSize, safePage * pageSize)

  return (
    <EnterpriseModulePage>
      <InventoryTabWorkspace />

      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <InventoryKpi title="Adjustment Today" value={formatQuantity(kpis.today, 0)} note="Phiếu trong ngày" tone="blue" />
          <InventoryKpi title="Adjustment Month" value={formatQuantity(kpis.month, 0)} note="Phiếu trong tháng" tone="cyan" />
          <InventoryKpi title="Increase Qty" value={formatQuantity(kpis.increaseQty)} note="Tăng tồn" tone="emerald" />
          <InventoryKpi title="Decrease Qty" value={formatQuantity(kpis.decreaseQty)} note="Giảm tồn" tone="amber" />
          <InventoryKpi title="Net Adjustment" value={formatQuantity(kpis.netAdjustment)} note="Tăng - giảm" tone={kpis.netAdjustment >= 0 ? 'emerald' : 'red'} />
          <InventoryKpi title="Abnormal" value={formatQuantity(kpis.abnormal, 0)} note="Cần rà soát" tone="red" />
        </div>

        <div className="grid gap-3 xl:grid-cols-4">
          <InventoryChartCard title="Adjustment Trend" note="7 ngày gần nhất">
            <CompactTrendChart rows={trendRows} />
          </InventoryChartCard>
          <InventoryChartCard title="Top Variance Materials" note="Theo số lượng chênh lệch">
            <HorizontalBars rows={topMaterials} valueFormatter={(value) => formatQuantity(value)} />
          </InventoryChartCard>
          <InventoryChartCard title="Top Variance Locations" note="Zone / Slot / Level">
            <HorizontalBars rows={topLocations} valueFormatter={(value) => formatQuantity(value)} />
          </InventoryChartCard>
          <InventoryChartCard title="Financial Impact" note="Giá trị chênh lệch">
            <HorizontalBars rows={financialImpact} valueFormatter={formatCurrencyVnd} />
          </InventoryChartCard>
        </div>

        <InventoryPanel>
          <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
            <div className="grid flex-1 gap-3 md:grid-cols-3">
              <label className="space-y-1">
                <span className="text-xs font-medium text-slate-400">Tìm kiếm</span>
                <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} placeholder="Mã phiếu, vật tư, lý do..." className={inventoryInput} />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-medium text-slate-400">Ngày</span>
                <input type="date" value={dateFilter} onChange={(event) => { setDateFilter(event.target.value); setPage(1) }} className={inventoryInput} />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-medium text-slate-400">Vật tư</span>
                <select value={materialFilter} onChange={(event) => { setMaterialFilter(event.target.value); setPage(1) }} className={inventoryInput}>
                  <option value="">Tất cả vật tư</option>
                  {materials.map((item: any) => <option key={item.id} value={item.id}>{item.code} · {item.name}</option>)}
                </select>
              </label>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => { setSearch(''); setDateFilter(''); setMaterialFilter(''); setPage(1) }} className={inventoryMutedButton}>
                <RefreshCw size={15} />
                Làm mới lọc
              </button>
              <button type="button" onClick={() => setCreateOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500">
                <Plus size={16} />
                Điều chỉnh tồn kho
              </button>
            </div>
          </div>

          <div className={`${inventoryTableShell} overflow-auto`}>
            <table className="w-full min-w-[1080px] text-sm">
              <thead className={inventoryTableHead}>
                <tr>
                  {['Adjustment No', 'Ngày', 'Material', 'Location', 'Difference', 'Variance Value', 'Reason', 'Hồ sơ'].map((header) => (
                    <th key={header} className="px-3 py-2 text-left font-medium">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-3 py-8 text-center text-sm text-slate-500">Đang tải phiếu điều chỉnh...</td>
                  </tr>
                ) : pageRows.length ? (
                  pageRows.map((transaction: any) => {
                    const qty = transactionQuantity(transaction)
                    return (
                      <tr key={transaction.id} className={`${inventoryTableRow} cursor-pointer`} onClick={() => setSelectedAdjustment(transaction)}>
                        <td className="px-3 py-2 font-semibold text-cyan-200">{transactionNo(transaction)}</td>
                        <td className="px-3 py-2 text-slate-300">{formatDateTime(transactionDate(transaction))}</td>
                        <td className="px-3 py-2 text-white">{transactionLineLabels(transaction, materialLabel)}</td>
                        <td className="px-3 py-2 text-slate-300">{transactionLineLabels(transaction, locationLabel)}</td>
                        <td className={`px-3 py-2 font-semibold ${qty >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>{qty > 0 ? '+' : ''}{formatQuantity(qty)} {transactionItems(transaction).length === 1 ? unitOf(transactionItems(transaction).at(0)?.inventoryItem, transactionItems(transaction).at(0)) : ''}</td>
                        <td className="px-3 py-2 text-cyan-200">{formatCurrencyVnd(transactionAmount(transaction))}</td>
                        <td className="max-w-[280px] truncate px-3 py-2 text-slate-300">{transaction?.remarks || transaction?.note || '-'}</td>
                        <td className="px-3 py-2">
                          <InventoryTransactionAttachmentButton
                            transaction={transaction}
                            attachmentMap={attachmentMap}
                            onOpen={(attachments) => setAttachmentDrawer({ transaction, attachments })}
                          />
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="px-3 py-8 text-center text-sm text-slate-500">Không có phiếu điều chỉnh phù hợp.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-white/10 px-4 py-3 text-xs text-slate-400">
            <span>Hiển thị {filteredAdjustments.length ? (safePage - 1) * pageSize + 1 : 0}-{Math.min(safePage * pageSize, filteredAdjustments.length)} / {formatQuantity(filteredAdjustments.length, 0)} phiếu</span>
            <div className="flex gap-2">
              <button disabled={safePage <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className={inventoryMutedButton}>Trước</button>
              <button disabled={safePage >= pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))} className={inventoryMutedButton}>Sau</button>
            </div>
          </div>
        </InventoryPanel>
      </div>

      <AdjustmentTransactionModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <AdjustmentDetailDrawer
        transaction={selectedAdjustment}
        attachments={selectedAdjustment ? Array.from(new Set([selectedAdjustment.id, transactionNo(selectedAdjustment)]).values()).flatMap((key) => attachmentMap.get(String(key)) ?? []) : []}
        onClose={() => setSelectedAdjustment(null)}
      />
      <InventoryTransactionAttachmentDrawer
        open={Boolean(attachmentDrawer)}
        transaction={attachmentDrawer?.transaction}
        attachments={attachmentDrawer?.attachments ?? []}
        onClose={() => setAttachmentDrawer(null)}
      />
    </EnterpriseModulePage>
  )
}
