import { useMemo, useState } from 'react'

import { EnterpriseModulePage } from '../../../../shared/runtime-tabs/EnterpriseModulePage'
import { EnterpriseTabBar } from '../../../../shared/runtime-tabs/EnterpriseTabBar'
import { SectionHeader } from '../../../../shared/ui/enterprise'
import { inventoryTabs } from '../../config/inventory-tabs'
import { useCreateTransaction } from '../../hooks/useCreateTransaction'
import { useInventoryItems } from '../../hooks/useInventoryItems'
import { useInventoryTransactions } from '../../hooks/useInventoryTransactions'
import { useMaterialDetail } from '../../hooks/useMaterialDetail'
import { useZones } from '../../hooks/useZones'

function num(v: any) {
  const n = Number(v ?? 0)
  return Number.isFinite(n) ? n : 0
}
function formatCurrency(v: any) {
  return `${Math.round(num(v)).toLocaleString('vi-VN')} đ`
}

export function InventoryTransferPage() {
  const { data: materials = [] } = useInventoryItems()
  const { data: zones = [] } = useZones()
  const { data: tx = [], isLoading } = useInventoryTransactions({ type: 'TRANSFER' })
  const createTx = useCreateTransaction()

  const [date, setDate] = useState('')
  const [materialFilter, setMaterialFilter] = useState('')
  const [fromZoneFilter, setFromZoneFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 10

  const [form, setForm] = useState({
    materialId: '',
    fromZoneId: '',
    toZoneId: '',
    quantity: '',
    reason: '',
  })

  const { data: selectedMaterialDetail } = useMaterialDetail(form.materialId || undefined)

  const sourceZoneOptions = useMemo(() => {
    const balances = ((selectedMaterialDetail as any)?.locationBalances ?? []) as any[]
    const byId = new Map<string, any>(zones.map((z: any) => [String(z.id), z]))
    return balances
      .filter((b: any) => num(b.quantity) > 0)
      .map((b: any) => {
        const zone = byId.get(String(b.zoneId))
        const zoneCode = zone?.code ?? b.zoneCode ?? 'NA'
        const zoneName = zone?.name ?? ''
        return { id: String(b.zoneId), label: `${zoneCode} - ${zoneName}`, qty: num(b.quantity), zoneCode }
      })
  }, [selectedMaterialDetail, zones])

  const destinationZoneOptions = useMemo(() => {
    return zones
      .filter((z: any) => String(z.id) !== form.fromZoneId)
      .map((z: any) => {
        const matched = sourceZoneOptions.find((s) => s.id === String(z.id))
        return {
          id: String(z.id),
          label: `${z.code} - ${z.name}`,
          qty: matched?.qty ?? 0,
          zoneCode: z.code,
        }
      })
  }, [zones, form.fromZoneId, sourceZoneOptions])

  const sourceQty = useMemo(() => {
    const selected = sourceZoneOptions.find((s) => s.id === form.fromZoneId)
    return num(selected?.qty)
  }, [sourceZoneOptions, form.fromZoneId])

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

  const recentActivities = useMemo(() => rows.slice(0, 5), [rows])

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize
    return rows.slice(start, start + pageSize)
  }, [rows, page])
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize))

  async function submitTransfer() {
    const qty = num(form.quantity)
    if (!form.materialId || !form.fromZoneId || !form.toZoneId || qty <= 0) return
    if (form.fromZoneId === form.toZoneId) return
    if (qty > sourceQty) return

    const no = `DC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 900 + 100)}`
    await createTx.mutateAsync({
      type: 'TRANSFER',
      transactionNo: no,
      transactionDate: new Date().toISOString(),
      remarks: form.reason || undefined,
      items: [
        {
          inventoryItemId: form.materialId,
          zoneId: form.fromZoneId,
          quantity: -Math.abs(qty),
        },
        {
          inventoryItemId: form.materialId,
          zoneId: form.toZoneId,
          quantity: Math.abs(qty),
        },
      ],
    })

    setForm({
      materialId: '',
      fromZoneId: '',
      toZoneId: '',
      quantity: '',
      reason: '',
    })
  }

  return (
    <EnterpriseModulePage>
      <SectionHeader title="Điều chuyển vật tư" description="Theo dõi điều chuyển giữa kho/khu vực theo thời gian thực." />
      <EnterpriseTabBar tabs={inventoryTabs} />

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-6">
          <KpiCard title="Tổng phiếu điều chuyển" value={kpis.total.toLocaleString('vi-VN')} />
          <KpiCard title="Đang thực hiện" value={kpis.pending.toLocaleString('vi-VN')} />
          <KpiCard title="Hoàn thành" value={kpis.done.toLocaleString('vi-VN')} />
          <KpiCard title="Đã hủy" value={kpis.cancelled.toLocaleString('vi-VN')} />
          <KpiCard title="Giá trị điều chuyển" value={formatCurrency(kpis.monthlyValue)} className="xl:col-span-2" />
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.055] shadow-[0_18px_44px_rgba(0,0,0,0.18)] backdrop-blur-xl p-3">
          <div className="grid grid-cols-1 gap-2 xl:grid-cols-5">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-10 rounded-lg border border-white/10 bg-white/[0.06] px-3 text-sm text-slate-100" />
            <select value={materialFilter} onChange={(e) => setMaterialFilter(e.target.value)} className="h-10 rounded-lg border border-white/10 bg-white/[0.06] px-3 text-sm text-slate-100">
              <option value="">Vật tư</option>
              {materials.map((m: any) => (
                <option key={m.id} value={m.id}>
                  {m.code} - {m.name}
                </option>
              ))}
            </select>
            <select value={fromZoneFilter} onChange={(e) => setFromZoneFilter(e.target.value)} className="h-10 rounded-lg border border-white/10 bg-white/[0.06] px-3 text-sm text-slate-100">
              <option value="">Kho xuất</option>
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
              <option value="CANCELLED">Đã hủy</option>
            </select>
            <button
              onClick={() => {
                setDate('')
                setMaterialFilter('')
                setFromZoneFilter('')
                setStatusFilter('')
              }}
              className="h-10 rounded-lg border border-white/10 bg-white/[0.06] px-3 text-sm text-slate-300"
            >
              Làm mới
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <div className="xl:col-span-9 rounded-xl border border-white/10 bg-white/[0.055] shadow-[0_18px_44px_rgba(0,0,0,0.18)] backdrop-blur-xl">
            <div className="border-b border-white/10 px-4 py-3 text-sm font-semibold text-white">Danh sách phiếu điều chuyển</div>
            <div className="overflow-auto">
              <table className="w-full min-w-[1100px] text-sm">
                <thead className="bg-white/[0.06] text-xs uppercase text-slate-400">
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
                        <tr key={x.id} className="border-t border-white/10 text-slate-200 hover:bg-white/[0.06]">
                          <td className="px-3 py-2 text-cyan-300">{x.transactionNo}</td>
                          <td className="px-3 py-2">{new Date(x.transactionDate ?? x.createdAt).toLocaleDateString('vi-VN')}</td>
                          <td className="px-3 py-2">{out?.zone?.code ?? '-'}</td>
                          <td className="px-3 py-2">{input?.zone?.code ?? '-'}</td>
                          <td className="px-3 py-2">{x.referenceType ?? 'Điều chuyển nội bộ'}</td>
                          <td className="px-3 py-2">{Math.abs(num(out?.quantity)).toLocaleString('vi-VN')}</td>
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
            <InsightPanel title="Giá trị điều chuyển theo kho">
              {zoneValue.map(([z, v]) => (
                <div key={z} className="mb-2 flex items-center justify-between text-sm text-slate-300">
                  <span>{z}</span>
                  <span>{formatCurrency(v)}</span>
                </div>
              ))}
            </InsightPanel>
            <InsightPanel title="Loại điều chuyển">
              {transferTypes.map(([t, c]) => (
                <div key={t} className="mb-2 flex items-center justify-between text-sm text-slate-300">
                  <span>{t}</span>
                  <span>{c}</span>
                </div>
              ))}
            </InsightPanel>
            <InsightPanel title="Hoạt động gần đây">
              {recentActivities.map((x: any) => (
                <div key={x.id} className="mb-2 rounded border border-white/10 p-2 text-xs text-slate-300">
                  <div className="text-cyan-300">{x.transactionNo}</div>
                  <div>{new Date(x.transactionDate ?? x.createdAt).toLocaleString('vi-VN')}</div>
                </div>
              ))}
            </InsightPanel>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-white/[0.055] shadow-[0_18px_44px_rgba(0,0,0,0.18)] backdrop-blur-xl p-4">
            <div className="mb-3 text-sm font-semibold text-white">Tạo điều chuyển mới</div>
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
              <select value={form.materialId} onChange={(e) => setForm((f) => ({ ...f, materialId: e.target.value, fromZoneId: '', toZoneId: '' }))} className="h-10 rounded-lg border border-white/10 bg-white/[0.06] px-3 text-sm text-slate-100 xl:col-span-2">
                <option value="">Vật tư</option>
                {materials.map((m: any) => (
                  <option key={m.id} value={m.id}>
                    {m.code} - {m.name}
                  </option>
                ))}
              </select>
              <select value={form.fromZoneId} onChange={(e) => setForm((f) => ({ ...f, fromZoneId: e.target.value }))} className="h-10 rounded-lg border border-white/10 bg-white/[0.06] px-3 text-sm text-slate-100">
                <option value="">Từ khu vực</option>
                {sourceZoneOptions.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.zoneCode} ({z.qty.toLocaleString('vi-VN')})
                  </option>
                ))}
              </select>
              <select value={form.toZoneId} onChange={(e) => setForm((f) => ({ ...f, toZoneId: e.target.value }))} className="h-10 rounded-lg border border-white/10 bg-white/[0.06] px-3 text-sm text-slate-100">
                <option value="">Đến khu vực</option>
                {destinationZoneOptions.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.zoneCode} ({z.qty.toLocaleString('vi-VN')})
                  </option>
                ))}
              </select>
              <input value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))} placeholder="Số lượng" className="h-10 rounded-lg border border-white/10 bg-white/[0.06] px-3 text-sm text-slate-100" />
              <input value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} placeholder="Lý do điều chuyển" className="h-10 rounded-lg border border-white/10 bg-white/[0.06] px-3 text-sm text-slate-100" />
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 text-sm xl:grid-cols-2">
              <MetricBox title="Tồn tại nguồn" value={sourceQty.toLocaleString('vi-VN')} />
              <MetricBox title="Sau điều chuyển" value={Math.max(0, sourceQty - num(form.quantity)).toLocaleString('vi-VN')} />
            </div>
            <div className="mt-4 flex justify-end">
              <button onClick={submitTransfer} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white">
                Tạo phiếu điều chuyển
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.055] shadow-[0_18px_44px_rgba(0,0,0,0.18)] backdrop-blur-xl p-4">
            <div className="mb-3 text-sm font-semibold text-white">Sơ đồ điều chuyển hàng hóa</div>
            <div className="grid grid-cols-3 items-center gap-3">
              <div className="rounded-lg border border-white/10 bg-white/[0.06] p-3 text-center text-sm text-slate-200">
                <div className="text-xs text-slate-400">KHO XUẤT</div>
                <div className="mt-1 font-semibold">{sourceZoneOptions.find((x) => x.id === form.fromZoneId)?.zoneCode ?? '--'}</div>
              </div>
              <div className="text-center text-2xl text-cyan-400">→</div>
              <div className="rounded-lg border border-white/10 bg-white/[0.06] p-3 text-center text-sm text-slate-200">
                <div className="text-xs text-slate-400">KHO NHẬP</div>
                <div className="mt-1 font-semibold">{destinationZoneOptions.find((x) => x.id === form.toZoneId)?.zoneCode ?? '--'}</div>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-5 gap-2 text-center text-xs">
              {['Tạo phiếu', 'Duyệt phiếu', 'Đang vận chuyển', 'Nhận hàng', 'Hoàn thành'].map((step, idx) => (
                <div key={step} className="text-slate-300">
                  <div className={`mx-auto mb-2 h-2 w-full rounded ${idx < 3 ? 'bg-cyan-500' : 'bg-slate-700'}`} />
                  {step}
                </div>
              ))}
            </div>
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
function MetricBox({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.06] p-3">
      <div className="text-xs text-slate-400">{title}</div>
      <div className="mt-1 text-base font-semibold text-white">{value}</div>
    </div>
  )
}
