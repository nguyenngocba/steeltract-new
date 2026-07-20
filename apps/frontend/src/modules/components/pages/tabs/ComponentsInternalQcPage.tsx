import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, ClipboardCheck, Search, ShieldAlert } from 'lucide-react'

import { ComponentsWorkspace } from '../../components/ComponentsWorkspace'
import { CockpitChartCard, CockpitKpiCard, CockpitTableShell, COCKPIT_HEIGHTS, DataTablePagination } from '../../../../shared/ui/cockpit'
import { ModuleEmptyState, ModuleFilterBar, ModuleLoadingState } from '../../../../shared/ui/modules'
import { useComponents } from '../../hooks/queries/useComponents'
import { formatQuantity } from '@/shared/utils/number-format'
import { ComponentsDonut, componentsInput, componentsMutedButton } from './ComponentsCockpitShared'

function qcDisposition(status: string) {
  if (['READY', 'SHIPPED', 'DELIVERED', 'INSTALLED'].includes(status)) return 'Đạt'
  if (['CUTTING', 'WELDING', 'PAINTING'].includes(status)) return 'Đang kiểm'
  return 'Chờ dữ liệu'
}

function qcArea(status: string) {
  if (status === 'WELDING') return 'Hàn'
  if (status === 'PAINTING') return 'Sơn'
  if (status === 'CUTTING') return 'Kích thước'
  return 'Tổng hợp'
}

export function ComponentsInternalQcPage() {
  const { data: components = [], isLoading, isError } = useComponents()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 14

  useEffect(() => {
    setPage(1)
  }, [query, status])

  const rows = useMemo(() => components.map((component) => ({
    id: component.id,
    code: component.code,
    name: component.name,
    project: component.project?.code ?? component.project?.name ?? '-',
    status: component.status,
    area: qcArea(component.status),
    result: qcDisposition(component.status),
    location: [component.zone, component.position].filter(Boolean).join(' / ') || '-',
    updatedAt: component.updatedAt ? new Date(component.updatedAt).toLocaleDateString('vi-VN') : '-',
  })).filter((row) => {
    if (status && row.result !== status) return false
    if (!query.trim()) return true
    return `${row.code} ${row.name} ${row.project} ${row.area} ${row.result}`.toLowerCase().includes(query.toLowerCase())
  }), [components, query, status])

  const passedCount = rows.filter((row) => row.result === 'Đạt').length
  const activeCount = rows.filter((row) => row.result === 'Đang kiểm').length
  const waitingCount = rows.filter((row) => row.result === 'Chờ dữ liệu').length
  const readyToShipCount = rows.filter((row) => ['READY', 'SHIPPED', 'DELIVERED', 'INSTALLED'].includes(row.status)).length
  const pageRows = rows.slice((page - 1) * pageSize, page * pageSize)

  return (
    <ComponentsWorkspace>
      <div className="w-full min-w-0 flex-1 space-y-1">
        <div className="grid grid-cols-1 gap-1 md:grid-cols-3 xl:grid-cols-6">
          <CockpitKpiCard title="Cấu kiện cần QC" value={formatQuantity(rows.length, 0)} note="Dữ liệu cấu kiện" state="normal" tone="cyan" />
          <CockpitKpiCard title="QC đạt" value={formatQuantity(passedCount, 0)} note="READY trở lên" state="normal" tone="emerald" />
          <CockpitKpiCard title="Đang kiểm" value={formatQuantity(activeCount, 0)} note="Cut / Weld / Paint" state="normal" tone="blue" />
          <CockpitKpiCard title="Chờ QC fact" value={formatQuantity(waitingCount, 0)} note="Chưa có result riêng" state="normal" tone="amber" />
          <CockpitKpiCard title="Ready to ship" value={formatQuantity(readyToShipCount, 0)} note="Có thể chuyển bãi" state="normal" tone="purple" />
          <CockpitKpiCard title="Nguồn dữ liệu" value="Đang cập nhật" note="Lifecycle cấu kiện" state="normal" tone="red" />
        </div>

        <ModuleFilterBar>
          <div className="flex min-w-64 items-center gap-2 rounded-lg border border-white/10 bg-slate-950/45 px-2 xl:col-span-6">
            <Search size={15} className="text-cyan-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm mã cấu kiện, tên, dự án, khu vực QC..."
              className={`${componentsInput} w-full border-0 bg-transparent px-0 focus:border-0 focus:bg-transparent`}
            />
          </div>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className={`${componentsInput} xl:col-span-3`}>
            <option value="">Kết quả: Tất cả</option>
            <option value="Đạt">Đạt</option>
            <option value="Đang kiểm">Đang kiểm</option>
            <option value="Chờ dữ liệu">Chờ dữ liệu</option>
          </select>
          <button type="button" onClick={() => { setQuery(''); setStatus('') }} className={`${componentsMutedButton} xl:col-span-2`}>Làm mới</button>
        </ModuleFilterBar>

        {isError ? (
          <ModuleEmptyState icon={<ShieldAlert size={18} />} title="Không thể tải dữ liệu QC cấu kiện" description="Kiểm tra kết nối hoặc quyền truy cập Components." />
        ) : (
          <div className="grid grid-cols-1 gap-1 xl:grid-cols-12">
            <div className="xl:col-span-9">
              <CockpitChartCard title={`Hàng đợi QC cấu kiện (${rows.length})`} subtitle="Theo lifecycle cấu kiện hiện có" className={COCKPIT_HEIGHTS.TABLE_MD}>
                <CockpitTableShell className="h-full">
                  <table className="w-full min-w-[960px] table-fixed text-[13px]">
                    <thead className="border-b border-cyan-400/10 bg-transparent text-slate-300">
                      <tr>
                        {['Mã cấu kiện', 'Tên', 'Dự án', 'Khu vực QC', 'Lifecycle', 'Kết quả', 'Vị trí', 'Cập nhật'].map((heading) => (
                          <th key={heading} className="px-3 py-2 text-left text-xs font-semibold text-slate-300">{heading}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {isLoading ? (
                        <tr><td colSpan={8} className="px-3 py-8"><ModuleLoadingState label="Đang tải QC cấu kiện..." /></td></tr>
                      ) : pageRows.length ? pageRows.map((row) => (
                        <tr key={row.id} className="border-b border-white/[0.04] text-slate-200 transition hover:bg-cyan-400/[0.04]">
                          <td className="truncate px-3 py-2 font-mono text-cyan-300">{row.code}</td>
                          <td className="truncate px-3 py-2 text-white">{row.name}</td>
                          <td className="truncate px-3 py-2">{row.project}</td>
                          <td className="px-3 py-2">{row.area}</td>
                          <td className="px-3 py-2">{row.status}</td>
                          <td className={`px-3 py-2 ${row.result === 'Đạt' ? 'text-emerald-300' : row.result === 'Đang kiểm' ? 'text-cyan-300' : 'text-amber-300'}`}>{row.result}</td>
                          <td className="truncate px-3 py-2">{row.location}</td>
                          <td className="px-3 py-2">{row.updatedAt}</td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={8} className="px-3 py-10">
                            <ModuleEmptyState icon={<ClipboardCheck size={18} />} title="Chưa có dữ liệu QC cấu kiện" description="Không tìm thấy cấu kiện phù hợp với bộ lọc hiện tại." />
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </CockpitTableShell>
                <DataTablePagination page={page} pageSize={pageSize} total={rows.length} onPageChange={setPage} />
              </CockpitChartCard>
            </div>

            <div className="space-y-1 xl:col-span-3">
              <CockpitChartCard title="Phân bổ QC" className={COCKPIT_HEIGHTS.CHART_SM}>
                <ComponentsDonut centerValue={formatQuantity(rows.length, 0)} centerLabel="QC" segments={[
                  { label: 'Đạt', value: passedCount, color: '#14c987' },
                  { label: 'Đang kiểm', value: activeCount, color: '#06b6d4' },
                  { label: 'Chờ', value: waitingCount, color: '#f59e0b' },
                ]} />
              </CockpitChartCard>
              <CockpitChartCard title="NCR" className={COCKPIT_HEIGHTS.CHART_SM}>
                <ModuleEmptyState icon={<ShieldAlert size={18} />} title="Chưa có NCR từ API" description="NCR thật sẽ hiển thị khi QC domain cung cấp contract." />
              </CockpitChartCard>
              <CockpitChartCard title="Gần đây" className={COCKPIT_HEIGHTS.CHART_SM}>
                {rows.slice(0, 5).map((row) => (
                  <div key={row.id} className="mb-1 flex justify-between gap-2 text-xs text-slate-300">
                    <span className="truncate text-cyan-300">{row.code}</span>
                    <span className="shrink-0">{row.result}</span>
                  </div>
                ))}
                {!rows.length ? <ModuleEmptyState icon={<CheckCircle2 size={18} />} title="Chưa có hoạt động" description="Không có cấu kiện trong bộ lọc hiện tại." /> : null}
              </CockpitChartCard>
            </div>
          </div>
        )}
      </div>
    </ComponentsWorkspace>
  )
}
