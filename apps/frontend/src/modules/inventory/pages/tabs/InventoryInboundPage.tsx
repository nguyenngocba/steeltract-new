import { useMemo, useState } from 'react'

import { EnterpriseModulePage } from '../../../../shared/runtime-tabs/EnterpriseModulePage'
import { EnterpriseTabBar } from '../../../../shared/runtime-tabs/EnterpriseTabBar'
import { SectionHeader } from '../../../../shared/ui/enterprise'
import { inventoryTabs } from '../../config/inventory-tabs'
import { useCreateTransaction } from '../../hooks/useCreateTransaction'
import { useInventoryItems } from '../../hooks/useInventoryItems'
import { useInventoryTransactions } from '../../hooks/useInventoryTransactions'
import { useSuppliers } from '../../hooks/useSuppliers'
import { useZones } from '../../hooks/useZones'

function num(v: any) {
  const n = Number(v ?? 0)
  return Number.isFinite(n) ? n : 0
}

function formatCurrency(v: any) {
  return `${Math.round(num(v)).toLocaleString('vi-VN')} đ`
}

export function InventoryInboundPage() {
  const { data: materials = [] } = useInventoryItems()
  const { data: suppliers = [] } = useSuppliers()
  const { data: zones = [] } = useZones()
  const { data: tx = [], isLoading } = useInventoryTransactions({ type: 'INBOUND' })
  const createTransaction = useCreateTransaction()

  const [date, setDate] = useState('')
  const [supplierId, setSupplierId] = useState('')
  const [zoneId, setZoneId] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 10

  const [form, setForm] = useState({
    inventoryItemId: '',
    supplierId: '',
    zoneId: '',
    quantity: '',
    unitPrice: '',
    vat: '10',
    remark: '',
  })

  const rows = useMemo(() => {
    return (tx as any[])
      .filter((x: any) => {
        const line = x.items?.[0]
        if (date) {
          const d = new Date(x.transactionDate ?? x.createdAt).toISOString().slice(0, 10)
          if (d !== date) return false
        }
        if (supplierId && String(x.supplierId ?? '') !== supplierId) return false
        if (zoneId && String(line?.zoneId ?? '') !== zoneId) return false
        if (search.trim()) {
          const q = search.trim().toLowerCase()
          const text = [
            x.transactionNo,
            x.supplierName,
            line?.inventoryItem?.code,
            line?.inventoryItem?.name,
            line?.zone?.code,
          ]
            .join(' ')
            .toLowerCase()
          if (!text.includes(q)) return false
        }
        return true
      })
      .sort((a: any, b: any) => +new Date(b.transactionDate ?? b.createdAt) - +new Date(a.transactionDate ?? a.createdAt))
  }, [tx, date, supplierId, zoneId, search])

  const kpis = useMemo(() => {
    const now = new Date()
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const inMonth = rows.filter((x: any) => String(x.transactionDate ?? x.createdAt).slice(0, 7) === monthKey)
    const qty = inMonth.reduce((s: number, x: any) => s + Math.abs(num(x.items?.[0]?.quantity)), 0)
    const amount = inMonth.reduce((s: number, x: any) => s + Math.abs(num(x.items?.[0]?.totalAmount)), 0)
    const statusDone = rows.filter((x: any) => String(x.status ?? 'COMPLETED').toUpperCase() === 'COMPLETED').length
    return {
      monthlyQty: qty,
      monthlyAmount: amount,
      docs: inMonth.length,
      done: statusDone,
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

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize
    return rows.slice(start, start + pageSize)
  }, [rows, page])

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize))

  const selectedMaterial = materials.find((x: any) => x.id === form.inventoryItemId) as any
  const currentStock = num(selectedMaterial?.quantity)
  const quantity = num(form.quantity)
  const unitPrice = num(form.unitPrice)
  const vat = num(form.vat)
  const subTotal = quantity * unitPrice
  const vatAmount = (subTotal * vat) / 100
  const total = subTotal + vatAmount

  async function submit() {
    if (!form.inventoryItemId || quantity <= 0 || unitPrice <= 0) return
    const no = `NK-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 900 + 100)}`
    await createTransaction.mutateAsync({
      type: 'INBOUND',
      transactionNo: no,
      transactionDate: new Date().toISOString(),
      supplierId: form.supplierId || undefined,
      supplierName: suppliers.find((x: any) => x.id === form.supplierId)?.name,
      remarks: form.remark || undefined,
      items: [
        {
          inventoryItemId: form.inventoryItemId,
          quantity,
          unitPrice,
          zoneId: form.zoneId || undefined,
        },
      ],
    })
    setForm({
      inventoryItemId: '',
      supplierId: '',
      zoneId: '',
      quantity: '',
      unitPrice: '',
      vat: '10',
      remark: '',
    })
  }

  return (
    <EnterpriseModulePage>
      <SectionHeader title="Nhập kho vật tư" description="Tiếp nhận vật tư theo nhà cung cấp và vị trí lưu kho." />
      <EnterpriseTabBar tabs={inventoryTabs} />

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-4">
          <KpiCard title="Tổng nhập trong tháng" value={`${kpis.monthlyQty.toLocaleString('vi-VN')} tấn`} />
          <KpiCard title="Giá trị nhập trong tháng" value={formatCurrency(kpis.monthlyAmount)} />
          <KpiCard title="Số phiếu nhập" value={kpis.docs.toLocaleString('vi-VN')} />
          <KpiCard title="Hoàn thành" value={kpis.done.toLocaleString('vi-VN')} />
        </div>

        <div className="rounded-2xl border border-slate-800/70 bg-[#071323]/80 p-3">
          <div className="grid grid-cols-1 gap-2 xl:grid-cols-6">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-10 rounded-lg border border-slate-700 bg-[#050d18] px-3 text-sm text-slate-100" />
            <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className="h-10 rounded-lg border border-slate-700 bg-[#050d18] px-3 text-sm text-slate-100">
              <option value="">Nhà cung cấp</option>
              {suppliers.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <select value={zoneId} onChange={(e) => setZoneId(e.target.value)} className="h-10 rounded-lg border border-slate-700 bg-[#050d18] px-3 text-sm text-slate-100">
              <option value="">Vị trí</option>
              {zones.map((z: any) => (
                <option key={z.id} value={z.id}>
                  {z.code}
                </option>
              ))}
            </select>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm mã phiếu, vật tư, NCC..." className="h-10 rounded-lg border border-slate-700 bg-[#050d18] px-3 text-sm text-slate-100 xl:col-span-3" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <div className="xl:col-span-9 rounded-2xl border border-slate-800/70 bg-[#071323]/85">
            <div className="border-b border-slate-800 px-4 py-3 text-sm font-semibold text-white">Danh sách phiếu nhập</div>
            <div className="overflow-auto">
              <table className="w-full min-w-[1100px] text-sm">
                <thead className="bg-[#081b31] text-xs uppercase text-slate-400">
                  <tr>
                    {['Mã phiếu nhập', 'Ngày nhập', 'Nhà cung cấp', 'Vị trí', 'ĐVT', 'Đơn giá', 'Tổng giá trị', 'Trạng thái', 'Người tạo'].map((h) => (
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
                        <tr key={x.id} className="border-t border-slate-800/80 text-slate-200">
                          <td className="px-3 py-2 text-cyan-300">{x.transactionNo}</td>
                          <td className="px-3 py-2">{new Date(x.transactionDate ?? x.createdAt).toLocaleDateString('vi-VN')}</td>
                          <td className="px-3 py-2">{x.supplierName ?? '-'}</td>
                          <td className="px-3 py-2">{line?.zone?.code ?? '-'}</td>
                          <td className="px-3 py-2">{line?.inventoryItem?.unit ?? '-'}</td>
                          <td className="px-3 py-2">{formatCurrency(line?.unitPrice)}</td>
                          <td className="px-3 py-2">{formatCurrency(line?.totalAmount)}</td>
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
            <div className="flex items-center justify-between border-t border-slate-800 px-4 py-3 text-xs text-slate-400">
              <div>
                Hiển thị {rows.length === 0 ? 0 : (page - 1) * pageSize + 1} - {Math.min(page * pageSize, rows.length)} / {rows.length}
              </div>
              <div className="flex items-center gap-2">
                <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded border border-slate-700 px-2 py-1 disabled:opacity-40">
                  Trước
                </button>
                <span>
                  {page}/{pageCount}
                </span>
                <button disabled={page >= pageCount} onClick={() => setPage((p) => Math.min(pageCount, p + 1))} className="rounded border border-slate-700 px-2 py-1 disabled:opacity-40">
                  Sau
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4 xl:col-span-3">
            <InsightPanel title="Phân bổ nhập theo vị trí">
              {byZone.map(([z, q]) => (
                <div key={z} className="mb-2 flex items-center justify-between text-sm text-slate-300">
                  <span>{z}</span>
                  <span>{q.toLocaleString('vi-VN')}</span>
                </div>
              ))}
            </InsightPanel>
            <InsightPanel title="Top 5 vật tư nhập nhiều nhất">
              {topMaterials.map((m) => (
                <div key={m.code} className="mb-2 flex items-center justify-between text-sm text-slate-300">
                  <span>{m.code}</span>
                  <span>{m.qty.toLocaleString('vi-VN')}</span>
                </div>
              ))}
            </InsightPanel>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800/70 bg-[#071323]/85 p-4">
          <div className="mb-3 text-sm font-semibold text-white">Nhập kho vật tư</div>
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-4">
            <select value={form.supplierId} onChange={(e) => setForm((f) => ({ ...f, supplierId: e.target.value }))} className="h-10 rounded-lg border border-slate-700 bg-[#050d18] px-3 text-sm text-slate-100">
              <option value="">Nhà cung cấp</option>
              {suppliers.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <select value={form.inventoryItemId} onChange={(e) => setForm((f) => ({ ...f, inventoryItemId: e.target.value }))} className="h-10 rounded-lg border border-slate-700 bg-[#050d18] px-3 text-sm text-slate-100">
              <option value="">Vật tư</option>
              {materials.map((m: any) => (
                <option key={m.id} value={m.id}>
                  {m.code} - {m.name}
                </option>
              ))}
            </select>
            <select value={form.zoneId} onChange={(e) => setForm((f) => ({ ...f, zoneId: e.target.value }))} className="h-10 rounded-lg border border-slate-700 bg-[#050d18] px-3 text-sm text-slate-100">
              <option value="">Khu vực</option>
              {zones.map((z: any) => (
                <option key={z.id} value={z.id}>
                  {z.code}
                </option>
              ))}
            </select>
            <input value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))} placeholder="Số lượng" className="h-10 rounded-lg border border-slate-700 bg-[#050d18] px-3 text-sm text-slate-100" />
            <input value={form.unitPrice} onChange={(e) => setForm((f) => ({ ...f, unitPrice: e.target.value }))} placeholder="Đơn giá" className="h-10 rounded-lg border border-slate-700 bg-[#050d18] px-3 text-sm text-slate-100" />
            <input value={form.vat} onChange={(e) => setForm((f) => ({ ...f, vat: e.target.value }))} placeholder="VAT (%)" className="h-10 rounded-lg border border-slate-700 bg-[#050d18] px-3 text-sm text-slate-100" />
            <input value={form.remark} onChange={(e) => setForm((f) => ({ ...f, remark: e.target.value }))} placeholder="Ghi chú" className="h-10 rounded-lg border border-slate-700 bg-[#050d18] px-3 text-sm text-slate-100 xl:col-span-2" />
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 text-sm xl:grid-cols-4">
            <MetricBox title="Tồn hiện tại" value={currentStock.toLocaleString('vi-VN')} />
            <MetricBox title="Sau nhập" value={(currentStock + quantity).toLocaleString('vi-VN')} />
            <MetricBox title="Đơn giá TB mới" value={formatCurrency(unitPrice)} />
            <MetricBox title="Tổng thanh toán" value={formatCurrency(total)} />
          </div>
          <div className="mt-4 flex justify-end">
            <button onClick={submit} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white">
              Xác nhận nhập kho
            </button>
          </div>
        </div>
      </div>
    </EnterpriseModulePage>
  )
}

function KpiCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-800/80 bg-[#071323]/80 p-4">
      <div className="text-[11px] uppercase tracking-[0.12em] text-slate-400">{title}</div>
      <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
    </div>
  )
}

function InsightPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-800/70 bg-[#071323]/85 p-4">
      <div className="mb-3 text-sm font-semibold text-white">{title}</div>
      {children}
    </div>
  )
}

function MetricBox({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-800/80 bg-[#050d18] p-3">
      <div className="text-xs text-slate-400">{title}</div>
      <div className="mt-1 text-base font-semibold text-white">{value}</div>
    </div>
  )
}
