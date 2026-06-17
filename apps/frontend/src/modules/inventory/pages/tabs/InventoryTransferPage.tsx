import { useMemo, useState } from 'react'

import { EnterpriseModulePage } from '../../../../shared/runtime-tabs/EnterpriseModulePage'
import { InventoryTabWorkspace } from '../../components/InventoryTabWorkspace'
import {
  CompactDonutSummary,
  HorizontalBars,
  InventoryChartCard,
  InventoryKpi,
  InventoryPagination,
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
import { useInventoryTransactions } from '../../hooks/useInventoryTransactions'
import { useZones } from '../../hooks/useZones'
import { formatCurrencyVnd, formatDateTime, formatQuantity } from '@/shared/utils/number-format'

function num(v: any) {
  const n = Number(v ?? 0)
  return Number.isFinite(n) ? n : 0
}
function formatCurrency(v: any) {
  return formatCurrencyVnd(num(v))
}

export function InventoryTransferPage() {
  const { data: materials = [] } = useInventoryItems()
  const { data: zones = [] } = useZones()
  const { data: tx = [], isLoading } = useInventoryTransactions({ type: 'TRANSFER' })

  const [date, setDate] = useState('')
  const [materialFilter, setMaterialFilter] = useState('')
  const [fromZoneFilter, setFromZoneFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 10

  const rows = useMemo(() => {
    return (tx as any[])
      .filter((x: any) => {
        const outboundLine = x.items?.find((line: any) => num(line.quantity) < 0)
        if (date) {
          const d = new Date(x.transactionDate ?? x.createdAt).toISOString().slice(0, 10)
          if (d !== date) return false
        }
        if (materialFilter && !x.items?.some((line: any) => String(line.inventoryItemId) === materialFilter)) return false
        if (fromZoneFilter && String(outboundLine?.zoneId ?? '') !== fromZoneFilter) return false
        if (statusFilter && String(x.status ?? 'COMPLETED').toUpperCase() !== statusFilter) return false
        return true
      })
      .sort((a: any, b: any) => +new Date(b.transactionDate ?? b.createdAt) - +new Date(a.transactionDate ?? a.createdAt))
  }, [tx, date, materialFilter, fromZoneFilter, statusFilter])

  const kpis = useMemo(() => {
    const total = rows.length
    const pending = rows.filter((x: any) => String(x.status ?? '').toUpperCase() === 'PENDING').length
    const done = rows.filter((x: any) => String(x.status ?? 'COMPLETED').toUpperCase() === 'COMPLETED').length
    const cancelled = rows.filter((x: any) => String(x.status ?? '').toUpperCase() === 'CANCELLED').length
    const monthlyValue = rows.reduce((s: number, x: any) => s + Math.abs(num(x.items?.[0]?.totalAmount)), 0)
    return { total, pending, done, cancelled, monthlyValue }
  }, [rows])

  const zoneValue = useMemo(() => {
    const m = new Map<string, number>()
    rows.forEach((x: any) => {
      const out = x.items?.find((line: any) => num(line.quantity) < 0)
      const key = out?.zone?.code ?? 'NA'
      m.set(key, (m.get(key) ?? 0) + Math.abs(num(out?.totalAmount)))
    })
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6)
  }, [rows])

  const transferTypes = useMemo(() => {
    const m = new Map<string, number>()
    rows.forEach((x: any) => {
      const t = x.referenceType ?? 'Điều chuyển nội bộ'
      m.set(t, (m.get(t) ?? 0) + 1)
    })
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5)
  }, [rows])

  const transferSegments = useMemo(() => [
    { label: 'Hoàn thành', value: kpis.done, color: '#14c987' },
    { label: 'Đang thực hiện', value: kpis.pending, color: '#f59e0b' },
    { label: 'Đã hủy', value: kpis.cancelled, color: '#ef4444' },
  ], [kpis.done, kpis.pending, kpis.cancelled])

  const recentActivities = useMemo(() => rows.slice(0, 5), [rows])

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize
    return rows.slice(start, start + pageSize)
  }, [rows, page])
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize))

  return (
    <EnterpriseModulePage>
      <InventoryTabWorkspace />

      <div className={inventoryPageStack}>
        <div className={`grid grid-cols-1 xl:grid-cols-6 ${inventoryGridGap}`}>
          <InventoryKpi title="Tổng phiếu điều chuyển" value={formatQuantity(kpis.total, 0)} note="Tất cả phiếu" tone="blue" />
          <InventoryKpi title="Đang thực hiện" value={formatQuantity(kpis.pending, 0)} note="Chờ hoàn tất" tone="amber" />
          <InventoryKpi title="Hoàn thành" value={formatQuantity(kpis.done, 0)} note="Đã ghi nhận" tone="emerald" />
          <InventoryKpi title="Đã hủy" value={formatQuantity(kpis.cancelled, 0)} note="Không hợp lệ" tone="red" />
          <InventoryKpi title="Giá trị điều chuyển" value={formatCurrency(kpis.monthlyValue)} note="Theo giá trị xuất" tone="cyan" />
          <InventoryKpi title="Tỷ lệ hoàn tất" value={`${kpis.total ? ((kpis.done / kpis.total) * 100).toFixed(1) : '0.0'}%`} note="Phiếu hoàn thành" tone="purple" />
        </div>

        <InventoryPanel title="Bộ lọc điều chuyển">
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-5">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inventoryInput} />
            <select value={materialFilter} onChange={(e) => setMaterialFilter(e.target.value)} className={inventoryInput}>
              <option value="">Vật tư</option>
              {materials.map((m: any) => (
                <option key={m.id} value={m.id}>
                  {m.code} - {m.name}
                </option>
              ))}
            </select>
            <select value={fromZoneFilter} onChange={(e) => setFromZoneFilter(e.target.value)} className={inventoryInput}>
              <option value="">Kho xuất</option>
              {zones.map((z: any) => (
                <option key={z.id} value={z.id}>
                  {z.code}
                </option>
              ))}
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={inventoryInput}>
              <option value="">Trạng thái</option>
              <option value="COMPLETED">Hoàn thành</option>
              <option value="PENDING">Đang thực hiện</option>
              <option value="CANCELLED">Đã hủy</option>
            </select>
            <button
              onClick={() => {
                setDate('')
                setMaterialFilter('')
                setFromZoneFilter('')
                setStatusFilter('')
              }}
              className={`${inventoryMutedButton} h-10`}
            >
              Làm mới
            </button>
          </div>
        </InventoryPanel>

        <div className={`grid grid-cols-1 xl:grid-cols-12 ${inventoryGridGap}`}>
          <InventoryPanel title="Danh sách phiếu điều chuyển" className="xl:col-span-9">
            <div className={`${inventoryTableShell} overflow-auto`}>
              <table className="w-full min-w-[1100px] text-sm">
                <thead className={inventoryTableHead}>
                  <tr>
                    {['Mã phiếu', 'Ngày tạo', 'Kho xuất', 'Kho nhập', 'Loại điều chuyển', 'Số lượng', 'Giá trị', 'Trạng thái', 'Người tạo'].map((h) => (
                      <th key={h} className="px-3 py-3 text-left font-medium">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {!isLoading &&
                    paged.map((x: any) => {
                      const out = x.items?.find((line: any) => num(line.quantity) < 0)
                      const input = x.items?.find((line: any) => num(line.quantity) > 0)
                      return (
                        <tr key={x.id} className={inventoryTableRow}>
                          <td className="px-3 py-2 text-cyan-300">{x.transactionNo}</td>
                          <td className="px-3 py-2">{new Date(x.transactionDate ?? x.createdAt).toLocaleDateString('vi-VN')}</td>
                          <td className="px-3 py-2">{out?.zone?.code ?? '-'}</td>
                          <td className="px-3 py-2">{input?.zone?.code ?? '-'}</td>
                          <td className="px-3 py-2">{x.referenceType ?? 'Điều chuyển nội bộ'}</td>
                          <td className="px-3 py-2">{formatQuantity(Math.abs(num(out?.quantity)), 0)}</td>
                          <td className="px-3 py-2">{formatCurrency(Math.abs(num(out?.totalAmount)))}</td>
                          <td className="px-3 py-2">
                            <span className="rounded border border-emerald-700/60 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-300">{String(x.status ?? 'COMPLETED')}</span>
                          </td>
                          <td className="px-3 py-2">{x.createdBy ?? 'Admin'}</td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
            <InventoryPagination page={page} pageCount={pageCount} total={rows.length} pageSize={pageSize} onPageChange={setPage} />
          </InventoryPanel>

          <div className="space-y-3 xl:col-span-3">
            <InventoryChartCard title="Tổng quan điều chuyển">
              <CompactDonutSummary segments={transferSegments} centerValue={formatQuantity(kpis.total, 0)} centerLabel="phiếu" />
            </InventoryChartCard>
            <InventoryChartCard title="Giá trị điều chuyển theo kho">
              <HorizontalBars rows={zoneValue} valueFormatter={formatCurrency} />
            </InventoryChartCard>
            <InventoryChartCard title="Hoạt động gần đây">
              {recentActivities.map((x: any) => (
                <div key={x.id} className="mb-2 rounded border border-white/10 p-2 text-xs text-slate-300">
                  <div className="text-cyan-300">{x.transactionNo}</div>
                  <div>{formatDateTime(x.transactionDate ?? x.createdAt)}</div>
                </div>
              ))}
            </InventoryChartCard>
          </div>
        </div>

      </div>
    </EnterpriseModulePage>
  )
}
