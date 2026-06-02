import { useMemo, useState } from 'react'

import { EnterpriseModulePage } from '../../../../shared/runtime-tabs/EnterpriseModulePage'
import { EnterpriseTabBar } from '../../../../shared/runtime-tabs/EnterpriseTabBar'
import { SectionHeader } from '../../../../shared/ui/enterprise'
import { inventoryTabs } from '../../config/inventory-tabs'
import { useInventoryItems } from '../../hooks/useInventoryItems'
import { useZones } from '../../hooks/useZones'

function num(v: any) {
  const n = Number(v ?? 0)
  return Number.isFinite(n) ? n : 0
}

export function InventoryAlertsPage() {
  const { data: materials = [] } = useInventoryItems()
  const { data: zones = [] } = useZones()
  const [severityFilter, setSeverityFilter] = useState('')
  const [zoneFilter, setZoneFilter] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 10

  const alerts = useMemo(() => {
    return (materials as any[])
      .map((m: any) => {
        const qty = num(m.quantity)
        const min = num(m.minimumStock)
        const level = qty <= 0 ? 'Nghiêm trọng' : qty <= min ? 'Thấp' : qty >= min * 8 && min > 0 ? 'Vượt mức tồn' : ''
        return {
          ...m,
          qty,
          min,
          level,
          alertType: qty <= 0 ? 'Hết hàng' : qty <= min ? 'Thấp tồn' : qty >= min * 8 && min > 0 ? 'Vượt mức tồn' : '',
          zoneCode: m.zoneCode ?? zones[0]?.code ?? 'KHO-A-01',
          status: qty <= 0 || qty <= min ? 'Chưa xử lý' : 'Đã xử lý',
        }
      })
      .filter((x: any) => x.level)
      .filter((x: any) => {
        if (severityFilter && x.level !== severityFilter) return false
        if (zoneFilter && x.zoneCode !== zoneFilter) return false
        if (search.trim()) {
          const q = search.toLowerCase()
          return `${x.code} ${x.name}`.toLowerCase().includes(q)
        }
        return true
      })
  }, [materials, zones, severityFilter, zoneFilter, search])

  const kpi = useMemo(() => {
    const critical = alerts.filter((x: any) => x.level === 'Nghiêm trọng').length
    const low = alerts.filter((x: any) => x.level === 'Thấp').length
    const warning = alerts.filter((x: any) => x.alertType === 'Sắp hết hạn').length
    const over = alerts.filter((x: any) => x.alertType === 'Vượt mức tồn').length
    const total = alerts.length
    const processed = alerts.filter((x: any) => x.status === 'Đã xử lý').length
    return { critical, low, warning, over, total, processed }
  }, [alerts])

  const byLevel = useMemo(() => {
    const m = new Map<string, number>()
    alerts.forEach((x: any) => m.set(x.level, (m.get(x.level) ?? 0) + 1))
    return Array.from(m.entries())
  }, [alerts])
  const byType = useMemo(() => {
    const m = new Map<string, number>()
    alerts.forEach((x: any) => m.set(x.alertType, (m.get(x.alertType) ?? 0) + 1))
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1])
  }, [alerts])
  const criticalList = useMemo(() => alerts.filter((x: any) => x.level === 'Nghiêm trọng').slice(0, 8), [alerts])

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize
    return alerts.slice(start, start + pageSize)
  }, [alerts, page])
  const pageCount = Math.max(1, Math.ceil(alerts.length / pageSize))

  return (
    <EnterpriseModulePage>
      <SectionHeader title="Cảnh báo tồn kho" description="Trung tâm cảnh báo vận hành tồn kho theo mức độ rủi ro." />
      <EnterpriseTabBar tabs={inventoryTabs} />

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-6">
          <KpiCard title="Cảnh báo nghiêm trọng" value={kpi.critical.toLocaleString('vi-VN')} tone="text-red-300" />
          <KpiCard title="Cảnh báo thấp tồn" value={kpi.low.toLocaleString('vi-VN')} tone="text-orange-300" />
          <KpiCard title="Sắp hết hạn" value={kpi.warning.toLocaleString('vi-VN')} tone="text-amber-300" />
          <KpiCard title="Vượt mức tồn" value={kpi.over.toLocaleString('vi-VN')} tone="text-cyan-300" />
          <KpiCard title="Tổng cảnh báo" value={kpi.total.toLocaleString('vi-VN')} />
          <KpiCard title="Đã xử lý hôm nay" value={kpi.processed.toLocaleString('vi-VN')} tone="text-emerald-300" />
        </div>

        <div className="rounded-2xl border border-slate-800/70 bg-[#071323]/80 p-3">
          <div className="grid grid-cols-1 gap-2 xl:grid-cols-6">
            <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)} className="h-10 rounded-lg border border-slate-700 bg-[#050d18] px-3 text-sm text-slate-100">
              <option value="">Mức độ cảnh báo</option>
              <option value="Nghiêm trọng">Nghiêm trọng</option>
              <option value="Thấp">Thấp</option>
            </select>
            <select value={zoneFilter} onChange={(e) => setZoneFilter(e.target.value)} className="h-10 rounded-lg border border-slate-700 bg-[#050d18] px-3 text-sm text-slate-100">
              <option value="">Kho</option>
              {[...new Set(alerts.map((a: any) => a.zoneCode))].map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm mã vật tư, tên vật tư..." className="h-10 rounded-lg border border-slate-700 bg-[#050d18] px-3 text-sm text-slate-100 xl:col-span-4" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <div className="xl:col-span-9 rounded-2xl border border-slate-800/70 bg-[#071323]/85">
            <div className="border-b border-slate-800 px-4 py-3 text-sm font-semibold text-white">Danh sách cảnh báo tồn kho</div>
            <div className="overflow-auto">
              <table className="w-full min-w-[1180px] text-sm">
                <thead className="bg-[#081b31] text-xs uppercase text-slate-400">
                  <tr>
                    {['Mức độ', 'Loại cảnh báo', 'Mã vật tư', 'Tên vật tư', 'Kho', 'Tồn hiện tại', 'Ngưỡng cảnh báo', 'Đơn vị', 'Trạng thái', 'Hành động'].map((h) => (
                      <th key={h} className="px-3 py-3 text-left font-medium">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paged.map((x: any) => (
                    <tr key={x.id} className="border-t border-slate-800/80 text-slate-200">
                      <td className={`px-3 py-2 ${x.level === 'Nghiêm trọng' ? 'text-red-300' : 'text-amber-300'}`}>{x.level}</td>
                      <td className="px-3 py-2">{x.alertType}</td>
                      <td className="px-3 py-2 text-cyan-300">{x.code}</td>
                      <td className="px-3 py-2">{x.name}</td>
                      <td className="px-3 py-2">{x.zoneCode}</td>
                      <td className="px-3 py-2">{x.qty.toLocaleString('vi-VN')}</td>
                      <td className="px-3 py-2">{x.min.toLocaleString('vi-VN')}</td>
                      <td className="px-3 py-2">{x.unit ?? '-'}</td>
                      <td className="px-3 py-2">{x.status}</td>
                      <td className="px-3 py-2 text-slate-400">⋯</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-slate-800 px-4 py-3 text-xs text-slate-400">
              <div>
                Hiển thị {alerts.length === 0 ? 0 : (page - 1) * pageSize + 1} - {Math.min(page * pageSize, alerts.length)} / {alerts.length}
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
            <InsightPanel title="Phân bổ cảnh báo theo mức độ">
              {byLevel.map(([level, count]) => (
                <div key={level} className="mb-2 flex items-center justify-between text-sm text-slate-300">
                  <span>{level}</span>
                  <span>{count}</span>
                </div>
              ))}
            </InsightPanel>
            <InsightPanel title="Cảnh báo theo loại">
              {byType.map(([typeName, count]) => (
                <div key={typeName} className="mb-2 flex items-center justify-between text-sm text-slate-300">
                  <span>{typeName}</span>
                  <span>{count}</span>
                </div>
              ))}
            </InsightPanel>
            <InsightPanel title="Cảnh báo nghiêm trọng">
              {criticalList.map((x: any) => (
                <div key={x.id} className="mb-2 rounded border border-slate-800 p-2 text-xs text-slate-300">
                  <div className="text-red-300">
                    {x.code} - {x.name}
                  </div>
                  <div>{x.zoneCode}</div>
                </div>
              ))}
            </InsightPanel>
          </div>
        </div>
      </div>
    </EnterpriseModulePage>
  )
}

function KpiCard({ title, value, tone = 'text-white' }: { title: string; value: string; tone?: string }) {
  return (
    <div className="rounded-xl border border-slate-800/80 bg-[#071323]/80 p-4">
      <div className="text-[11px] uppercase tracking-[0.12em] text-slate-400">{title}</div>
      <div className={`mt-2 text-2xl font-semibold ${tone}`}>{value}</div>
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
