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
  inventoryPageStack,
  inventoryTableHead,
  inventoryTableRow,
  inventoryTableShell,
} from '../../components/InventoryVisuals'
import { useInventoryTransactions } from '../../hooks/useInventoryTransactions'
import { useZones } from '../../hooks/useZones'
import { formatCurrencyVnd, formatQuantity } from '@/shared/utils/number-format'

function num(v: any) {
  const n = Number(v ?? 0)
  return Number.isFinite(n) ? n : 0
}
function formatCurrency(v: any) {
  return formatCurrencyVnd(num(v))
}

export function InventoryStockTakePage() {
  const { data: zones = [] } = useZones()
  const { data: adjustments = [] } = useInventoryTransactions({ type: 'ADJUSTMENT' })

  const [date, setDate] = useState('')
  const [zoneFilter, setZoneFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [methodFilter, setMethodFilter] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 10

  const rows = useMemo(() => {
    return (adjustments as any[])
      .filter((x: any) => {
        const line = x.items?.[0]
        if (date) {
          const d = new Date(x.transactionDate ?? x.createdAt).toISOString().slice(0, 10)
          if (d !== date) return false
        }
        if (zoneFilter && String(line?.zoneId ?? '') !== zoneFilter) return false
        if (statusFilter && String(x.status ?? 'COMPLETED').toUpperCase() !== statusFilter) return false
        if (methodFilter && String(x.referenceType ?? '') !== methodFilter) return false
        return true
      })
      .sort((a: any, b: any) => +new Date(b.transactionDate ?? b.createdAt) - +new Date(a.transactionDate ?? a.createdAt))
  }, [adjustments, date, zoneFilter, statusFilter, methodFilter])

  const metrics = useMemo(() => {
    const total = rows.length
    const mismatch = rows.filter((x: any) => Math.abs(num(x.items?.[0]?.quantity)) > 0).length
    const matched = Math.max(0, total - mismatch)
    const accuracy = total === 0 ? 100 : (matched / total) * 100
    const varianceValue = rows.reduce((s: number, x: any) => s + Math.abs(num(x.items?.[0]?.totalAmount)), 0)
    return { total, matched, mismatch, accuracy, varianceValue }
  }, [rows])

  const discrepancyByZone = useMemo(() => {
    const m = new Map<string, number>()
    rows.forEach((x: any) => {
      const key = x.items?.[0]?.zone?.code ?? 'NA'
      m.set(key, (m.get(key) ?? 0) + Math.abs(num(x.items?.[0]?.quantity)))
    })
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6)
  }, [rows])

  const methodDist = useMemo(() => {
    const m = new Map<string, number>()
    rows.forEach((x: any) => {
      const key = x.referenceType ?? 'Định kỳ'
      m.set(key, (m.get(key) ?? 0) + 1)
    })
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5)
  }, [rows])

  const accuracySegments = useMemo(() => [
    { label: 'Khớp', value: metrics.matched, color: '#14c987' },
    { label: 'Chênh lệch', value: metrics.mismatch, color: '#f59e0b' },
  ], [metrics.matched, metrics.mismatch])

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize
    return rows.slice(start, start + pageSize)
  }, [rows, page])
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize))

  return (
    <EnterpriseModulePage>
      <InventoryTabWorkspace />

      <div className={inventoryPageStack}>
        <div className={`grid grid-cols-1 xl:grid-cols-5 ${inventoryGridGap}`}>
          <InventoryKpi title="Phiếu kiểm kê" value={formatQuantity(metrics.total, 0)} note="Tổng phiếu" tone="blue" />
          <InventoryKpi title="Khớp" value={formatQuantity(metrics.matched, 0)} note="Không chênh lệch" tone="emerald" />
          <InventoryKpi title="Chênh lệch" value={formatQuantity(metrics.mismatch, 0)} note="Cần xử lý" tone="amber" />
          <InventoryKpi title="Độ chính xác" value={`${metrics.accuracy.toFixed(2)}%`} note="Theo phiếu kiểm kê" tone="cyan" />
          <InventoryKpi title="Giá trị chênh lệch" value={formatCurrency(metrics.varianceValue)} note="Theo giá trị tồn" tone="red" />
        </div>

        <InventoryPanel title="Bộ lọc kiểm kê">
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-6">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inventoryInput} />
            <select value={zoneFilter} onChange={(e) => setZoneFilter(e.target.value)} className={inventoryInput}>
              <option value="">Kho</option>
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
            </select>
            <select value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)} className={inventoryInput}>
              <option value="">Phương pháp</option>
              <option value="Định kỳ">Định kỳ</option>
              <option value="Bất thường">Bất thường</option>
              <option value="Kiểm kê theo khu vực">Kiểm kê theo khu vực</option>
            </select>
          </div>
        </InventoryPanel>

        <div className={`grid grid-cols-1 xl:grid-cols-12 ${inventoryGridGap}`}>
          <InventoryPanel title="Danh sách phiếu kiểm kê" className="xl:col-span-9">
            <div className={`${inventoryTableShell} overflow-auto`}>
              <table className="w-full min-w-[1100px] text-sm">
                <thead className={inventoryTableHead}>
                  <tr>
                    {['Mã kiểm kê', 'Kho', 'Phương pháp', 'Ngày', 'Người tạo', 'Trạng thái', 'Chênh lệch', 'Độ chính xác'].map((h) => (
                      <th key={h} className="px-3 py-3 text-left font-medium">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paged.map((x: any) => (
                    <tr key={x.id} className={inventoryTableRow}>
                      <td className="px-3 py-2 text-cyan-300">{x.transactionNo}</td>
                      <td className="px-3 py-2">{x.items?.[0]?.zone?.code ?? '-'}</td>
                      <td className="px-3 py-2">{x.referenceType ?? 'Định kỳ'}</td>
                      <td className="px-3 py-2">{new Date(x.transactionDate ?? x.createdAt).toLocaleDateString('vi-VN')}</td>
                      <td className="px-3 py-2">{x.createdBy ?? 'Admin'}</td>
                      <td className="px-3 py-2">{String(x.status ?? 'COMPLETED')}</td>
                      <td className={`px-3 py-2 ${num(x.items?.[0]?.quantity) >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>{formatQuantity(num(x.items?.[0]?.quantity), 0)}</td>
                      <td className="px-3 py-2">{metrics.accuracy.toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <InventoryPagination page={page} pageCount={pageCount} total={rows.length} pageSize={pageSize} onPageChange={setPage} />
          </InventoryPanel>

          <div className="space-y-3 xl:col-span-3">
            <InventoryChartCard title="Độ chính xác kiểm kê">
              <CompactDonutSummary segments={accuracySegments} centerValue={`${metrics.accuracy.toFixed(1)}%`} centerLabel="chính xác" />
            </InventoryChartCard>
            <InventoryChartCard title="Chênh lệch theo kho">
              <HorizontalBars rows={discrepancyByZone} valueFormatter={(value) => formatQuantity(value, 0)} />
            </InventoryChartCard>
            <InventoryChartCard title="Phương pháp kiểm kê">
              <HorizontalBars rows={methodDist} valueFormatter={(value) => formatQuantity(value, 0)} />
            </InventoryChartCard>
          </div>
        </div>

      </div>
    </EnterpriseModulePage>
  )
}
