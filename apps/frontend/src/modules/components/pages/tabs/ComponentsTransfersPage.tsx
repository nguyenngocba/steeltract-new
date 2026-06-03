import { useState } from 'react'

import { EnterpriseModulePage } from '../../../../shared/runtime-tabs/EnterpriseModulePage'
import { EnterpriseTabBar } from '../../../../shared/runtime-tabs/EnterpriseTabBar'
import { SectionHeader } from '../../../../shared/ui/enterprise'
import { useYardMovementsRuntime } from '../../../yard/hooks/queries/useYardRuntime'
import { componentsTabs } from '../../config/components-tabs'
import { ComponentsFilterBar, ComponentsKpiCard, ComponentsPanel } from './ComponentsCockpitShared'

export function ComponentsTransfersPage() {
  const { data: movements = [], isLoading } = useYardMovementsRuntime()
  const [query, setQuery] = useState('')
  const rows = movements
    .filter((movement) => movement.type === 'MOVE')
    .filter((movement) => {
      if (!query.trim()) return true
      return `${movement.itemCode} ${movement.fromSlot?.code ?? ''} ${movement.toSlot?.code ?? ''}`.toLowerCase().includes(query.toLowerCase())
    })

  return (
    <EnterpriseModulePage>
      <SectionHeader title="Cấu kiện > Chuyển cấu kiện" description="Điều phối cấu kiện theo movement thực tế trong bãi tập kết." />
      <EnterpriseTabBar tabs={componentsTabs} />

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-4">
          <ComponentsKpiCard title="Tổng lệnh chuyển" value={rows.length.toLocaleString('vi-VN')} />
          <ComponentsKpiCard title="Hoàn thành" value={rows.length.toLocaleString('vi-VN')} />
          <ComponentsKpiCard title="Nguồn dữ liệu" value="YARD MOVE" />
          <ComponentsKpiCard title="Cập nhật" value="LIVE" sub="5 giây/lần" />
        </div>

        <ComponentsFilterBar>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm mã cấu kiện, nơi đi, nơi đến..." className="h-10 rounded-lg border border-slate-700 bg-[#050d18] px-3 text-sm text-slate-100 xl:col-span-6" />
        </ComponentsFilterBar>

        <ComponentsPanel title={`Danh sách lệnh chuyển cấu kiện (${rows.length})`}>
          <div className="overflow-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="text-xs uppercase text-slate-400">
                <tr>
                  {['Thời gian', 'Cấu kiện', 'Nơi đi', 'Nơi đến', 'Trạng thái', 'Ghi chú'].map((heading) => (
                    <th key={heading} className="px-2 py-2 text-left font-medium">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={6} className="px-2 py-6 text-center text-slate-400">Đang tải lệnh chuyển...</td></tr>
                ) : rows.map((row) => (
                  <tr key={row.id} className="border-t border-slate-800/80 text-slate-200 hover:bg-slate-900/40">
                    <td className="px-2 py-2">{new Date(row.createdAt).toLocaleString('vi-VN')}</td>
                    <td className="px-2 py-2 text-cyan-300">{row.itemCode}</td>
                    <td className="px-2 py-2">{row.fromSlot?.zone?.code ?? '-'} / {row.fromSlot?.code ?? '-'}</td>
                    <td className="px-2 py-2">{row.toSlot?.zone?.code ?? '-'} / {row.toSlot?.code ?? '-'}</td>
                    <td className="px-2 py-2 text-emerald-300">Hoàn thành</td>
                    <td className="px-2 py-2">{row.reason ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ComponentsPanel>
      </div>
    </EnterpriseModulePage>
  )
}
