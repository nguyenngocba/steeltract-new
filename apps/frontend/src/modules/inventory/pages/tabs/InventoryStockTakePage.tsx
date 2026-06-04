import { useMemo, useState } from 'react'

import { EnterpriseModulePage } from '../../../../shared/runtime-tabs/EnterpriseModulePage'
import { EnterpriseTabBar } from '../../../../shared/runtime-tabs/EnterpriseTabBar'
import { SectionHeader } from '../../../../shared/ui/enterprise'
import { inventoryTabs } from '../../config/inventory-tabs'
import { useCreateTransaction } from '../../hooks/useCreateTransaction'
import { useInventoryItems } from '../../hooks/useInventoryItems'
import { useInventoryTransactions } from '../../hooks/useInventoryTransactions'
import { useZones } from '../../hooks/useZones'

function num(v: any) {
  const n = Number(v ?? 0)
  return Number.isFinite(n) ? n : 0
}
function formatCurrency(v: any) {
  return `${Math.round(num(v)).toLocaleString('vi-VN')} đ`
}

type CountLine = {
  inventoryItemId: string
  physicalQty: string
  zoneId: string
}

export function InventoryStockTakePage() {
  const { data: materials = [] } = useInventoryItems()
  const { data: zones = [] } = useZones()
  const { data: adjustments = [] } = useInventoryTransactions({ type: 'ADJUSTMENT' })
  const createTx = useCreateTransaction()

  const [date, setDate] = useState('')
  const [zoneFilter, setZoneFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [methodFilter, setMethodFilter] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 10

  const [sessionNo, setSessionNo] = useState(`KK-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 900 + 100)}`)
  const [countRows, setCountRows] = useState<CountLine[]>([])

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

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize
    return rows.slice(start, start + pageSize)
  }, [rows, page])
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize))

  const countSheet = useMemo(() => {
    return countRows.map((row) => {
      const item = materials.find((x: any) => x.id === row.inventoryItemId) as any
      const systemQty = num(item?.quantity)
      const physical = num(row.physicalQty)
      return {
        ...row,
        item,
        systemQty,
        difference: physical - systemQty,
      }
    })
  }, [countRows, materials])

  async function submitCount() {
    const items = countSheet
      .filter((x) => x.item && x.difference !== 0)
      .map((x) => ({
        inventoryItemId: x.inventoryItemId,
        zoneId: x.zoneId || undefined,
        quantity: x.difference,
      }))
    if (items.length === 0) return
    await createTx.mutateAsync({
      type: 'ADJUSTMENT',
      transactionNo: sessionNo,
      referenceType: methodFilter || 'Định kỳ',
      items,
    })
    setCountRows([])
    setSessionNo(`KK-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 900 + 100)}`)
  }

  return (
    <EnterpriseModulePage>
      <SectionHeader title="Kiểm kê kho vật tư" description="Đối soát số lượng thực tế với hệ thống và ghi nhận chênh lệch." />
      <EnterpriseTabBar tabs={inventoryTabs} />

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-6">
          <KpiCard title="Phiếu kiểm kê" value={metrics.total.toLocaleString('vi-VN')} />
          <KpiCard title="Khớp" value={metrics.matched.toLocaleString('vi-VN')} />
          <KpiCard title="Chênh lệch" value={metrics.mismatch.toLocaleString('vi-VN')} />
          <KpiCard title="Độ chính xác" value={`${metrics.accuracy.toFixed(2)}%`} />
          <KpiCard title="Giá trị chênh lệch" value={formatCurrency(metrics.varianceValue)} className="xl:col-span-2" />
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.055] shadow-[0_18px_44px_rgba(0,0,0,0.18)] backdrop-blur-xl p-3">
          <div className="grid grid-cols-1 gap-2 xl:grid-cols-6">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-10 rounded-lg border border-white/10 bg-white/[0.06] px-3 text-sm text-slate-100" />
            <select value={zoneFilter} onChange={(e) => setZoneFilter(e.target.value)} className="h-10 rounded-lg border border-white/10 bg-white/[0.06] px-3 text-sm text-slate-100">
              <option value="">Kho</option>
              {zones.map((z: any) => (
                <option key={z.id} value={z.id}>
                  {z.code}
                </option>
              ))}
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-10 rounded-lg border border-white/10 bg-white/[0.06] px-3 text-sm text-slate-100">
              <option value="">Trạng thái</option>
              <option value="COMPLETED">Hoàn thành</option>
              <option value="PENDING">Đang thực hiện</option>
            </select>
            <select value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)} className="h-10 rounded-lg border border-white/10 bg-white/[0.06] px-3 text-sm text-slate-100">
              <option value="">Phương pháp</option>
              <option value="Định kỳ">Định kỳ</option>
              <option value="Bất thường">Bất thường</option>
              <option value="Kiểm kê theo khu vực">Kiểm kê theo khu vực</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <div className="xl:col-span-9 rounded-xl border border-white/10 bg-white/[0.055] shadow-[0_18px_44px_rgba(0,0,0,0.18)] backdrop-blur-xl">
            <div className="border-b border-white/10 px-4 py-3 text-sm font-semibold text-white">Danh sách phiếu kiểm kê</div>
            <div className="overflow-auto">
              <table className="w-full min-w-[1100px] text-sm">
                <thead className="bg-white/[0.06] text-xs uppercase text-slate-400">
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
                    <tr key={x.id} className="border-t border-white/10 text-slate-200 hover:bg-white/[0.06]">
                      <td className="px-3 py-2 text-cyan-300">{x.transactionNo}</td>
                      <td className="px-3 py-2">{x.items?.[0]?.zone?.code ?? '-'}</td>
                      <td className="px-3 py-2">{x.referenceType ?? 'Định kỳ'}</td>
                      <td className="px-3 py-2">{new Date(x.transactionDate ?? x.createdAt).toLocaleDateString('vi-VN')}</td>
                      <td className="px-3 py-2">{x.createdBy ?? 'Admin'}</td>
                      <td className="px-3 py-2">{String(x.status ?? 'COMPLETED')}</td>
                      <td className={`px-3 py-2 ${num(x.items?.[0]?.quantity) >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>{num(x.items?.[0]?.quantity).toLocaleString('vi-VN')}</td>
                      <td className="px-3 py-2">{metrics.accuracy.toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-white/10 px-4 py-3 text-xs text-slate-400">
              <div>
                Hiển thị {rows.length === 0 ? 0 : (page - 1) * pageSize + 1} - {Math.min(page * pageSize, rows.length)} / {rows.length}
              </div>
              <div className="flex items-center gap-2">
                <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded border border-white/10 px-2 py-1 disabled:opacity-40">
                  Trước
                </button>
                <span>
                  {page}/{pageCount}
                </span>
                <button disabled={page >= pageCount} onClick={() => setPage((p) => Math.min(pageCount, p + 1))} className="rounded border border-white/10 px-2 py-1 disabled:opacity-40">
                  Sau
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4 xl:col-span-3">
            <InsightPanel title="Giá trị chênh lệch theo kho">
              {discrepancyByZone.map(([z, q]) => (
                <div key={z} className="mb-2 flex items-center justify-between text-sm text-slate-300">
                  <span>{z}</span>
                  <span>{q.toLocaleString('vi-VN')}</span>
                </div>
              ))}
            </InsightPanel>
            <InsightPanel title="Phương pháp kiểm kê">
              {methodDist.map(([m, c]) => (
                <div key={m} className="mb-2 flex items-center justify-between text-sm text-slate-300">
                  <span>{m}</span>
                  <span>{c}</span>
                </div>
              ))}
            </InsightPanel>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.055] shadow-[0_18px_44px_rgba(0,0,0,0.18)] backdrop-blur-xl p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-semibold text-white">Chi tiết chênh lệch kiểm kê</div>
            <button
              onClick={() => setCountRows((prev) => [...prev, { inventoryItemId: '', physicalQty: '', zoneId: '' }])}
              className="rounded border border-white/10 px-3 py-1.5 text-xs text-slate-200"
            >
              + Thêm dòng
            </button>
          </div>

          <div className="overflow-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead className="bg-white/[0.06] text-xs uppercase text-slate-400">
                <tr>
                  {['Vật tư', 'Kho', 'Tồn hệ thống', 'Tồn thực tế', 'Chênh lệch', 'Hành động'].map((h) => (
                    <th key={h} className="px-3 py-2 text-left font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {countSheet.map((line, idx) => (
                  <tr key={`${idx}-${line.inventoryItemId}`} className="border-t border-white/10/80">
                    <td className="px-3 py-2">
                      <select value={line.inventoryItemId} onChange={(e) => setCountRows((prev) => prev.map((r, i) => (i === idx ? { ...r, inventoryItemId: e.target.value } : r)))} className="h-9 w-full rounded border border-white/10 bg-white/[0.06] px-2 text-slate-100">
                        <option value="">Chọn vật tư</option>
                        {materials.map((m: any) => (
                          <option key={m.id} value={m.id}>
                            {m.code} - {m.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <select value={line.zoneId} onChange={(e) => setCountRows((prev) => prev.map((r, i) => (i === idx ? { ...r, zoneId: e.target.value } : r)))} className="h-9 w-full rounded border border-white/10 bg-white/[0.06] px-2 text-slate-100">
                        <option value="">Chọn kho</option>
                        {zones.map((z: any) => (
                          <option key={z.id} value={z.id}>
                            {z.code}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2 text-slate-200">{line.systemQty.toLocaleString('vi-VN')}</td>
                    <td className="px-3 py-2">
                      <input value={line.physicalQty} onChange={(e) => setCountRows((prev) => prev.map((r, i) => (i === idx ? { ...r, physicalQty: e.target.value } : r)))} className="h-9 w-32 rounded border border-white/10 bg-white/[0.06] px-2 text-slate-100" />
                    </td>
                    <td className={`px-3 py-2 ${line.difference >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>{line.difference.toLocaleString('vi-VN')}</td>
                    <td className="px-3 py-2">
                      <button onClick={() => setCountRows((prev) => prev.filter((_r, i) => i !== idx))} className="rounded border border-red-700/60 px-2 py-1 text-xs text-red-300">
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="text-xs text-slate-400">Phiếu: {sessionNo}</div>
            <button onClick={submitCount} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white">
              Tạo phiếu kiểm kê
            </button>
          </div>
        </div>
      </div>
    </EnterpriseModulePage>
  )
}

function KpiCard({ title, value, className = '' }: { title: string; value: string; className?: string }) {
  return (
    <div className={`rounded-xl border border-white/10 bg-white/[0.045] p-4 ${className}`}>
      <div className="text-[11px] uppercase tracking-[0.12em] text-slate-400">{title}</div>
      <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
    </div>
  )
}
function InsightPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.055] shadow-[0_18px_44px_rgba(0,0,0,0.18)] backdrop-blur-xl p-4">
      <div className="mb-3 text-sm font-semibold text-white">{title}</div>
      {children}
    </div>
  )
}
