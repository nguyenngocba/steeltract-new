import { EnterpriseModulePage } from '../../../../shared/runtime-tabs/EnterpriseModulePage'
import { EnterpriseTabBar } from '../../../../shared/runtime-tabs/EnterpriseTabBar'
import { SectionHeader } from '../../../../shared/ui/enterprise'
import { componentsTabs } from '../../config/components-tabs'
import { ComponentsFilterBar, ComponentsKpiCard, ComponentsPanel } from './ComponentsCockpitShared'

export function ComponentsTransfersPage() {
  return (
    <EnterpriseModulePage>
      <SectionHeader title="Cấu kiện > Chuyển cấu kiện" description="Điều phối luồng cấu kiện giữa bãi, kho cấu kiện và công trình." />
      <EnterpriseTabBar tabs={componentsTabs} />

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-6">
          <ComponentsKpiCard title="Tổng lệnh chuyển" value="412" />
          <ComponentsKpiCard title="Đang thực hiện" value="28" sub="6,8%" />
          <ComponentsKpiCard title="Hoàn thành" value="356" sub="86,4%" />
          <ComponentsKpiCard title="Đã hủy" value="28" sub="6,8%" />
          <ComponentsKpiCard title="Chờ thực hiện" value="16" sub="3,9%" />
          <ComponentsKpiCard title="Tổng số lượng" value="1.248 tấn" />
        </div>

        <ComponentsFilterBar>
          <input placeholder="Tìm theo mã lệnh, cấu kiện, nơi đi, nơi đến..." className="h-10 rounded-lg border border-slate-700 bg-[#050d18] px-3 text-sm text-slate-100 xl:col-span-4" />
          {['Trạng thái', 'Loại chuyển', 'Nơi đi', 'Nơi đến'].map((x) => (
            <select key={x} className="h-10 rounded-lg border border-slate-700 bg-[#050d18] px-3 text-sm text-slate-100 xl:col-span-2">
              <option>{x}</option>
            </select>
          ))}
          <input type="date" className="h-10 rounded-lg border border-slate-700 bg-[#050d18] px-3 text-sm text-slate-100 xl:col-span-2" />
        </ComponentsFilterBar>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <div className="xl:col-span-9">
            <ComponentsPanel title="Danh sách lệnh chuyển cấu kiện (412)">
              <div className="overflow-auto">
                <table className="w-full min-w-[1050px] text-sm">
                  <thead className="text-xs uppercase text-slate-400">
                    <tr>
                      {['Mã lệnh', 'Ngày tạo', 'Loại chuyển', 'Nơi đi', 'Nơi đến', 'Số cấu kiện', 'Tổng KL (tấn)', 'Trạng thái', 'Người tạo'].map((h) => (
                        <th key={h} className="px-2 py-2 text-left font-medium">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['TR-2506-0412', '29/06/2025 09:15', 'Nội bộ bãi', 'Bãi số 1 - A02', 'Bãi số 3 - C05', 18, 12.45, 'Đang thực hiện', 'Nguyễn Văn A'],
                      ['TR-2506-0411', '29/06/2025 08:40', 'Nội bộ bãi', 'Bãi số 2 - B01', 'Bãi số 1 - A03', 12, 8.23, 'Chờ thực hiện', 'Trần Minh B'],
                      ['TR-2506-0410', '28/06/2025 16:20', 'Bãi → Kho', 'Bãi số 1 - A01', 'Kho cấu kiện', 25, 15.68, 'Hoàn thành', 'Phạm Văn C'],
                    ].map((row) => (
                      <tr key={row[0] as string} className="border-t border-slate-800/80 text-slate-200">
                        {row.map((c) => (
                          <td key={`${row[0]}-${String(c)}`} className="px-2 py-2">
                            {typeof c === 'number' ? c.toLocaleString('vi-VN') : c}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ComponentsPanel>
          </div>

          <div className="space-y-4 xl:col-span-3">
            <ComponentsPanel title="Chi tiết lệnh chuyển">
              <div className="space-y-2 text-sm text-slate-300">
                <div className="text-xl font-semibold text-white">TR-2506-0410</div>
                <div>Nơi đi: Bãi số 1 - A01</div>
                <div>Nơi đến: Kho cấu kiện</div>
                <div>Số cấu kiện: 25</div>
                <div>Tổng khối lượng: 15.680 tấn</div>
              </div>
            </ComponentsPanel>
            <ComponentsPanel title="Danh sách cấu kiện (25)" action="Xem tất cả">
              {['CPL-BEAM-001256 - 8 kiện', 'CPL-COL-000986 - 6 kiện', 'CPL-PLT-000457 - 5 kiện'].map((x) => (
                <div key={x} className="mb-2 text-sm text-slate-300">
                  {x}
                </div>
              ))}
            </ComponentsPanel>
          </div>
        </div>
      </div>
    </EnterpriseModulePage>
  )
}
