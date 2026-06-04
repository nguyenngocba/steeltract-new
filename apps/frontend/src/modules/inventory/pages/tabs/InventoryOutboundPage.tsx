import { useMemo, useState } from 'react'

import { EnterpriseModulePage } from '../../../../shared/runtime-tabs/EnterpriseModulePage'
import { EnterpriseTabBar } from '../../../../shared/runtime-tabs/EnterpriseTabBar'
import { SectionHeader } from '../../../../shared/ui/enterprise'
import { inventoryTabs } from '../../config/inventory-tabs'
import { useCreateTransaction } from '../../hooks/useCreateTransaction'
import { useInventoryItems } from '../../hooks/useInventoryItems'
import { useInventoryTransactions } from '../../hooks/useInventoryTransactions'
import { useMaterialDetail } from '../../hooks/useMaterialDetail'
import { useProjects } from '../../hooks/useProjects'
import { useZones } from '../../hooks/useZones'

function num(v: any) {
  const n = Number(v ?? 0)
  return Number.isFinite(n) ? n : 0
}

function formatCurrency(v: any) {
  return `${Math.round(num(v)).toLocaleString('vi-VN')} đ`
}

export function InventoryOutboundPage() {
  const { data: materials = [] } = useInventoryItems()
  const { data: projects = [] } = useProjects()
  const { data: zones = [] } = useZones()
  const { data: tx = [], isLoading } = useInventoryTransactions({ type: 'OUTBOUND' })
  const createTransaction = useCreateTransaction()

  const [date, setDate] = useState('')
  const [projectId, setProjectId] = useState('')
  const [zoneId, setZoneId] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 10

  const [form, setForm] = useState({
    target: 'PROJECT',
    projectId: '',
    inventoryItemId: '',
    zoneId: '',
    quantity: '',
    remark: '',
  })
  const { data: selectedMaterialDetail } = useMaterialDetail(form.inventoryItemId || undefined)

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

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize
    return rows.slice(start, start + pageSize)
  }, [rows, page])
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize))

  const selectedMaterial = materials.find((x: any) => x.id === form.inventoryItemId) as any
  const currentStock = num(selectedMaterial?.quantity)
  const quantity = num(form.quantity)
  const locationBalances = useMemo(() => {
    return Array.isArray((selectedMaterialDetail as any)?.locationBalances)
      ? ((selectedMaterialDetail as any).locationBalances as any[]).filter((balance) => num(balance.quantity) > 0)
      : []
  }, [selectedMaterialDetail])
  const qtyByZoneId = useMemo(() => {
    const map = new Map<string, number>()
    locationBalances.forEach((balance) => {
      if (balance.zoneId) map.set(String(balance.zoneId), num(balance.quantity))
    })
    return map
  }, [locationBalances])
  const availableZones = useMemo(() => {
    const ids = new Set(locationBalances.map((balance) => String(balance.zoneId ?? '')).filter(Boolean))
    return zones.filter((zone: any) => ids.has(String(zone.id)))
  }, [locationBalances, zones])
  const selectedZoneStock = form.zoneId ? qtyByZoneId.get(String(form.zoneId)) ?? 0 : 0
  const selectedZoneAfterStock = selectedZoneStock - quantity
  const canSubmit =
    Boolean(form.inventoryItemId) &&
    Boolean(form.zoneId) &&
    quantity > 0 &&
    selectedZoneAfterStock >= 0

  async function submit() {
    if (!canSubmit) return
    const no = `XK-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 900 + 100)}`
    const targetTag = form.target === 'COMPONENT_PRODUCTION'
      ? '[COMPONENT_PRODUCTION]'
      : '[PROJECT]'
    await createTransaction.mutateAsync({
      type: 'OUTBOUND',
      transactionNo: no,
      transactionDate: new Date().toISOString(),
      projectId: form.projectId || undefined,
      projectName: projects.find((x: any) => x.id === form.projectId)?.name,
      zoneId: form.zoneId,
      remarks: `${targetTag} ${form.remark}`.trim(),
      items: [
        {
          inventoryItemId: form.inventoryItemId,
          quantity: -Math.abs(quantity),
          zoneId: form.zoneId || undefined,
        },
      ],
    })
    setForm({
      target: 'PROJECT',
      projectId: '',
      inventoryItemId: '',
      zoneId: '',
      quantity: '',
      remark: '',
    })
  }

  return (
    <EnterpriseModulePage>
      <SectionHeader title="Xuất kho vật tư" description="Xuất vật tư cho công trình hoặc sản xuất cấu kiện." />
      <EnterpriseTabBar tabs={inventoryTabs} />

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-4">
          <KpiCard title="Tổng xuất trong tháng" value={`${kpis.monthlyQty.toLocaleString('vi-VN')} tấn`} />
          <KpiCard title="Giá trị xuất trong tháng" value={formatCurrency(kpis.monthlyAmount)} />
          <KpiCard title="Số phiếu xuất" value={kpis.docs.toLocaleString('vi-VN')} />
          <KpiCard title="Chờ duyệt" value={kpis.pending.toLocaleString('vi-VN')} />
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.055] shadow-[0_18px_44px_rgba(0,0,0,0.18)] backdrop-blur-xl p-3">
          <div className="grid grid-cols-1 gap-2 xl:grid-cols-6">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-10 rounded-lg border border-white/10 bg-white/[0.06] px-3 text-sm text-slate-100" />
            <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="h-10 rounded-lg border border-white/10 bg-white/[0.06] px-3 text-sm text-slate-100">
              <option value="">Đơn vị nhận</option>
              {projects.map((p: any) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <select value={zoneId} onChange={(e) => setZoneId(e.target.value)} className="h-10 rounded-lg border border-white/10 bg-white/[0.06] px-3 text-sm text-slate-100">
              <option value="">Kho xuất</option>
              {zones.map((z: any) => (
                <option key={z.id} value={z.id}>
                  {z.code}
                </option>
              ))}
            </select>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm mã phiếu, vật tư, đơn vị nhận..." className="h-10 rounded-lg border border-white/10 bg-white/[0.06] px-3 text-sm text-slate-100 xl:col-span-3" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <div className="xl:col-span-9 rounded-xl border border-white/10 bg-white/[0.055] shadow-[0_18px_44px_rgba(0,0,0,0.18)] backdrop-blur-xl">
            <div className="border-b border-white/10 px-4 py-3 text-sm font-semibold text-white">Danh sách phiếu xuất</div>
            <div className="overflow-auto">
              <table className="w-full min-w-[1100px] text-sm">
                <thead className="bg-white/[0.06] text-xs uppercase text-slate-400">
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
                        <tr key={x.id} className="border-t border-white/10 text-slate-200 hover:bg-white/[0.06]">
                          <td className="px-3 py-2 text-cyan-300">{x.transactionNo}</td>
                          <td className="px-3 py-2">{new Date(x.transactionDate ?? x.createdAt).toLocaleDateString('vi-VN')}</td>
                          <td className="px-3 py-2">{x.referenceType ?? 'Xuất kho'}</td>
                          <td className="px-3 py-2">{x.projectName ?? '-'}</td>
                          <td className="px-3 py-2">{line?.zone?.code ?? '-'}</td>
                          <td className="px-3 py-2">{Math.abs(num(line?.quantity)).toLocaleString('vi-VN')}</td>
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
            <InsightPanel title="Phân bổ xuất theo kho">
              {byZone.map(([z, q]) => (
                <div key={z} className="mb-2 flex items-center justify-between text-sm text-slate-300">
                  <span>{z}</span>
                  <span>{q.toLocaleString('vi-VN')}</span>
                </div>
              ))}
            </InsightPanel>
            <InsightPanel title="Top 5 vật tư xuất nhiều nhất">
              {topMaterials.map((m) => (
                <div key={m.code} className="mb-2 flex items-center justify-between text-sm text-slate-300">
                  <span>{m.code}</span>
                  <span>{m.qty.toLocaleString('vi-VN')}</span>
                </div>
              ))}
            </InsightPanel>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.055] shadow-[0_18px_44px_rgba(0,0,0,0.18)] backdrop-blur-xl p-4">
          <div className="mb-3 text-sm font-semibold text-white">Xuất kho vật tư</div>
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-4">
            <select value={form.target} onChange={(e) => setForm((f) => ({ ...f, target: e.target.value, projectId: e.target.value === 'COMPONENT_PRODUCTION' ? '' : f.projectId }))} className="h-10 rounded-lg border border-white/10 bg-white/[0.06] px-3 text-sm text-slate-100">
              <option value="PROJECT">Xuất cho công trình</option>
              <option value="COMPONENT_PRODUCTION">Xuất cho sản xuất cấu kiện</option>
            </select>
            <select disabled={form.target === 'COMPONENT_PRODUCTION'} value={form.projectId} onChange={(e) => setForm((f) => ({ ...f, projectId: e.target.value }))} className="h-10 rounded-lg border border-white/10 bg-white/[0.06] px-3 text-sm text-slate-100 disabled:cursor-not-allowed disabled:opacity-50">
              <option value="">Đơn vị nhận</option>
              {projects.map((p: any) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <select value={form.inventoryItemId} onChange={(e) => setForm((f) => ({ ...f, inventoryItemId: e.target.value, zoneId: '' }))} className="h-10 rounded-lg border border-white/10 bg-white/[0.06] px-3 text-sm text-slate-100">
              <option value="">Vật tư</option>
              {materials.map((m: any) => (
                <option key={m.id} value={m.id}>
                  {m.code} - {m.name}
                </option>
              ))}
            </select>
            <select value={form.zoneId} onChange={(e) => setForm((f) => ({ ...f, zoneId: e.target.value }))} className="h-10 rounded-lg border border-white/10 bg-white/[0.06] px-3 text-sm text-slate-100">
              <option value="">Vị trí lấy vật tư</option>
              {availableZones.map((z: any) => (
                <option key={z.id} value={z.id}>
                  {z.code} - {z.name} · tồn {(qtyByZoneId.get(String(z.id)) ?? 0).toLocaleString('vi-VN')}
                </option>
              ))}
            </select>
            <input value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))} placeholder="Số lượng" className="h-10 rounded-lg border border-white/10 bg-white/[0.06] px-3 text-sm text-slate-100 xl:col-span-2" />
            <input value={form.remark} onChange={(e) => setForm((f) => ({ ...f, remark: e.target.value }))} placeholder="Ghi chú" className="h-10 rounded-lg border border-white/10 bg-white/[0.06] px-3 text-sm text-slate-100 xl:col-span-2" />
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 text-sm xl:grid-cols-3">
            <MetricBox title="Tồn hiện tại" value={currentStock.toLocaleString('vi-VN')} />
            <MetricBox title="Tồn sau xuất" value={Math.max(0, currentStock - quantity).toLocaleString('vi-VN')} />
            <MetricBox title="Tồn tại vị trí" value={selectedZoneStock.toLocaleString('vi-VN')} />
            <MetricBox title="Vị trí sau xuất" value={Math.max(0, selectedZoneAfterStock).toLocaleString('vi-VN')} />
            <MetricBox title="Giá trị xuất dự kiến" value={formatCurrency(quantity * num(selectedMaterial?.unitPrice))} />
          </div>
          <div className="mt-4 flex justify-end">
            <button disabled={!canSubmit} onClick={submit} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400">
              Xác nhận xuất kho
            </button>
          </div>
        </div>
      </div>
    </EnterpriseModulePage>
  )
}

function KpiCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.045] p-4">
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
