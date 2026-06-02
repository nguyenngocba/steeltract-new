import { EnterpriseModulePage } from '../../../../shared/runtime-tabs/EnterpriseModulePage'
import { EnterpriseTabBar } from '../../../../shared/runtime-tabs/EnterpriseTabBar'
import { SectionHeader } from '../../../../shared/ui/enterprise'
import { componentsTabs } from '../../config/components-tabs'
import { ComponentsFilterBar, ComponentsKpiCard, ComponentsPanel } from './ComponentsCockpitShared'

export function ComponentsHistoryPage() {
  return (
    <EnterpriseModulePage>
      <SectionHeader title="Cấu kiện > Lịch sử gia công" description="Theo dõi lịch sử công đoạn gia công, QC và kết quả cuối của từng cấu kiện." />
      <EnterpriseTabBar tabs={componentsTabs} />

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-6">
          <ComponentsKpiCard title="Tổng cấu kiện gia công" value="5.281" sub="+12,6%" />
          <ComponentsKpiCard title="Hoàn thành" value="4.562" sub="86,4%" />
          <ComponentsKpiCard title="Đang gia công" value="436" sub="8,3%" />
          <ComponentsKpiCard title="Chờ gia công" value="183" sub="3,5%" />
          <ComponentsKpiCard title="Lỗi / Phải làm lại" value="100" sub="1,9%" />
          <ComponentsKpiCard title="Kết quả đạt" value="5.181" />
        </div>

        <ComponentsFilterBar>
          <input placeholder="Tìm theo mã cấu kiện, tên cấu kiện, dự án..." className="h-10 rounded-lg border border-slate-700 bg-[#050d18] px-3 text-sm text-slate-100 xl:col-span-4" />
          {['Nhà máy', 'Xưởng', 'Công đoạn', 'Trạng thái'].map((x) => (
            <select key={x} className="h-10 rounded-lg border border-slate-700 bg-[#050d18] px-3 text-sm text-slate-100 xl:col-span-2">
              <option>{x}</option>
            </select>
          ))}
          <input type="date" className="h-10 rounded-lg border border-slate-700 bg-[#050d18] px-3 text-sm text-slate-100 xl:col-span-2" />
        </ComponentsFilterBar>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <div className="xl:col-span-9">
            <ComponentsPanel title="Danh sách lịch sử gia công (5.281)">
              <div className="overflow-auto">
                <table className="w-full min-w-[1120px] text-sm">
                  <thead className="text-xs uppercase text-slate-400">
                    <tr>
                      {['Mã cấu kiện', 'Tên cấu kiện', 'Số lệnh SX', 'Dự án', 'Xưởng', 'Công đoạn', 'Bắt đầu', 'Hoàn thành', 'Trạng thái', 'Kết quả'].map((h) => (
                        <th key={h} className="px-2 py-2 text-left font-medium">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['CPL-BEAM-001256', 'BEAM H450x200x10x16', 'SX-2506-0142', 'Nhà xưởng A', 'Workshop A', 'Cắt', '23/06/2025 08:15', '23/06/2025 09:20', 'Hoàn thành', 'Đạt'],
                      ['CPL-COL-000986', 'COLUMN H300x300x10x15', 'SX-2506-0138', 'Nhà xưởng B', 'Workshop A', 'Cắt', '23/06/2025 10:05', '23/06/2025 11:10', 'Hoàn thành', 'Đạt'],
                      ['CPL-BASE-000241', 'BASE PLATE 25mm', 'SX-2506-0143', 'Nhà xưởng B', 'Workshop B', 'Cắt', '24/06/2025 09:45', '24/06/2025 10:20', 'Lỗi', 'Không đạt'],
                    ].map((row) => (
                      <tr key={row[0] as string} className="border-t border-slate-800/80 text-slate-200">
                        {row.map((c) => (
                          <td key={`${row[0]}-${String(c)}`} className="px-2 py-2">
                            {c}
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
            <ComponentsPanel title="Chi tiết lịch sử gia công">
              <div className="space-y-2 text-sm text-slate-300">
                <div className="text-xl font-semibold text-white">CPL-BEAM-001256</div>
                <div>Xưởng: Workshop A</div>
                <div>Vật liệu: SS400</div>
                <div>Số lượng: 12 kiện</div>
              </div>
            </ComponentsPanel>
            <ComponentsPanel title="Quy trình gia công">
              {['Cắt 08:15 → 09:20 Đạt', 'Đục lỗ 09:25 → 10:10 Đạt', 'Hàn 10:15 → 12:30 Đạt', 'Kiểm tra QC 14:15 → 14:30 Đạt'].map((x) => (
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
