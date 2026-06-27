import { useEffect, useMemo, useState } from 'react'
import { BarChart3, Package } from 'lucide-react'

import { EnterpriseModulePage } from '../../../../shared/runtime-tabs/EnterpriseModulePage'
import { ModuleEmptyState, ModuleFilterBar, ModuleLoadingState } from '../../../../shared/ui/modules'
import { CockpitChartCard, CockpitKpiCard, CockpitTableShell, COCKPIT_HEIGHTS, DataTablePagination } from '../../../../shared/ui/cockpit'
import { useProductionOrders } from '../../../production/hooks/useProductionCockpit'
import { useYardSlotsRuntime } from '../../../yard/hooks/queries/useYardRuntime'
import { useComponents } from '../../hooks/queries/useComponents'
import { formatQuantity } from '@/shared/utils/number-format'
import {
  ComponentsDonut,
  ComponentsMiniBars,
  ComponentsSelect,
  componentsInput,
  componentsMutedButton,
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
  const [page, setPage] = useState(1)

  useEffect(() => {
    setPage(1)
  }, [project, status, location, type, query])

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
  const pageSize = 14
  const paginatedRows = filtered.slice((page - 1) * pageSize, page * pageSize)

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
      <div className="w-full min-w-0 flex-1 space-y-1">
        <div className="grid grid-cols-1 gap-1 md:grid-cols-2 xl:grid-cols-6">
          <CockpitKpiCard title="Tổng số cấu kiện" value={formatQuantity(statusCounts.total, 0)} note="+8,6% so với tháng trước" tone="blue" state="normal" trendData={[8, 10, 12, 13, statusCounts.total]} />
          <CockpitKpiCard title="Đang sản xuất" value={formatQuantity(statusCounts.producing, 0)} note="+18,2%" tone="purple" state="normal" trendData={[2, 3, 4, 5, statusCounts.producing]} />
          <CockpitKpiCard title="Tồn kho cấu kiện" value={formatQuantity(statusCounts.stock, 0)} note="+43,2%" tone="amber" state="normal" trendData={[3, 4, 6, 7, statusCounts.stock]} />
          <CockpitKpiCard title="Đã QC đạt" value={formatQuantity(statusCounts.qcPass, 0)} note="+77,1%" tone="emerald" state="normal" trendData={[1, 2, 4, 6, statusCounts.qcPass]} />
          <CockpitKpiCard title="QC không đạt" value={formatQuantity(statusCounts.qcFail, 0)} note="+2,7%" tone="red" state="normal" trendData={[0, 1, 1, 2, statusCounts.qcFail]} />
          <CockpitKpiCard title="Đang chuyển" value={formatQuantity(statusCounts.transferring, 0)} note="+6,0%" tone="cyan" state="normal" trendData={[1, 1, 2, 3, statusCounts.transferring]} />
        </div>

        <ModuleFilterBar>
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
        </ModuleFilterBar>

        <div className="grid grid-cols-12 gap-1">
          <div className="col-span-12 xl:col-span-9">
            <CockpitChartCard title={`Danh sách cấu kiện (${filtered.length})`} className={COCKPIT_HEIGHTS.TABLE_MD}>
              <CockpitTableShell className="h-full">
                <table className="w-full min-w-[980px] table-fixed text-[13px]">
                  <thead className="border-b border-cyan-400/10 bg-transparent text-slate-350">
                    <tr>
                      {['Mã cấu kiện', 'Tên cấu kiện', 'Loại / Profile', 'Dự án', 'Trạng thái', 'Vị trí', 'SL', 'Đã QC'].map((heading) => (
                        <th key={heading} className="px-4 py-2.5 text-left text-xs font-semibold text-slate-300 border-b border-cyan-400/10">{heading}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr><td colSpan={8} className="px-4 py-6"><ModuleLoadingState label="Đang tải cấu kiện..." /></td></tr>
                    ) : paginatedRows.map((row) => (
                      <tr key={row.id} className="border-b border-white/[0.04] text-slate-200 transition hover:bg-cyan-400/[0.04]">
                        <td className="truncate px-4 py-2.5 text-cyan-300 font-mono">{row.code}</td>
                        <td className="truncate px-4 py-2.5 text-white">{row.name}</td>
                        <td className="truncate px-4 py-2.5 text-slate-300">{row.profile}</td>
                        <td className="truncate px-4 py-2.5 text-slate-300">{row.project}</td>
                        <td className="px-4 py-2.5"><span className={`rounded-lg border px-2 py-0.5 text-xs ${statusTone(row.status)}`}>{row.status}</span></td>
                        <td className="truncate px-4 py-2.5 text-slate-300">{row.location}</td>
                        <td className="px-4 py-2.5 font-mono tabular-nums text-cyan-300">{formatQuantity(row.quantity, 0)}</td>
                        <td className="px-4 py-2.5 font-mono tabular-nums text-emerald-300">{formatQuantity(row.qcQuantity, 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CockpitTableShell>
              {!isLoading && !filtered.length ? (
                <div className="p-3">
                  <ModuleEmptyState icon={<Package size={18} />} title="Chưa có dữ liệu cấu kiện" description="Không tìm thấy cấu kiện phù hợp với bộ lọc hiện tại." />
                </div>
              ) : null}
            </CockpitChartCard>
            <DataTablePagination page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} />
          </div>

          <aside className="col-span-12 space-y-1 xl:col-span-3">
            <CockpitChartCard title="Tổng hợp" className={COCKPIT_HEIGHTS.CHART_SM}>
              <ComponentsDonut centerValue={formatQuantity(rows.length, 0)} centerLabel="Tổng" segments={typeSegments.length ? typeSegments : [{ label: 'Chưa có dữ liệu', value: 1, color: '#334155' }]} />
            </CockpitChartCard>
            <CockpitChartCard title="Hoạt động" className={COCKPIT_HEIGHTS.CHART_SM}>
              <ComponentsMiniBars values={[260, 520, 480, 660, 720, 890, 860, 980, 1210, 1180, 1360, 1480]} tone="emerald" />
            </CockpitChartCard>
            <CockpitChartCard title="Thống kê" className={COCKPIT_HEIGHTS.CHART_SM}>
              <div className="space-y-1">
                {topProfiles.map(([profile, value]) => (
                  <div key={profile} className="grid grid-cols-[1fr_70px_44px] items-center gap-1 text-xs">
                    <div className="min-w-0">
                      <div className="truncate text-slate-200">{profile}</div>
                      <div className="mt-1 h-2 rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400" style={{ width: `${Math.max(8, (value / maxTop) * 100)}%` }} /></div>
                    </div>
                    <span className="text-right text-white">{formatQuantity(value, 0)}</span>
                    <span className="text-right text-slate-400">{((value / Math.max(1, rows.reduce((sum, row) => sum + row.quantity, 0))) * 100).toFixed(1)}%</span>
                  </div>
                ))}
                {!topProfiles.length ? <ModuleEmptyState icon={<BarChart3 size={18} />} title="Chưa có thống kê" description="Các cấu kiện theo profile sẽ hiển thị tại đây." /> : null}
              </div>
            </CockpitChartCard>
          </aside>
        </div>
      </div>
    </EnterpriseModulePage>
  )
}
