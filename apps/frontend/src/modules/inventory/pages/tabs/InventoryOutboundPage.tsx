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
import { useProjects } from '../../hooks/useProjects'
import { useZones } from '../../hooks/useZones'
import { formatCurrencyVnd, formatQuantity } from '@/shared/utils/number-format'

function num(v: any) {
  const n = Number(v ?? 0)
  return Number.isFinite(n) ? n : 0
}

function formatCurrency(v: any) {
  return formatCurrencyVnd(num(v))
}

export function InventoryOutboundPage() {
  const { data: projects = [] } = useProjects()
  const { data: zones = [] } = useZones()
  const { data: tx = [], isLoading } = useInventoryTransactions({ type: 'OUTBOUND' })

  const [date, setDate] = useState('')
  const [projectId, setProjectId] = useState('')
  const [zoneId, setZoneId] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 10

  const rows = useMemo(() => {
    return (tx as any[])
      .filter((x: any) => {
        const line = x.items?.[0]
        if (date) {
          const d = new Date(x.transactionDate ?? x.createdAt).toISOString().slice(0, 10)
          if (d !== date) return false
        }
        if (projectId && String(x.projectId ?? '') !== projectId) return false
        if (zoneId && String(line?.zoneId ?? '') !== zoneId) return false
        if (search.trim()) {
          const q = search.trim().toLowerCase()
          const text = [x.transactionNo, x.projectName, line?.inventoryItem?.code, line?.inventoryItem?.name, line?.zone?.code].join(' ').toLowerCase()
          if (!text.includes(q)) return false
        }
        return true
      })
      .sort((a: any, b: any) => +new Date(b.transactionDate ?? b.createdAt) - +new Date(a.transactionDate ?? a.createdAt))
  }, [tx, date, projectId, zoneId, search])

  const kpis = useMemo(() => {
    const now = new Date()
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const inMonth = rows.filter((x: any) => String(x.transactionDate ?? x.createdAt).slice(0, 7) === monthKey)
    const qty = inMonth.reduce((s: number, x: any) => s + Math.abs(num(x.items?.[0]?.quantity)), 0)
    const amount = inMonth.reduce((s: number, x: any) => s + Math.abs(num(x.items?.[0]?.totalAmount)), 0)
    const pending = rows.filter((x: any) => String(x.status ?? '').toUpperCase() === 'PENDING').length
    return {
      monthlyQty: qty,
      monthlyAmount: amount,
      docs: inMonth.length,
      pending,
    }
  }, [rows])

  const byZone = useMemo(() => {
    const m = new Map<string, number>()
    rows.forEach((x: any) => {
      const key = x.items?.[0]?.zone?.code ?? 'NA'
      m.set(key, (m.get(key) ?? 0) + Math.abs(num(x.items?.[0]?.quantity)))
    })
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6)
  }, [rows])

  const topMaterials = useMemo(() => {
    const m = new Map<string, { code: string; qty: number }>()
    rows.forEach((x: any) => {
      const line = x.items?.[0]
      const code = line?.inventoryItem?.code ?? 'NA'
      const prev = m.get(code) ?? { code, qty: 0 }
      prev.qty += Math.abs(num(line?.quantity))
      m.set(code, prev)
    })
    return Array.from(m.values()).sort((a, b) => b.qty - a.qty).slice(0, 5)
  }, [rows])

  const zoneSegments = useMemo(() => byZone.map(([label, value], index) => ({
    label,
    value,
    color: ['#1d7cff', '#14c987', '#f59e0b', '#7c3aed', '#ef4444', '#06b6d4'][index % 6],
  })), [byZone])

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize
    return rows.slice(start, start + pageSize)
  }, [rows, page])
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize))

  return (
    <EnterpriseModulePage>
      <InventoryTabWorkspace />

      <div className={inventoryPageStack}>
        <div className={`grid grid-cols-1 xl:grid-cols-4 ${inventoryGridGap}`}>
          <InventoryKpi title="Tổng xuất trong tháng" value={`${formatQuantity(kpis.monthlyQty, 0)} tấn`} note="Theo phiếu xuất" tone="blue" />
          <InventoryKpi title="Giá trị xuất trong tháng" value={formatCurrency(kpis.monthlyAmount)} note="Giá trị đã xuất" tone="emerald" />
          <InventoryKpi title="Số phiếu xuất" value={formatQuantity(kpis.docs, 0)} note="Trong tháng hiện tại" tone="cyan" />
          <InventoryKpi title="Chờ duyệt" value={formatQuantity(kpis.pending, 0)} note="Cần xử lý" tone="amber" />
        </div>

        <InventoryPanel title="Bộ lọc phiếu xuất">
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-6">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inventoryInput} />
            <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className={inventoryInput}>
              <option value="">Đơn vị nhận</option>
              {projects.map((p: any) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <select value={zoneId} onChange={(e) => setZoneId(e.target.value)} className={inventoryInput}>
              <option value="">Kho xuất</option>
              {zones.map((z: any) => (
                <option key={z.id} value={z.id}>
                  {z.code}
                </option>
              ))}
            </select>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm mã phiếu, vật tư, đơn vị nhận..." className={`${inventoryInput} xl:col-span-3`} />
          </div>
        </InventoryPanel>

        <div className={`grid grid-cols-1 xl:grid-cols-12 ${inventoryGridGap}`}>
          <InventoryPanel title="Danh sách phiếu xuất" className="xl:col-span-9">
            <div className={`${inventoryTableShell} overflow-auto`}>
              <table className="w-full min-w-[1100px] text-sm">
                <thead className={inventoryTableHead}>
                  <tr>
                    {['Mã phiếu xuất', 'Ngày xuất', 'Loại xuất', 'Đơn vị nhận', 'Kho xuất', 'Tổng khối lượng', 'Giá trị', 'Trạng thái', 'Người tạo'].map((h) => (
                      <th key={h} className="px-3 py-3 text-left font-medium">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {!isLoading &&
                    paged.map((x: any) => {
                      const line = x.items?.[0]
                      return (
                        <tr key={x.id} className={inventoryTableRow}>
                          <td className="px-3 py-2 text-cyan-300">{x.transactionNo}</td>
                          <td className="px-3 py-2">{new Date(x.transactionDate ?? x.createdAt).toLocaleDateString('vi-VN')}</td>
                          <td className="px-3 py-2">{x.referenceType ?? 'Xuất kho'}</td>
                          <td className="px-3 py-2">{x.projectName ?? '-'}</td>
                          <td className="px-3 py-2">{line?.zone?.code ?? '-'}</td>
                          <td className="px-3 py-2">{formatQuantity(Math.abs(num(line?.quantity)), 0)}</td>
                          <td className="px-3 py-2">{formatCurrency(Math.abs(num(line?.totalAmount)))}</td>
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
            <InventoryChartCard title="Phân bổ xuất theo kho">
              <CompactDonutSummary segments={zoneSegments} centerValue={formatQuantity(kpis.monthlyQty, 0)} centerLabel="tổng xuất" />
            </InventoryChartCard>
            <InventoryChartCard title="Top vật tư xuất">
              <HorizontalBars rows={topMaterials.map((m) => [m.code, m.qty])} valueFormatter={(value) => formatQuantity(value, 0)} />
            </InventoryChartCard>
          </div>
        </div>

      </div>
    </EnterpriseModulePage>
  )
}
