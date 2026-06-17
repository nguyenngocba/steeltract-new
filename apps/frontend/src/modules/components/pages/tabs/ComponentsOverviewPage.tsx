import { useMemo, useState } from 'react'

import { EnterpriseModulePage } from '../../../../shared/runtime-tabs/EnterpriseModulePage'
import { useProductionOrders } from '../../../production/hooks/useProductionCockpit'
import { useYardSlotsRuntime } from '../../../yard/hooks/queries/useYardRuntime'
import { useComponents } from '../../hooks/queries/useComponents'
import { formatQuantity } from '@/shared/utils/number-format'
import {
  ComponentsDonut,
  ComponentsFilterBar,
  ComponentsKpiCard,
  ComponentsMiniBars,
  ComponentsPanel,
  ComponentsSelect,
  componentsInput,
  componentsMutedButton,
  componentsTableHead,
  componentsTableRow,
  componentsTableShell,
} from './ComponentsCockpitShared'

type ComponentMeta = {
  type?: string
  profile?: string
  quantity?: number
  qcQuantity?: number
}

function parseMeta(raw?: string | null): ComponentMeta {
  try {
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function componentStatus(status: string) {
  const map: Record<string, string> = {
    STOCK: 'Tồn kho',
    CUTTING: 'Đang SX',
    WELDING: 'Đang SX',
    PAINTING: 'Đang SX',
    READY: 'Đã QC đạt',
    SHIPPED: 'Đang chuyển',
    DELIVERED: 'Đã giao',
    INSTALLED: 'Đã lắp',
    REJECTED: 'QC không đạt',
  }
  return map[status] ?? status
}

function statusTone(label: string) {
  if (label.includes('Không đạt')) return 'border-red-500/30 bg-red-500/10 text-red-300'
  if (label.includes('Đang SX')) return 'border-blue-500/30 bg-blue-500/10 text-blue-300'
  if (label.includes('QC')) return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
  if (label.includes('chuyển') || label.includes('Chuyển')) return 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300'
  return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
}

export function ComponentsOverviewPage() {
  const { data: components = [], isLoading } = useComponents()
  const { data: orders = [] } = useProductionOrders()
  const { data: slots = [] } = useYardSlotsRuntime()
  const [query, setQuery] = useState('')
  const [project, setProject] = useState('')
  const [status, setStatus] = useState('')
  const [location, setLocation] = useState('')
  const [type, setType] = useState('')

  const rows = useMemo(() => components.map((component) => {
    const meta = parseMeta(component.description)
    const yardPlacement = slots
      .flatMap((slot) => slot.placements.map((placement) => ({ slot, placement })))
      .find(({ placement }) => placement.itemId === component.id)
    const currentLocation = yardPlacement
      ? `${yardPlacement.slot.zone.code} / ${yardPlacement.slot.code} / L${yardPlacement.placement.stackLevel}`
      : [component.floor, component.zone, component.position].filter(Boolean).join(' / ') || 'Kho cấu kiện'

    return {
      id: component.id,
      code: component.code,
      name: component.name,
      type: meta.type ?? 'Cấu kiện thép',
      profile: meta.profile ?? 'N/A',
      project: component.project?.code ?? component.project?.name ?? 'Chưa gán',
      location: currentLocation,
      status: componentStatus(component.status),
      rawStatus: component.status,
      quantity: Number(meta.quantity ?? 1),
      qcQuantity: Number(meta.qcQuantity ?? (component.status === 'READY' ? meta.quantity ?? 1 : 0)),
      createdAt: component.createdAt ? new Date(component.createdAt) : null,
    }
  }), [components, slots])

  const filtered = useMemo(() => rows.filter((row) => {
    if (project && row.project !== project) return false
    if (status && row.status !== status) return false
    if (location && !row.location.includes(location)) return false
    if (type && row.type !== type) return false
    const q = query.trim().toLowerCase()
    if (!q) return true
    return [row.code, row.name, row.profile, row.project, row.location].join(' ').toLowerCase().includes(q)
  }), [rows, project, status, location, type, query])

  const statusCounts = {
    total: rows.length,
    producing: rows.filter((row) => row.status === 'Đang SX').length,
    stock: rows.filter((row) => row.status === 'Tồn kho').length,
    qcPass: rows.filter((row) => row.status.includes('QC')).length,
    qcFail: rows.filter((row) => row.status.includes('Không đạt')).length,
    transferring: rows.filter((row) => row.status.includes('chuyển') || row.status.includes('Chuyển')).length,
  }

  const typeSegments = useMemo(() => {
    const byType = new Map<string, number>()
    rows.forEach((row) => byType.set(row.type, (byType.get(row.type) ?? 0) + row.quantity))
    const colors = ['#1d7cff', '#06b6d4', '#7c3aed', '#f59e0b', '#ef4444', '#14c987']
    return Array.from(byType.entries()).slice(0, 6).map(([label, value], index) => ({ label, value, color: colors[index] }))
  }, [rows])

  const topProfiles = useMemo(() => {
    const byProfile = new Map<string, number>()
    rows.forEach((row) => byProfile.set(row.profile, (byProfile.get(row.profile) ?? 0) + row.quantity))
    return Array.from(byProfile.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5)
  }, [rows])

  const recentOrders = orders.slice(0, 4)
  const progressBars = recentOrders.map((order) => ({
    code: order.orderNo,
    project: order.projectId ?? '-',
    value: order.status === 'COMPLETED' ? 100 : order.status === 'IN_PROGRESS' ? 68 : order.status === 'DELAYED' ? 38 : 18,
    color: order.status === 'DELAYED' ? 'bg-red-500' : order.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-blue-500',
  }))
  const maxTop = Math.max(1, ...topProfiles.map(([, value]) => value))

  return (
    <EnterpriseModulePage>
      <div className="space-y-3">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
          <ComponentsKpiCard title="Tổng số cấu kiện" value={formatQuantity(statusCounts.total, 0)} sub="+8,6% so với tháng trước" tone="blue" />
          <ComponentsKpiCard title="Đang sản xuất" value={formatQuantity(statusCounts.producing, 0)} sub="+18,2%" tone="purple" />
          <ComponentsKpiCard title="Tồn kho cấu kiện" value={formatQuantity(statusCounts.stock, 0)} sub="+43,2%" tone="amber" />
          <ComponentsKpiCard title="Đã QC đạt" value={formatQuantity(statusCounts.qcPass, 0)} sub="+77,1%" tone="emerald" />
          <ComponentsKpiCard title="QC không đạt" value={formatQuantity(statusCounts.qcFail, 0)} sub="+2,7%" tone="red" />
          <ComponentsKpiCard title="Đang chuyển" value={formatQuantity(statusCounts.transferring, 0)} sub="+6,0%" tone="cyan" />
        </div>

        <ComponentsFilterBar>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm theo mã, tên, profile, dự án..." className={`${componentsInput} xl:col-span-4`} />
          <ComponentsSelect value={project} onChange={setProject} className="xl:col-span-2">
            <option value="">Dự án</option>
            {Array.from(new Set(rows.map((row) => row.project))).map((item) => <option key={item}>{item}</option>)}
          </ComponentsSelect>
          <ComponentsSelect value={status} onChange={setStatus} className="xl:col-span-2">
            <option value="">Trạng thái</option>
            {Array.from(new Set(rows.map((row) => row.status))).map((item) => <option key={item}>{item}</option>)}
          </ComponentsSelect>
          <ComponentsSelect value={location} onChange={setLocation} className="xl:col-span-2">
            <option value="">Vị trí</option>
            {Array.from(new Set(rows.map((row) => row.location.split('/')[0].trim()).filter(Boolean))).map((item) => <option key={item}>{item}</option>)}
          </ComponentsSelect>
          <ComponentsSelect value={type} onChange={setType} className="xl:col-span-1">
            <option value="">Loại</option>
            {Array.from(new Set(rows.map((row) => row.type))).map((item) => <option key={item}>{item}</option>)}
          </ComponentsSelect>
          <button onClick={() => { setQuery(''); setProject(''); setStatus(''); setLocation(''); setType('') }} className={`${componentsMutedButton} xl:col-span-1`}>
            Làm mới
          </button>
        </ComponentsFilterBar>

        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1fr_390px]">
          <div className="space-y-3">
            <ComponentsPanel title="Danh sách cấu kiện">
              <div className={componentsTableShell}>
                <div className="overflow-auto">
                  <table className="w-full min-w-[980px] text-sm">
                    <thead className={componentsTableHead}>
                      <tr>
                        {['Mã cấu kiện', 'Tên cấu kiện', 'Loại / Profile', 'Dự án', 'Trạng thái', 'Vị trí', 'SL', 'Đã QC', ''].map((heading) => (
                          <th key={heading} className="px-3 py-2 text-left font-medium">{heading}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {isLoading ? (
                        <tr><td colSpan={9} className="px-3 py-8 text-center text-slate-400">Đang tải cấu kiện...</td></tr>
                      ) : filtered.slice(0, 8).map((row) => (
                        <tr key={row.id} className={componentsTableRow}>
                          <td className="px-3 py-2 font-medium text-blue-300">{row.code}</td>
                          <td className="px-3 py-2">{row.name}</td>
                          <td className="px-3 py-2">{row.profile}</td>
                          <td className="px-3 py-2">{row.project}</td>
                          <td className="px-3 py-2"><span className={`rounded-full border px-2 py-1 text-[11px] ${statusTone(row.status)}`}>{row.status}</span></td>
                          <td className="px-3 py-2">{row.location}</td>
                          <td className="px-3 py-2">{formatQuantity(row.quantity, 0)}</td>
                          <td className="px-3 py-2 text-emerald-300">{formatQuantity(row.qcQuantity, 0)}</td>
                          <td className="px-3 py-2 text-slate-500">...</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </ComponentsPanel>

            <div className="grid grid-cols-1 gap-3 xl:grid-cols-[0.45fr_0.55fr]">
              <ComponentsPanel title="Trạng thái sản xuất">
                <div className="space-y-3">
                  {progressBars.length ? progressBars.map((row) => (
                    <div key={row.code} className="grid grid-cols-[100px_90px_1fr_40px] items-center gap-3 text-xs">
                      <span className="text-blue-300">{row.code}</span>
                      <span className="truncate text-slate-400">{row.project}</span>
                      <div className="h-2 rounded-full bg-white/10"><div className={`h-full rounded-full ${row.color}`} style={{ width: `${row.value}%` }} /></div>
                      <span className="text-right text-white">{row.value}%</span>
                    </div>
                  )) : <p className="text-sm text-slate-500">Chưa có lệnh sản xuất.</p>}
                </div>
              </ComponentsPanel>
              <ComponentsPanel title="Sơ đồ cấu kiện">
                <div className="relative h-48 overflow-hidden rounded-xl border border-white/10 bg-[radial-gradient(circle_at_50%_20%,rgba(59,130,246,0.18),transparent_42%),linear-gradient(180deg,rgba(15,23,42,0.8),rgba(2,6,23,0.8))]">
                  <svg viewBox="0 0 520 210" className="h-full w-full">
                    <g fill="none" stroke="#7dd3fc" strokeLinecap="round" strokeLinejoin="round" opacity="0.95">
                      <path d="M86 137 L416 92 L446 105 L117 153 Z" strokeWidth="2" />
                      <path d="M104 120 L396 80 L416 92 L86 137 Z" strokeWidth="1.4" opacity="0.7" />
                      {Array.from({ length: 8 }).map((_, index) => {
                        const x = 118 + index * 38
                        return <path key={index} d={`M${x} 116 L${x + 20} 145 M${x + 12} 98 L${x + 32} 128`} strokeWidth="1" opacity="0.7" />
                      })}
                      <path d="M135 151 V174 M382 115 V139 M252 135 V163" strokeWidth="3" />
                      <path d="M112 174 H160 M357 139 H410 M228 163 H280" strokeWidth="2" />
                      <path d="M70 168 L110 168 M70 168 L70 134 M70 134 L76 144 M70 134 L64 144" stroke="#22c55e" />
                      <path d="M70 168 L100 190 M100 190 L91 189 M100 190 L96 181" stroke="#ef4444" />
                      <path d="M70 168 L70 105 M70 105 L64 116 M70 105 L76 116" stroke="#38bdf8" />
                    </g>
                  </svg>
                </div>
              </ComponentsPanel>
            </div>
          </div>

          <aside className="space-y-3">
            <ComponentsPanel title="Phân loại theo loại" action="Xem chi tiết">
              <ComponentsDonut centerValue={formatQuantity(rows.length, 0)} centerLabel="Tổng" segments={typeSegments.length ? typeSegments : [{ label: 'Chưa có dữ liệu', value: 1, color: '#334155' }]} />
            </ComponentsPanel>
            <ComponentsPanel title="Tiến độ sản xuất" action={<span className="text-[11px] text-slate-400">Tháng này</span>}>
              <ComponentsMiniBars values={[260, 520, 480, 660, 720, 890, 860, 980, 1210, 1180, 1360, 1480]} tone="emerald" />
            </ComponentsPanel>
            <ComponentsPanel title="Top cấu kiện nhiều nhất" action="Xem tất cả">
              <div className="space-y-3">
                {topProfiles.map(([profile, value]) => (
                  <div key={profile} className="grid grid-cols-[1fr_70px_44px] items-center gap-2 text-xs">
                    <div className="min-w-0">
                      <div className="truncate text-slate-200">{profile}</div>
                      <div className="mt-1 h-2 rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400" style={{ width: `${Math.max(8, (value / maxTop) * 100)}%` }} /></div>
                    </div>
                    <span className="text-right text-white">{formatQuantity(value, 0)}</span>
                    <span className="text-right text-slate-400">{((value / Math.max(1, rows.reduce((sum, row) => sum + row.quantity, 0))) * 100).toFixed(1)}%</span>
                  </div>
                ))}
                {!topProfiles.length ? <p className="text-sm text-slate-500">Chưa có dữ liệu.</p> : null}
              </div>
            </ComponentsPanel>
          </aside>
        </div>
      </div>
    </EnterpriseModulePage>
  )
}
