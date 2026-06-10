import { useState } from 'react'
import { createPortal } from 'react-dom'

type Props = {
  open: boolean
  detail?: any
  fallback?: any
  onClose: () => void
  onEdit?: () => void
}

function num(value: any) {
  const n = Number(value ?? 0)
  return Number.isFinite(n) ? n : 0
}

function money(value: any) {
  return `${Math.round(num(value)).toLocaleString('vi-VN')} đ`
}

function materialUsageLabel(value: string | undefined) {
  const map: Record<string, string> = {
    PRIMARY: 'Vật tư chính',
    SECONDARY: 'Vật tư phụ',
    CONSUMABLE: 'Vật tư tiêu hao',
  }
  return map[String(value ?? 'PRIMARY')] ?? 'Vật tư chính'
}

function MetricCard({ title, value, tone = 'cyan' }: { title: string; value: string; tone?: 'cyan' | 'emerald' | 'amber' | 'blue' }) {
  const toneClass = {
    cyan: 'from-cyan-400 to-blue-500 text-cyan-100',
    emerald: 'from-emerald-400 to-teal-500 text-emerald-100',
    amber: 'from-amber-400 to-orange-500 text-amber-100',
    blue: 'from-blue-400 to-indigo-500 text-blue-100',
  }[tone]

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.06] p-4 shadow-lg shadow-black/20">
      <div className={`mb-4 h-1 w-16 rounded-full bg-gradient-to-r ${toneClass}`} />
      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">{title}</div>
      <div className="mt-2 break-words text-2xl font-semibold text-white">{value}</div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/10 py-2 text-sm last:border-b-0">
      <span className="text-slate-400">{label}</span>
      <span className="text-right font-medium text-slate-100">{value}</span>
    </div>
  )
}

export function InventoryMaterialDetailModal({ open, detail, fallback, onClose, onEdit }: Props) {
  const [activeTab, setActiveTab] = useState('overview')
  const [focusedLocation, setFocusedLocation] = useState<any | null>(null)

  if (!open) return null

  const item = detail?.item ?? fallback ?? {}
  const code = item.code ?? fallback?.materialCode ?? fallback?.code ?? '-'
  const name = item.name ?? fallback?.materialName ?? fallback?.name ?? '-'
  const unit = item.unit ?? fallback?.unit ?? fallback?.unitCode ?? ''
  const currentStock = num(detail?.currentStock ?? fallback?.currentStock ?? fallback?.quantity)
  const averageCost = num(detail?.averageCost ?? fallback?.averageCost)
  const inventoryValue = num(fallback?.inventoryValue ?? currentStock * averageCost)
  const minimumStock = num(item.minimumStock ?? fallback?.minimumStock)
  const materialUsageType = item.materialUsageType ?? fallback?.materialUsageType ?? 'PRIMARY'
  const status = currentStock <= 0 ? 'Hết hàng' : currentStock <= minimumStock || currentStock <= 5 ? 'Cảnh báo' : 'Bình thường'
  const locationCount =
    detail?.locationBalances?.length ?? 0

  const locationLabel =
    `${locationCount} vị trí lưu kho`
  const inbound = detail?.inboundHistory ?? []
  const outbound = detail?.outboundHistory ?? []
  const projectRows = detail?.projectConsumptionHistory ?? []
  const supplierRows = detail?.supplierHistory ?? []
  const locationRows = detail?.locationBalances ?? []
  const supplier = detail?.supplierHistory?.[0]?.supplierName ?? '-'
  const tabs = [
    ['overview', 'Tổng quan'],
    ['inout', 'Nhập / Xuất'],
    ['projects', 'Công trình'],
    ['suppliers', 'Nhà cung cấp'],
    ['locations', 'Vị trí'],
    ['analytics', 'Phân tích'],
    ['logs', 'Lịch sử thay đổi'],
  ]

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-black/65 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-6xl overflow-auto rounded-2xl border border-white/10 bg-[#07111f]/95 shadow-2xl shadow-black/50">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">Chi tiết vật tư</div>
            <h3 className="mt-2 text-2xl font-semibold text-white">{code} · {name}</h3>
            <p className="mt-1 text-sm text-slate-400">
              {locationLabel}
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg border border-white/10 bg-white/[0.06] px-4 py-2 text-sm text-slate-200 hover:bg-white/10">
            Đóng
          </button>
        </div>

        <div className="grid grid-cols-1 gap-5 p-6 lg:grid-cols-[240px_1fr]">
          <div className="rounded-xl border border-white/10 bg-white/[0.045]">
            <div className="border-b border-white/10 px-4 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">Danh mục chi tiết</div>
            <div className="space-y-2 p-4">
              {tabs.map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`w-full rounded-lg border px-3 py-2.5 text-left text-sm transition ${
                    activeTab === key
                      ? 'border-cyan-400/60 bg-cyan-400/10 text-cyan-200'
                      : 'border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.07] hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-5">
            {activeTab === 'overview' && (
              <>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  <MetricCard title="Tồn hiện tại" value={`${currentStock.toLocaleString('vi-VN')} ${unit}`.trim()} tone="blue" />
                  <MetricCard title="Giá trung bình" value={money(averageCost)} tone="cyan" />
                  <MetricCard title="Giá trị tồn" value={money(inventoryValue)} tone="emerald" />
                  <MetricCard title="Trạng thái" value={status} tone={status === 'Bình thường' ? 'emerald' : 'amber'} />
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.045] p-4">
                  <div className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-cyan-300">Thông tin vật tư</div>
                  <InfoRow label="Mã vật tư" value={code} />
                  <InfoRow label="Tên vật tư" value={name} />
                  <InfoRow label="Loại vật tư" value={materialUsageLabel(materialUsageType)} />
                  <InfoRow label="Đơn vị" value={unit || '-'} />
                  <InfoRow label="Tồn tối thiểu" value={minimumStock.toLocaleString('vi-VN')} />
                  <InfoRow label="Nhà cung cấp gần nhất" value={supplier} />
                </div>
              </>
            )}

            {activeTab === 'inout' && (
              <DetailTable
                title="Lịch sử nhập / xuất"
                headers={['Thời gian', 'Loại', 'Đối tượng', 'Số lượng', 'Giá trị']}
                rows={[...inbound.map((x: any) => ({ ...x, rowType: 'INBOUND' })), ...outbound.map((x: any) => ({ ...x, rowType: 'OUTBOUND' }))]
                  .sort((a: any, b: any) => +new Date(b.transactionDate) - +new Date(a.transactionDate))
                  .slice(0, 12)
                  .map((row: any) => [
                    row.transactionDate ? new Date(row.transactionDate).toLocaleString('vi-VN') : '-',
                    row.rowType === 'INBOUND' ? 'Nhập kho' : 'Xuất kho',
                    row.supplierName ?? row.projectName ?? row.transactionNo ?? '-',
                    num(row.quantity).toLocaleString('vi-VN'),
                    money(row.totalAmount ?? num(row.quantity) * num(row.unitPrice ?? averageCost)),
                  ])}
              />
            )}

            {activeTab === 'projects' && (
              <DetailTable
                title="Công trình sử dụng"
                headers={['Công trình', 'Đã xuất', 'Đã trả', 'Giá trị']}
                rows={projectRows.slice(0, 12).map((row: any) => [
                  row.projectName ?? 'Không rõ',
                  num(row.issuedQty ?? row.quantity).toLocaleString('vi-VN'),
                  num(row.returnedQty).toLocaleString('vi-VN'),
                  money(row.issuedValue ?? num(row.quantity) * averageCost),
                ])}
              />
            )}

            {activeTab === 'suppliers' && (
              <DetailTable
                title="Nhà cung cấp"
                headers={['Nhà cung cấp', 'Số lượng nhập', 'Đơn giá nhập', 'Tổng giá trị']}
                rows={supplierRows.slice(0, 12).map((row: any) => [
                  row.supplierName ?? 'Không rõ',
                  num(row.quantity).toLocaleString('vi-VN'),
                  money(row.unitPrice ?? row.latestUnitPrice ?? averageCost),
                  money(row.totalValue ?? row.totalAmount ?? num(row.quantity) * num(row.unitPrice ?? averageCost)),
                ])}
              />
            )}

            {activeTab === 'locations' && (
              <LocationBalancePanel
                rows={locationRows}
                onFocus={setFocusedLocation}
              />
            )}

            {activeTab === 'analytics' && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <MetricCard title="Lần nhập" value={inbound.length.toLocaleString('vi-VN')} tone="cyan" />
                <MetricCard title="Lần xuất" value={outbound.length.toLocaleString('vi-VN')} tone="amber" />
                <MetricCard title="Giá trị tồn" value={money(inventoryValue)} tone="emerald" />
                <MetricCard title="Tốc độ luân chuyển" value={`${outbound.length}/tháng`} tone="blue" />
              </div>
            )}

            {activeTab === 'logs' && (
              <div className="rounded-xl border border-white/10 bg-white/[0.045] p-4">
                <div className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-cyan-300">Lịch sử thay đổi</div>
                {[...inbound.slice(0, 4), ...outbound.slice(0, 4)].map((row: any, index: number) => (
                  <div key={`${row.transactionNo}-${index}`} className="mb-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-300">
                    {row.transactionNo ?? 'Giao dịch'} · {row.transactionDate ? new Date(row.transactionDate).toLocaleString('vi-VN') : '-'}
                  </div>
                ))}
                {inbound.length + outbound.length === 0 && <div className="text-sm text-slate-500">Chưa có lịch sử thay đổi.</div>}
              </div>
            )}

            {onEdit && (
              <button onClick={onEdit} className="rounded-lg border border-amber-300/30 bg-amber-400/10 px-4 py-3 text-sm font-semibold text-amber-200 hover:bg-amber-400/15">
                Sửa vật tư
              </button>
            )}
          </div>
        </div>
      </div>
      {focusedLocation ? <LocationFocusPreview location={focusedLocation} onClose={() => setFocusedLocation(null)} /> : null}
    </div>,
    document.body,
  )
}

function LocationBalancePanel({ rows, onFocus }: { rows: any[]; onFocus: (row: any) => void }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.045]">
      <div className="border-b border-white/10 px-4 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-cyan-300">Vị trí tồn</div>
      <div className="overflow-auto">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="bg-white/[0.05] text-xs uppercase text-slate-400">
            <tr>
              {['Kho', 'Zone', 'Ô chứa', 'Tầng', 'Số lượng', 'Cập nhật', '2D'].map((header) => <th key={header} className="px-3 py-3 text-left">{header}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={`${row.zoneId ?? row.zoneName}-${index}`} className="border-t border-white/10 text-slate-200">
                <td className="px-3 py-2">{row.warehouseName ?? '-'}</td>
                <td className="px-3 py-2 text-cyan-300">{row.zoneName ?? '-'}</td>
                <td className="px-3 py-2">{row.zoneCode ?? '-'}</td>
                <td className="px-3 py-2">{row.slotId ?? '-'}</td>
                <td className="px-3 py-2">{row.level ?? '-'}</td>
                <td className="px-3 py-2">{num(row.quantity).toLocaleString('vi-VN')}</td>
                <td className="px-3 py-2">{row.updatedAt ? new Date(row.updatedAt).toLocaleString('vi-VN') : '-'}</td>
                <td className="px-3 py-2">
                  <button onClick={() => onFocus(row)} className="rounded-lg border border-cyan-400/40 bg-cyan-400/10 px-3 py-1.5 text-xs font-semibold text-cyan-200 hover:bg-cyan-400/15">Xem 2D</button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-slate-500">Chưa có dữ liệu vị trí.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
function slotRow(slotId?: string | null) {
  return String(slotId ?? '').substring(0, 1)
}

function slotColumn(slotId?: string | null) {
  return String(slotId ?? '').substring(1)
}
function LocationFocusPreview({ location, onClose }: { location: any; onClose: () => void }) {
  const row = slotRow(location.slotId)
  const column = slotColumn(location.slotId)

  const rows = buildFocusRows(row)
  const columns = buildFocusColumns(column)

  const selectedKey = `${row}-${column}`

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-2xl border border-white/10 bg-slate-950 p-5 shadow-2xl shadow-black/50">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">Focus vị trí 2D</div>
            <h3 className="mt-1 text-xl font-semibold text-white">{location.zoneName ?? 'Vị trí kho'}</h3>
            <p className="mt-1 text-sm text-slate-400">Slot {location.slotId ?? '-'} · Tầng {location.level ?? '-'} · {num(location.quantity).toLocaleString('vi-VN')}</p>
          </div>
          <button onClick={onClose} className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-slate-300 hover:bg-white/10">Đóng</button>
        </div>
        <div className="grid gap-1.5" style={{ gridTemplateColumns: `44px repeat(${columns.length}, minmax(56px, 1fr))` }}>
          <div />
          {columns.map((column) => <div key={column} className="rounded-lg border border-slate-800 bg-slate-900/60 px-2 py-1.5 text-center text-xs text-slate-400">{column}</div>)}
          {rows.map((row) => [
            <div key={`${row}-label`} className="rounded-lg border border-slate-800 bg-slate-900/60 px-2 py-3 text-center text-xs text-slate-400">{row}</div>,
            ...columns.map((column) => {
              const active = selectedKey === `${row}-${column}`
              return <div key={`${row}-${column}`} className={`min-h-[58px] rounded-lg border p-2 ${active ? 'border-cyan-300 bg-cyan-400/20 text-cyan-100 shadow-[0_0_28px_rgba(34,211,238,0.35)]' : 'border-slate-800 bg-slate-900/25 text-slate-700 opacity-40'}`}>
                <div className="text-xs font-semibold">{row}{column}</div>
                <div className="mt-3 text-[10px] uppercase tracking-[0.12em]">{active ? 'Focused' : 'Dimmed'}</div>
              </div>
            }),
          ])}
        </div>
      </div>
    </div>
  )
}

function buildFocusRows(current?: string | null) {
  const base = ['A', 'B', 'C', 'D', 'E', 'F']
  const row = String(current ?? '').trim().toUpperCase()
  if (!row || base.includes(row)) return base
  return [row, ...base].slice(0, 6)
}

function buildFocusColumns(current?: string | null) {
  const base = ['01', '02', '03', '04', '05', '06']
  const column = String(current ?? '').trim().padStart(2, '0')
  if (!column || base.includes(column)) return base
  return [column, ...base].slice(0, 6)
}

function DetailTable({ title, headers, rows }: { title: string; headers: string[]; rows: string[][] }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.045]">
      <div className="border-b border-white/10 px-4 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-cyan-300">{title}</div>
      <div className="overflow-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-white/[0.05] text-xs uppercase text-slate-400">
            <tr>
              {headers.map((header) => <th key={header} className="px-3 py-3 text-left">{header}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index} className="border-t border-white/10 text-slate-200">
                {row.map((cell, cellIndex) => <td key={cellIndex} className="px-3 py-2">{cell}</td>)}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={headers.length} className="px-3 py-8 text-center text-slate-500">Chưa có dữ liệu.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
