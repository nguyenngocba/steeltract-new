import { useMemo, useState } from 'react'

import { EnterpriseModulePage } from '../../../../shared/runtime-tabs/EnterpriseModulePage'
import { SectionHeader } from '../../../../shared/ui/enterprise'
import { InventoryTabWorkspace } from '../../components/InventoryTabWorkspace'
import {
  InventoryInsightPanel,
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
import { useInventoryItems } from '../../hooks/useInventoryItems'
import { useProjects } from '../../hooks/useProjects'
import { useSuppliers } from '../../hooks/useSuppliers'
import { useZones } from '../../hooks/useZones'

function num(v: any) {
  const n = Number(v ?? 0)
  return Number.isFinite(n) ? n : 0
}
function formatCurrency(v: any) {
  return `${Math.round(num(v)).toLocaleString('vi-VN')} đ`
}

export function InventoryTransactionsPage() {
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [supplierId, setSupplierId] = useState('')
  const [projectId, setProjectId] = useState('')
  const [type, setType] = useState('')
  const [zoneId, setZoneId] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 10

  const { data: transactions = [], isLoading } = useInventoryTransactions({
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
    supplierId: supplierId || undefined,
    projectId: projectId || undefined,
    type: type || undefined,
  })
  const { data: suppliers = [] } = useSuppliers()
  const { data: projects = [] } = useProjects()
  const { data: zones = [] } = useZones()
  const { data: materials = [] } = useInventoryItems()

  const rows = useMemo(() => {
    return (transactions as any[])
      .filter((x: any) => {
        if (zoneId && !x.items?.some((line: any) => String(line.zoneId ?? '') === zoneId)) return false
        return true
      })
      .sort((a: any, b: any) => +new Date(b.transactionDate ?? b.createdAt) - +new Date(a.transactionDate ?? a.createdAt))
  }, [transactions, zoneId])

  const kpis = useMemo(() => {
    const total = rows.length
    const inbound = rows.filter((x: any) => String(x.type).toUpperCase() === 'INBOUND').length
    const outbound = rows.filter((x: any) => String(x.type).toUpperCase() === 'OUTBOUND').length
    const transfer = rows.filter((x: any) => String(x.type).toUpperCase() === 'TRANSFER').length
    const stockTake = rows.filter((x: any) => String(x.type).toUpperCase() === 'ADJUSTMENT').length
    return { total, inbound, outbound, transfer, stockTake }
  }, [rows])

  const byType = useMemo(() => {
    const m = new Map<string, number>()
    rows.forEach((x: any) => {
      const t = String(x.type ?? '').toUpperCase()
      m.set(t, (m.get(t) ?? 0) + 1)
    })
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1])
  }, [rows])

  const dailyLoad = useMemo(() => {
    const m = new Map<string, number>()
    rows.forEach((x: any) => {
      const key = new Date(x.transactionDate ?? x.createdAt).toISOString().slice(0, 10)
      m.set(key, (m.get(key) ?? 0) + 1)
    })
    return Array.from(m.entries()).sort((a, b) => a[0].localeCompare(b[0])).slice(-10)
  }, [rows])

  const recent = useMemo(() => rows.slice(0, 6), [rows])

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize
    return rows.slice(start, start + pageSize)
  }, [rows, page])
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize))

  function exportCsv() {
    const headers = ['transactionNo', 'type', 'material', 'zone', 'quantity', 'unitPrice', 'totalAmount', 'supplier', 'project', 'date']
    const lines = rows.map((x: any) => {
      const line = x.items?.[0]
      return [
        x.transactionNo ?? '',
        x.type ?? '',
        `${line?.inventoryItem?.code ?? ''} ${line?.inventoryItem?.name ?? ''}`.trim(),
        line?.zone?.code ?? '',
        String(num(line?.quantity)),
        String(num(line?.unitPrice)),
        String(num(line?.totalAmount)),
        x.supplierName ?? '',
        x.projectName ?? '',
        new Date(x.transactionDate ?? x.createdAt).toISOString(),
      ]
    })
    const csv = [headers.join(','), ...lines.map((line) => line.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `inventory-transactions-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <EnterpriseModulePage>
      <SectionHeader title="Lịch sử giao dịch" description="Toàn bộ luồng nhập/xuất/điều chuyển/kiểm kê theo thời gian thực." />
      <InventoryTabWorkspace />

      <div className={inventoryPageStack}>
        <div className={`grid grid-cols-1 xl:grid-cols-5 ${inventoryGridGap}`}>
          <InventoryKpi title="Tổng giao dịch" value={kpis.total.toLocaleString('vi-VN')} note="Theo bộ lọc" tone="blue" />
          <InventoryKpi title="Nhập kho" value={kpis.inbound.toLocaleString('vi-VN')} note="Phiếu nhập" tone="emerald" />
          <InventoryKpi title="Xuất kho" value={kpis.outbound.toLocaleString('vi-VN')} note="Phiếu xuất" tone="amber" />
          <InventoryKpi title="Điều chuyển" value={kpis.transfer.toLocaleString('vi-VN')} note="Nội bộ kho" tone="cyan" />
          <InventoryKpi title="Kiểm kê" value={kpis.stockTake.toLocaleString('vi-VN')} note="Điều chỉnh tồn" tone="purple" />
        </div>

        <InventoryPanel title="Bộ lọc giao dịch">
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-7">
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className={inventoryInput} />
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className={inventoryInput} />
            <select value={type} onChange={(e) => setType(e.target.value)} className={inventoryInput}>
              <option value="">Loại giao dịch</option>
              <option value="INBOUND">INBOUND</option>
              <option value="OUTBOUND">OUTBOUND</option>
              <option value="TRANSFER">TRANSFER</option>
              <option value="ADJUSTMENT">ADJUSTMENT</option>
              <option value="RETURN">RETURN</option>
            </select>
            <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className={inventoryInput}>
              <option value="">Nhà cung cấp</option>
              {suppliers.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className={inventoryInput}>
              <option value="">Công trình</option>
              {projects.map((p: any) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <select value={zoneId} onChange={(e) => setZoneId(e.target.value)} className={inventoryInput}>
              <option value="">Kho</option>
              {zones.map((z: any) => (
                <option key={z.id} value={z.id}>
                  {z.code}
                </option>
              ))}
            </select>
            <button onClick={exportCsv} className="h-10 rounded-lg bg-blue-600 px-3 text-sm font-medium text-white">
              Xuất CSV
            </button>
          </div>
        </InventoryPanel>

        <div className={`grid grid-cols-1 xl:grid-cols-12 ${inventoryGridGap}`}>
          <InventoryPanel title="Lịch sử giao dịch" className="xl:col-span-9">
            <div className={`${inventoryTableShell} overflow-auto`}>
              <table className="w-full min-w-[1280px] text-sm">
                <thead className={inventoryTableHead}>
                  <tr>
                    {['Thời gian', 'Loại', 'Số chứng từ', 'Mã vật tư', 'Tên vật tư', 'Kho', 'Số lượng', 'Đơn giá', 'Giá trị', 'Đối tượng', 'Người tạo', 'Trạng thái'].map((h) => (
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
                          <td className="px-3 py-2">{new Date(x.transactionDate ?? x.createdAt).toLocaleString('vi-VN')}</td>
                          <td className="px-3 py-2">{x.type}</td>
                          <td className="px-3 py-2 text-cyan-300">{x.transactionNo}</td>
                          <td className="px-3 py-2">{line?.inventoryItem?.code ?? '-'}</td>
                          <td className="px-3 py-2">{line?.inventoryItem?.name ?? '-'}</td>
                          <td className="px-3 py-2">{line?.zone?.code ?? '-'}</td>
                          <td className="px-3 py-2">{Math.abs(num(line?.quantity)).toLocaleString('vi-VN')}</td>
                          <td className="px-3 py-2">{formatCurrency(line?.unitPrice)}</td>
                          <td className="px-3 py-2">{formatCurrency(Math.abs(num(line?.totalAmount)))}</td>
                          <td className="px-3 py-2">{x.supplierName ?? x.projectName ?? '-'}</td>
                          <td className="px-3 py-2">{x.createdBy ?? 'Admin'}</td>
                          <td className="px-3 py-2">{x.status ?? 'COMPLETED'}</td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
            <InventoryPagination page={page} pageCount={pageCount} total={rows.length} pageSize={pageSize} onPageChange={setPage} />
          </InventoryPanel>

          <div className="space-y-5 xl:col-span-3">
            <InventoryInsightPanel title="Thống kê giao dịch">
              {byType.map(([t, c]) => (
                <div key={t} className="mb-2 flex items-center justify-between text-sm text-slate-300">
                  <span>{t}</span>
                  <span>{c}</span>
                </div>
              ))}
            </InventoryInsightPanel>
            <InventoryInsightPanel title="Giao dịch theo ngày">
              <div className="space-y-2">
                {dailyLoad.map(([d, c]) => (
                  <div key={d} className="grid grid-cols-[1fr_auto] items-center gap-2 text-xs text-slate-300">
                    <span>{d.slice(5)}</span>
                    <span>{c}</span>
                  </div>
                ))}
              </div>
            </InventoryInsightPanel>
            <InventoryInsightPanel title="Giao dịch gần đây">
              {recent.map((x: any) => (
                <div key={x.id} className="mb-2 rounded border border-white/10 p-2 text-xs text-slate-300">
                  <div className="text-cyan-300">{x.transactionNo}</div>
                  <div>{x.type}</div>
                </div>
              ))}
            </InventoryInsightPanel>
          </div>
        </div>
      </div>
    </EnterpriseModulePage>
  )
}
