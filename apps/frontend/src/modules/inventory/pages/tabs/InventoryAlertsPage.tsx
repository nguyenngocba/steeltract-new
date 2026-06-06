import { useMemo, useState } from 'react'

import { EnterpriseModulePage } from '../../../../shared/runtime-tabs/EnterpriseModulePage'
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
      <InventoryTabWorkspace />

      <div className={inventoryPageStack}>
        <div className={`grid grid-cols-1 xl:grid-cols-6 ${inventoryGridGap}`}>
          <InventoryKpi title="Cảnh báo nghiêm trọng" value={kpi.critical.toLocaleString('vi-VN')} note="Hết hàng" tone="red" />
          <InventoryKpi title="Cảnh báo thấp tồn" value={kpi.low.toLocaleString('vi-VN')} note="Dưới ngưỡng" tone="amber" />
          <InventoryKpi title="Sắp hết hạn" value={kpi.warning.toLocaleString('vi-VN')} note="Theo hạn dùng" tone="purple" />
          <InventoryKpi title="Vượt mức tồn" value={kpi.over.toLocaleString('vi-VN')} note="Tồn quá cao" tone="cyan" />
          <InventoryKpi title="Tổng cảnh báo" value={kpi.total.toLocaleString('vi-VN')} note="Đang theo dõi" tone="blue" />
          <InventoryKpi title="Đã xử lý hôm nay" value={kpi.processed.toLocaleString('vi-VN')} note="Đã đóng" tone="emerald" />
        </div>

        <InventoryPanel title="Bộ lọc cảnh báo">
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-6">
            <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)} className={inventoryInput}>
              <option value="">Mức độ cảnh báo</option>
              <option value="Nghiêm trọng">Nghiêm trọng</option>
              <option value="Thấp">Thấp</option>
            </select>
            <select value={zoneFilter} onChange={(e) => setZoneFilter(e.target.value)} className={inventoryInput}>
              <option value="">Kho</option>
              {[...new Set(alerts.map((a: any) => a.zoneCode))].map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm mã vật tư, tên vật tư..." className={`${inventoryInput} xl:col-span-4`} />
          </div>
        </InventoryPanel>

        <div className={`grid grid-cols-1 xl:grid-cols-12 ${inventoryGridGap}`}>
          <InventoryPanel title="Danh sách cảnh báo tồn kho" className="xl:col-span-9">
            <div className={`${inventoryTableShell} overflow-auto`}>
              <table className="w-full min-w-[1180px] text-sm">
                <thead className={inventoryTableHead}>
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
                    <tr key={x.id} className={inventoryTableRow}>
                      <td className="px-3 py-2">
                        <span className={`rounded-lg border px-2 py-1 text-xs ${x.level === 'Nghiêm trọng' ? 'border-red-400/40 bg-red-500/10 text-red-300' : 'border-amber-400/40 bg-amber-500/10 text-amber-300'}`}>{x.level}</span>
                      </td>
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
            <InventoryPagination page={page} pageCount={pageCount} total={alerts.length} pageSize={pageSize} onPageChange={setPage} />
          </InventoryPanel>

          <div className="space-y-5 xl:col-span-3">
            <InventoryInsightPanel title="Phân bổ cảnh báo theo mức độ">
              {byLevel.map(([level, count]) => (
                <div key={level} className="mb-2 flex items-center justify-between text-sm text-slate-300">
                  <span>{level}</span>
                  <span>{count}</span>
                </div>
              ))}
            </InventoryInsightPanel>
            <InventoryInsightPanel title="Cảnh báo theo loại">
              {byType.map(([typeName, count]) => (
                <div key={typeName} className="mb-2 flex items-center justify-between text-sm text-slate-300">
                  <span>{typeName}</span>
                  <span>{count}</span>
                </div>
              ))}
            </InventoryInsightPanel>
            <InventoryInsightPanel title="Cảnh báo nghiêm trọng">
              {criticalList.map((x: any) => (
                <div key={x.id} className="mb-2 rounded border border-white/10 p-2 text-xs text-slate-300">
                  <div className="text-red-300">
                    {x.code} - {x.name}
                  </div>
                  <div>{x.zoneCode}</div>
                </div>
              ))}
            </InventoryInsightPanel>
          </div>
        </div>
      </div>
    </EnterpriseModulePage>
  )
}
