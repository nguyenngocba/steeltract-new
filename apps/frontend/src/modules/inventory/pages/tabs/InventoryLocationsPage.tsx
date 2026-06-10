import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Edit3, Eye, Layers3, MapPinned, Package, Power, PowerOff, Trash2, Warehouse, X } from 'lucide-react'

import { EnterpriseModulePage } from '../../../../shared/runtime-tabs/EnterpriseModulePage'
import { InventoryTabWorkspace } from '../../components/InventoryTabWorkspace'
import {
  CompactDonutSummary,
  HorizontalBars,
  InventoryChartCard,
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
import { activateZone, createZone, deactivateZone, deleteZone, getZoneDetail, updateZone, type WarehouseLocation, type WarehouseLocationDetail } from '../../api/zones.api'
import { useZones } from '../../hooks/useZones'
import { useWarehouses } from '../../hooks/useWarehouses'

const PAGE_SIZE = 10
const LOCATION_ROWS = ['A', 'B', 'C', 'D', 'E', 'F']
const LOCATION_COLUMNS = ['01', '02', '03', '04', '05', '06']
const LOCATION_LEVELS = ['L1', 'L2', 'L3', 'L4']
const TOTAL_CELL_LEVELS = LOCATION_ROWS.length * LOCATION_COLUMNS.length * LOCATION_LEVELS.length

type LocationForm = {
  id?: string
  code: string
  name: string
  row: string
  column: string
  level: string
  capacity: string
  description: string
  active: boolean
  warehouseId: string
}

const emptyForm: LocationForm = {
  code: '',
  name: '',
  row: '',
  column: '',
  level: '',
  capacity: '',
  description: '',
  active: true,
  warehouseId: '',
}

function n(value: unknown) {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function auditZone(zone: WarehouseLocation) {
  if (zone.code.startsWith('DEMO-')) return 'Demo record'
  if (zone.code.startsWith('ST-WH-')) return 'Warehouse-like record'
  if (zone.row || zone.column || zone.level || /^[A-Z]\d{2}$/i.test(zone.code)) return 'Real storage location'
  return 'Needs review'
}

function isRealStorageLocation(zone: WarehouseLocation) {
  return auditZone(zone) === 'Real storage location'
}

export function InventoryLocationsPage() {
  const queryClient = useQueryClient()
  const { data: zones = [], isLoading } = useZones()
  const { data: warehouses = [] } = useWarehouses()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [audit, setAudit] = useState<'all' | 'Demo record' | 'Warehouse-like record' | 'Real storage location' | 'Needs review'>('all')
  const [page, setPage] = useState(1)
  const [form, setForm] = useState<LocationForm | null>(null)
  const [detailId, setDetailId] = useState('')
  const { data: detail } = useQuery({
    queryKey: ['inventory-zone-detail', detailId],
    queryFn: () => getZoneDetail(detailId),
    enabled: Boolean(detailId),
  })

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['inventory-zones'] }),
      queryClient.invalidateQueries({ queryKey: ['inventory-zone-detail'] }),
    ])
  }

  const saveMutation = useMutation({
    mutationFn: async (payload: LocationForm) => {
      const body = {
        code: payload.code,
        name: payload.name,
        row: payload.row || undefined,
        column: payload.column || undefined,
        level: payload.level || undefined,
        capacity: n(payload.capacity),
        description: payload.description || undefined,
        active: payload.active,
        warehouseId: payload.warehouseId || undefined,
      }
      if (payload.id) return updateZone(payload.id, body)
      return createZone(body)
    },
    onSuccess: async () => {
      setForm(null)
      await refresh()
    },
  })
  const activateMutation = useMutation({ mutationFn: activateZone, onSuccess: refresh })
  const deactivateMutation = useMutation({ mutationFn: deactivateZone, onSuccess: refresh })
  const deleteMutation = useMutation({ mutationFn: deleteZone, onSuccess: refresh })

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return (zones as WarehouseLocation[])
      .filter(isRealStorageLocation)
      .map((zone) => ({ ...zone, auditType: auditZone(zone) }))
      .filter((zone) => {
        if (status === 'active' && !zone.active) return false
        if (status === 'inactive' && zone.active) return false
        if (audit !== 'all' && zone.auditType !== audit) return false
        if (!q) return true
        return [zone.code, zone.name, zone.row, zone.column, zone.level, zone.description, zone.auditType].join(' ').toLowerCase().includes(q)
      })
  }, [zones, query, status, audit])
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const pagedRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const stats = useMemo(() => ({
    total: (zones as WarehouseLocation[]).length,
    active: (zones as WarehouseLocation[]).filter((zone) => zone.active).length,
    demo: (zones as WarehouseLocation[]).filter((zone) => auditZone(zone) === 'Demo record').length,
    warehouseLike: (zones as WarehouseLocation[]).filter((zone) => auditZone(zone) === 'Warehouse-like record').length,
    real: (zones as WarehouseLocation[]).filter((zone) => auditZone(zone) === 'Real storage location').length,
    materialCount: (zones as WarehouseLocation[]).filter(isRealStorageLocation).reduce((sum, zone) => sum + n(zone.materialCount), 0),
    stock: (zones as WarehouseLocation[]).filter(isRealStorageLocation).reduce((sum, zone) => sum + n(zone.totalStockQuantity), 0),
  }), [zones])

  const locationSegments = useMemo(() => [
    { label: 'Đang hoạt động', value: stats.active, color: '#14c987' },
    { label: 'Ngưng dùng', value: Math.max(0, stats.total - stats.active), color: '#64748b' },
    { label: 'Vị trí thật', value: stats.real, color: '#1d7cff' },
  ], [stats.active, stats.real, stats.total])

  const stockByLocation = useMemo(() => rows
    .slice()
    .sort((a, b) => n(b.totalStockQuantity) - n(a.totalStockQuantity))
    .slice(0, 6)
    .map((zone) => [zone.code, n(zone.totalStockQuantity)] as [string, number]), [rows])

  const edit = (zone: WarehouseLocation) => setForm({
    id: zone.id,
    code: zone.code,
    name: zone.name,
    row: zone.row ?? '',
    column: zone.column ?? '',
    level: zone.level ?? '',
    capacity: String(zone.capacity ?? ''),
    description: zone.description ?? '',
    active: zone.active,
    warehouseId: zone.warehouseId ?? '',
  })

  return <EnterpriseModulePage>
    <div className={inventoryPageStack}>
      <InventoryTabWorkspace />
      <div className={`grid ${inventoryGridGap} md:grid-cols-4`}>
        <InventoryKpi title="Tổng vị trí" value={stats.total.toLocaleString('vi-VN')} note={`${stats.active} đang hoạt động`} />
        <InventoryKpi title="Vị trí lưu kho thật" value={stats.real.toLocaleString('vi-VN')} tone="emerald" note="A01/A02/row/column/level" />
        <InventoryKpi title="Vật tư đang gán" value={stats.materialCount.toLocaleString('vi-VN')} tone="cyan" note="theo Material Master" />
        <InventoryKpi title="Tổng tồn theo vị trí" value={stats.stock.toLocaleString('vi-VN')} tone="amber" note="quantity snapshot" />
      </div>

      <InventoryPanel>
        <div className="grid gap-3 lg:grid-cols-[1fr_180px_220px_auto]">
          <input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1) }} className={inventoryInput} placeholder="Tìm mã, tên, row, column, level..." />
          <select value={status} onChange={(event) => { setStatus(event.target.value as typeof status); setPage(1) }} className={inventoryInput}>
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="inactive">Ngưng dùng</option>
          </select>
          <select value={audit} onChange={(event) => { setAudit(event.target.value as typeof audit); setPage(1) }} className={inventoryInput}>
            <option value="all">Tất cả phân loại</option>
            <option value="Real storage location">Vị trí lưu kho thật</option>
          </select>
          <button onClick={() => setForm(emptyForm)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">+ Thêm vị trí</button>
        </div>
      </InventoryPanel>

      <div className={`grid ${inventoryGridGap} xl:grid-cols-[1fr_320px]`}>
        <InventoryPanel title="Danh sách vị trí kho">
          <div className={inventoryTableShell}>
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className={inventoryTableHead}>
                <tr>
                  {['Mã vị trí', 'Tên vị trí', 'Kho cha', 'Row', 'Slot', 'Tầng', 'Sức chứa', 'Ô/tầng', 'Vật tư', 'Tồn', 'Audit', 'Trạng thái', 'Thao tác'].map((head) => <th key={head} className="px-4 py-3">{head}</th>)}
                </tr>
              </thead>
              <tbody>
                {pagedRows.map((zone) => <tr key={zone.id} className={`${inventoryTableRow} cursor-pointer`} onClick={() => setDetailId(zone.id)}>
                  <td className="px-4 py-3 font-semibold text-cyan-300">{zone.code}</td>
                  <td className="px-4 py-3">{zone.name}</td>
                  <td className="px-4 py-3">{zone.warehouse?.name ?? '-'}</td>
                  <td className="px-4 py-3">{zone.row ?? '-'}</td>
                  <td className="px-4 py-3">{zone.column ?? '-'}</td>
                  <td className="px-4 py-3">{zone.level ?? '-'}</td>
                  <td className="px-4 py-3">{n(zone.capacity).toLocaleString('vi-VN')} tấn</td>
                  <td className="px-4 py-3">{countOccupiedFromOccupancy(zone.cellOccupancy).toLocaleString('vi-VN')} / {TOTAL_CELL_LEVELS}</td>
                  <td className="px-4 py-3">{n(zone.materialCount).toLocaleString('vi-VN')}</td>
                  <td className="px-4 py-3">{n(zone.totalStockQuantity).toLocaleString('vi-VN')}</td>
                  <td className="px-4 py-3"><AuditChip value={zone.auditType} /></td>
                  <td className="px-4 py-3"><span className={`rounded px-2 py-1 text-[10px] ${zone.active ? 'bg-emerald-950 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>{zone.active ? 'Hoạt động' : 'Ngưng dùng'}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <IconButton title="Chi tiết" onClick={(event) => { event.stopPropagation(); setDetailId(zone.id) }}><Eye size={14} /></IconButton>
                      <IconButton title="Sửa" onClick={(event) => { event.stopPropagation(); edit(zone) }}><Edit3 size={14} /></IconButton>
                      <IconButton title={zone.active ? 'Ngưng dùng' : 'Kích hoạt'} onClick={(event) => { event.stopPropagation(); zone.active ? deactivateMutation.mutate(zone.id) : activateMutation.mutate(zone.id) }}>{zone.active ? <PowerOff size={14} /> : <Power size={14} />}</IconButton>
                      <IconButton title="Soft delete" onClick={(event) => { event.stopPropagation(); deleteMutation.mutate(zone.id) }}><Trash2 size={14} /></IconButton>
                    </div>
                  </td>
                </tr>)}
              </tbody>
            </table>
          </div>
          <InventoryPagination page={page} pageCount={pageCount} total={rows.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
          {isLoading ? <p className="mt-3 text-sm text-slate-500">Đang tải vị trí kho...</p> : null}
        </InventoryPanel>

        <div className="space-y-3">
          <InventoryChartCard title="Tình trạng vị trí">
            <CompactDonutSummary segments={locationSegments} centerValue={stats.real.toLocaleString('vi-VN')} centerLabel="vị trí thật" />
          </InventoryChartCard>
          <InventoryChartCard title="Tồn theo vị trí">
            <HorizontalBars rows={stockByLocation} valueFormatter={(value) => value.toLocaleString('vi-VN')} />
          </InventoryChartCard>
          <InventoryChartCard title="Audit warehouse_zones">
            <div className="space-y-2 text-sm">
              <AuditRow icon={<MapPinned size={16} />} label="Demo records" value={stats.demo} note="code bắt đầu DEMO-" />
              <AuditRow icon={<Warehouse size={16} />} label="Warehouse-like" value={stats.warehouseLike} note="ST-WH-* đã bị xóa nếu mồ côi dữ liệu" />
              <AuditRow icon={<Package size={16} />} label="Real storage" value={stats.real} note="A01/A02/B01 hoặc có row/column/level" />
            </div>
          </InventoryChartCard>
        </div>
      </div>
    </div>

    {form ? <LocationFormModal form={form} warehouses={warehouses} setForm={setForm} onClose={() => setForm(null)} onSubmit={() => saveMutation.mutate(form)} saving={saveMutation.isPending} /> : null}
    {detailId ? <LocationDetailDrawer detail={detail ?? null} onClose={() => setDetailId('')} /> : null}
  </EnterpriseModulePage>
}

function IconButton({ title, onClick, children }: { title: string; onClick: (event: React.MouseEvent<HTMLButtonElement>) => void; children: ReactNode }) {
  return <button type="button" title={title} onClick={onClick} className="rounded border border-slate-700 p-1.5 text-slate-300 hover:border-cyan-500 hover:text-cyan-200">{children}</button>
}

function AuditChip({ value }: { value: string }) {
  const tone = value === 'Real storage location' ? 'bg-emerald-950 text-emerald-300' : value === 'Demo record' ? 'bg-red-950 text-red-300' : value === 'Warehouse-like record' ? 'bg-amber-950 text-amber-300' : 'bg-slate-800 text-slate-300'
  return <span className={`rounded px-2 py-1 text-[10px] ${tone}`}>{value}</span>
}

function AuditRow({ icon, label, value, note }: { icon: ReactNode; label: string; value: number; note: string }) {
  return <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-slate-300">{icon}{label}</span>
      <b className="text-cyan-300">{value.toLocaleString('vi-VN')}</b>
    </div>
    <p className="mt-1 text-xs text-slate-500">{note}</p>
  </div>
}

function LocationFormModal({ form, warehouses, setForm, onClose, onSubmit, saving }: { form: LocationForm; warehouses: Array<{ id: string; code: string; name: string }>; setForm: (value: LocationForm) => void; onClose: () => void; onSubmit: () => void; saving: boolean }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
    <div className="w-full max-w-3xl overflow-hidden rounded-xl border border-slate-700 bg-[#071321] text-slate-100 shadow-2xl">
      <header className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
        <div><h2 className="text-lg font-semibold">{form.id ? 'Sửa vị trí kho' : 'Thêm vị trí kho'}</h2><p className="mt-1 text-xs text-slate-500">Sức chứa là tải trọng/tồn chứa vận hành; sơ đồ ô/tầng dùng cấu trúc A01-F06 và L1-L4.</p></div>
        <button onClick={onClose} className="rounded border border-slate-700 p-2 text-slate-300"><X size={16} /></button>
      </header>
      <div className="grid gap-3 p-5 md:grid-cols-2">
        <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className={inventoryInput} placeholder="Mã vị trí, ví dụ A01" />
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inventoryInput} placeholder="Tên vị trí" />
        <select value={form.warehouseId} onChange={(e) => setForm({ ...form, warehouseId: e.target.value })} className={inventoryInput}>
          <option value="">Thuộc kho nào?</option>
          {warehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.name} ({warehouse.code})</option>)}
        </select>
        <input value={form.row} onChange={(e) => setForm({ ...form, row: e.target.value })} className={inventoryInput} placeholder="Row, ví dụ A" />
        <input value={form.column} onChange={(e) => setForm({ ...form, column: e.target.value })} className={inventoryInput} placeholder="Slot, ví dụ 01" />
        <input value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} className={inventoryInput} placeholder="Tầng, ví dụ L1" />
        <input value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} className={inventoryInput} type="number" placeholder="Sức chứa vận hành, ví dụ 100 tấn" />
        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={`${inventoryInput} h-24 py-2 md:col-span-2`} placeholder="Ghi chú vị trí" />
        <label className="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Đang hoạt động</label>
      </div>
      <footer className="flex justify-end gap-2 border-t border-slate-800 px-5 py-4">
        <button onClick={onClose} className="rounded border border-slate-700 px-4 py-2 text-sm text-slate-300">Hủy</button>
        <button disabled={saving || !form.code.trim() || !form.name.trim()} onClick={onSubmit} className="rounded bg-blue-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Đang lưu...' : 'Lưu vị trí'}</button>
      </footer>
    </div>
  </div>
}

function LocationDetailDrawer({ detail, onClose }: { detail: WarehouseLocationDetail | null; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<'overview' | 'materials' | 'levels' | 'map'>('overview')
  const materials = detail
  ? buildMaterialsFromOccupancy(detail)
  : []
  const capacity = n(detail?.capacity)
  const usedQuantity = n(detail?.totalStockQuantity)
  const occupiedSlots = getOccupiedCellLevels(materials, detail).length
  const occupancy = capacity > 0 ? Math.min(100, Math.round((usedQuantity / capacity) * 100)) : 0
  const levelGroups = groupMaterialsByLevel(detail)
  const tabClass = (tab: typeof activeTab) => `rounded-lg px-3 py-2 text-sm font-semibold transition ${
    activeTab === tab
      ? 'border border-cyan-400/60 bg-cyan-400/12 text-cyan-200'
      : 'border border-slate-800 bg-slate-950/45 text-slate-400 hover:border-slate-700 hover:text-slate-200'
  }`

  return <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
    <aside className="h-full w-full max-w-6xl overflow-auto border-l border-slate-700 bg-[#071321] text-slate-100 shadow-2xl">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800 bg-[#071321]/95 px-6 py-5 backdrop-blur">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">Chi tiết vị trí kho</p>
          <h2 className="mt-1 text-2xl font-bold">{detail ? `${detail.code} · ${detail.name}` : 'Đang tải...'}</h2>
          <p className="mt-1 text-sm text-slate-400">Read-only Phase 1 · chưa hỗ trợ kéo thả hoặc thay đổi tồn kho.</p>
        </div>
        <button onClick={onClose} className="rounded-lg border border-slate-700 p-2.5 text-slate-300 hover:border-cyan-500 hover:text-cyan-200"><X size={18} /></button>
      </div>

      {detail ? <div className="space-y-5 p-6">
        <div className="flex flex-wrap gap-2">
          <button className={tabClass('overview')} onClick={() => setActiveTab('overview')}>Tổng quan</button>
          <button className={tabClass('materials')} onClick={() => setActiveTab('materials')}>Vật tư</button>
          <button className={tabClass('levels')} onClick={() => setActiveTab('levels')}>Phân tầng ô</button>
          <button className={tabClass('map')} onClick={() => setActiveTab('map')}>Sơ đồ 2D</button>
        </div>

        {activeTab === 'overview' ? <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
          <SectionCard title="Thông tin vị trí">
            <div className="grid grid-cols-2 gap-3 text-sm lg:grid-cols-3">
              <InfoBox label="Mã vị trí" value={detail.code} />
              <InfoBox label="Tên vị trí" value={detail.name} />
              <InfoBox label="Kho cha" value={detail.warehouse?.name ?? '-'} />
              <InfoBox label="Trạng thái" value={detail.active ? 'Hoạt động' : 'Ngưng dùng'} />
              <InfoBox label="Row" value={detail.row ?? '-'} />
              <InfoBox label="Slot" value={detail.column ?? '-'} />
              <InfoBox label="Tầng" value={detail.level ?? '-'} />
            </div>
            {detail.description ? <p className="mt-3 rounded-lg border border-slate-800 bg-slate-950/50 p-3 text-sm text-slate-400">{detail.description}</p> : null}
          </SectionCard>

          <SectionCard title="Thông tin sức chứa">
            <div className="grid grid-cols-2 gap-3 text-sm lg:grid-cols-4">
              <InfoBox label="Sức chứa vận hành" value={`${capacity.toLocaleString('vi-VN')} tấn`} />
              <InfoBox label="Đang sử dụng" value={`${usedQuantity.toLocaleString('vi-VN')} tấn`} />
              <InfoBox label="Ô/tầng đã dùng" value={`${occupiedSlots.toLocaleString('vi-VN')} / ${TOTAL_CELL_LEVELS}`} />
              <InfoBox label="Tỷ lệ dùng" value={`${occupancy}%`} />
            </div>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-900">
              <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400" style={{ width: `${occupancy}%` }} />
            </div>
            <p className="mt-3 rounded-lg border border-slate-800 bg-slate-950/50 p-3 text-xs text-slate-400">
              Sơ đồ vị trí dùng cấu trúc cố định 6 hàng x 6 cột = 36 ô, mỗi ô có 4 tầng L1-L4 = {TOTAL_CELL_LEVELS} ô-tầng. Sức chứa không phải số ô, mà là tải trọng/tồn chứa vận hành của vị trí.
            </p>
          </SectionCard>
        </div> : null}

        {activeTab === 'materials' ? <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
          <SectionCard title="Danh sách vật tư">
            <div className="overflow-hidden rounded-xl border border-slate-800">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="bg-slate-900/80 text-[11px] uppercase tracking-[0.12em] text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Mã vật tư</th>
                    <th className="px-4 py-3">Tên vật tư</th>
                    <th className="px-4 py-3">Slot</th>
                    <th className="px-4 py-3">Level</th>
                    <th className="px-4 py-3 text-right">Số lượng</th>
                    <th className="px-4 py-3">Đơn vị</th>
                  </tr>
                </thead>
                <tbody>
                  {materials.map((item) => (
                    <tr
                      key={item.id}
                      className="border-t border-slate-800/80 hover:bg-slate-900/45"
                    >
                      <td className="px-4 py-3 font-semibold text-cyan-300">
                        {item.code}
                      </td>

                      <td className="px-4 py-3">
                        {item.name}
                      </td>

                      <td className="px-4 py-3">
                        {item.slotId}
                      </td>

                      <td className="px-4 py-3">
                        {item.level}
                      </td>

                      <td className="px-4 py-3 text-right font-semibold">
                        {n(item.quantity).toLocaleString('vi-VN')}
                      </td>

                      <td className="px-4 py-3">
                        {item.unit ?? '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!materials.length ? <p className="border-t border-slate-800 px-4 py-6 text-center text-sm text-slate-500">Chưa có vật tư gán vào vị trí này.</p> : null}
            </div>
          </SectionCard>

          <SectionCard title="Nhóm vật tư theo level">
            <div className="space-y-3">
              {levelGroups.map((group) => <div key={group.level} className="rounded-xl border border-slate-800 bg-slate-950/45 p-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-semibold text-slate-100"><Layers3 size={15} className="text-cyan-300" />{group.level}</span>
                  <span className="text-xs text-slate-400">{group.items.length} vật tư</span>
                </div>
                <div className="mt-3 space-y-2">
                  {group.items.map((item) => <div key={item.id} className="flex items-center justify-between gap-3 text-xs">
                    <span className="truncate text-slate-300">{item.code} · {item.name}</span>
                    <span className="shrink-0 text-cyan-300">{n(item.quantity).toLocaleString('vi-VN')}</span>
                  </div>)}
                </div>
              </div>)}
              {!levelGroups.length ? <p className="text-sm text-slate-500">Chưa có dữ liệu level để nhóm vật tư.</p> : null}
            </div>
          </SectionCard>
        </div> : null}

        {activeTab === 'levels' ? <SectionCard title="Chi tiết phân tầng của ô">
          <LayeredSlotDetail detail={detail} />
        </SectionCard> : null}

        {activeTab === 'map' ? <SectionCard title="2D visual preview">
          <Location2DPreview detail={detail} />
        </SectionCard> : null}
      </div> : <p className="p-6 text-sm text-slate-500">Đang tải chi tiết...</p>}
    </aside>
  </div>
}

function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return <section className="rounded-2xl border border-slate-800 bg-slate-950/35 p-4 shadow-[0_18px_60px_rgba(0,0,0,0.18)]">
    <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-cyan-300">{title}</h3>
    {children}
  </section>
}

function Location2DPreview({ detail }: { detail: WarehouseLocationDetail }) {
  const occupancyItems = buildMaterialsFromOccupancy(detail)

  const defaultCell =
    normalizeSlotCell(
      occupancyItems.find((item) => item.slotId)?.slotId,
    ) ?? `${detail.row ?? 'A'}${detail.column ?? '01'}`
  const [selectedCell, setSelectedCell] = useState({
    row: defaultCell.slice(0, 1),
    column: defaultCell.slice(1) || '01',
  })
  const rowLabels = buildRowLabels(detail.row)
  const columnLabels = buildColumnLabels(detail.column)
  const clickedKey = `${selectedCell.row}-${selectedCell.column}`
  const selectedCellCode = `${selectedCell.row}${selectedCell.column}`
  const materialsByCell = useMemo(() => {
  const map = new Map<string, any[]>()

  for (const item of occupancyItems) {
    const key =
      normalizeSlotCell(item.slotId) ||
      `${detail.row ?? ''}${detail.column ?? ''}` ||
      'A01'

    const list = map.get(key) ?? []

    list.push(item)

    map.set(key, list)
  }

  return map
}, [detail, occupancyItems])
  const selectedCellMaterials = materialsByCell.get(selectedCellCode) ?? []
  const selectedLevels = Array.from(new Set(selectedCellMaterials.map((item) => item.level || 'L1'))).sort()

  return <div className="space-y-4">
    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
      <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded bg-cyan-400" />Vị trí đang xem</span>
      <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded bg-emerald-500" />Có vật tư</span>
      <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded border border-slate-700 bg-slate-900" />Ô trống</span>
      <span className="ml-auto text-slate-500">Preview dùng row/column/level hiện có, chưa phải map kéo thả.</span>
    </div>
    <div className="grid gap-4 xl:grid-cols-[0.82fr_0.38fr]">
      <div className="overflow-auto rounded-xl border border-slate-800 bg-slate-950/60 p-3">
      <div className="grid min-w-[500px] gap-1.5" style={{ gridTemplateColumns: `44px repeat(${columnLabels.length}, minmax(56px, 1fr))` }}>
        <div />
        {columnLabels.map((column) => <div key={column} className="rounded-lg border border-slate-800 bg-slate-900/60 px-2 py-1.5 text-center text-[11px] font-semibold text-slate-400">{column}</div>)}
        {rowLabels.map((row) => [
          <div key={`${row}-label`} className="rounded-lg border border-slate-800 bg-slate-900/60 px-2 py-3 text-center text-[11px] font-semibold text-slate-400">{row}</div>,
          ...columnLabels.map((column) => {
            const isClicked = clickedKey === `${row}-${column}`
            const cellCode = `${row}${column}`
            const cellMaterials = materialsByCell.get(cellCode) ?? []
            const isOccupied = cellMaterials.length > 0
            return <button type="button" onClick={() => setSelectedCell({ row, column })} key={`${row}-${column}`} className={`min-h-[54px] rounded-lg border p-1.5 text-left transition ${isClicked ? 'ring-2 ring-cyan-300/70 border-cyan-300 bg-cyan-400/16 shadow-[0_0_22px_rgba(34,211,238,0.20)]' : isOccupied ? 'border-emerald-500/70 bg-emerald-500/14' : 'border-slate-800 bg-slate-900/45 hover:border-slate-600'}`}>
              <div className="flex h-full flex-col justify-between">
                <span className={`text-xs font-semibold ${isClicked ? 'text-cyan-200' : 'text-slate-500'}`}>{row}{column}</span>
                <span className={`text-[10px] uppercase tracking-[0.12em] ${isOccupied ? 'text-emerald-300' : isClicked ? 'text-cyan-300' : 'text-slate-600'}`}>{isOccupied ? `${cellMaterials.length} item` : isClicked ? 'Selected' : 'Empty'}</span>
              </div>
            </button>
          }),
        ])}
      </div>
      </div>
      <div className="rounded-xl border border-slate-800 bg-slate-950/55 p-4">
        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-300">Chi tiết ô</div>
        <div className="mt-2 text-lg font-bold text-white">{selectedCellCode}</div>
        <div className="mt-1 text-sm text-slate-400">Tầng có vật tư: {selectedLevels.length ? selectedLevels.join(', ') : '-'}</div>
        <div className="mt-4 space-y-2">
          {selectedCellMaterials.length ? selectedCellMaterials.map((item) => <div key={item.id} className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-xs">
            <div className="font-semibold text-cyan-300">{item.code}</div>
            <div className="mt-1 text-slate-200">{item.name}</div>
            <div className="mt-1 text-slate-500">Tầng {item.level ?? 'L1'} · {n(item.quantity).toLocaleString('vi-VN')} {item.unitMaster?.symbol ?? item.unit ?? ''}</div>
          </div>) : <p className="text-sm text-slate-500">Ô này đang trống hoặc chưa có vật tư gán.</p>}
        </div>
      </div>
    </div>
    <div className="grid gap-3 md:grid-cols-3">
      <InfoBox label="Số tầng mẫu" value={LOCATION_LEVELS.join('-')} />
      <InfoBox label="Ô đang xem" value={selectedCellCode} />
      <InfoBox label="Trạng thái ô" value={selectedCellMaterials.length ? 'Occupied' : 'Empty'} />
    </div>
  </div>
}

function LayeredSlotDetail({ detail }: { detail: WarehouseLocationDetail }) {
  const rowLabels = buildRowLabels(detail.row)
  const columnLabels = buildColumnLabels(detail.column)

  const occupancyItems = buildMaterialsFromOccupancy(detail)

  const materialsByCell = useMemo(() => {
    const map = new Map<string, any[]>()

    for (const item of occupancyItems) {
      const key =
        normalizeSlotCell(item.slotId) ||
        `${detail.row ?? ''}${detail.column ?? ''}` ||
        'A01'

      const list = map.get(key) ?? []

      list.push(item)

      map.set(key, list)
    }

    return map
  }, [detail, occupancyItems])

  const defaultCell =
    normalizeSlotCell(
      occupancyItems.find((item) => item.slotId)?.slotId,
    ) ||
    `${detail.row ?? 'A'}${detail.column ?? '01'}`

  const [selectedCell, setSelectedCell] = useState(defaultCell)
  const [selectedLevel, setSelectedLevel] = useState('L2')
  const selectedItems = materialsByCell.get(selectedCell) ?? []
  const selectedLevelItems = selectedItems.filter((item) => (item.level || 'L1') === selectedLevel)
  const usedQuantity = selectedLevelItems.reduce((sum, item) => sum + n(item.quantity), 0)
  const levelStats = LOCATION_LEVELS.slice().reverse().map((level) => ({
    level,
    items: selectedItems.filter((item) => (item.level || 'L1') === level),
  }))

  return <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">Chọn ô</p>
            <h4 className="mt-1 text-lg font-bold text-white">{selectedCell}</h4>
          </div>
          <span className="rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-200">{selectedItems.length} vật tư</span>
        </div>
        <div className="grid grid-cols-6 gap-2">
          {rowLabels.flatMap((row) => columnLabels.map((column) => {
            const cell = `${row}${column}`
            const count = materialsByCell.get(cell)?.length ?? 0
            const active = selectedCell === cell
            return <button key={cell} type="button" onClick={() => setSelectedCell(cell)} className={`rounded-lg border px-2 py-2 text-left text-xs transition ${active ? 'border-cyan-300 bg-cyan-400/15 text-cyan-100 shadow-[0_0_22px_rgba(34,211,238,0.18)]' : count ? 'border-emerald-400/50 bg-emerald-500/10 text-emerald-200' : 'border-slate-800 bg-slate-900/55 text-slate-500 hover:border-slate-600'}`}>
              <div className="font-semibold">{cell}</div>
              <div className="mt-1 text-[10px]">{count ? `${count} item` : 'Trống'}</div>
            </button>
          }))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <InfoBox label="Khu vực" value={detail.warehouse?.name ?? '-'} />
        <InfoBox label="Zone" value={detail.code} />
        <InfoBox label="Ô (Slot)" value={selectedCell} />
        <InfoBox label="Tầng đang nổi bật" value={selectedLevel} />
        <InfoBox label="Sức chứa tối đa" value={`${n(detail.capacity).toLocaleString('vi-VN')} tấn`} />
        <InfoBox label="Đang sử dụng" value={`${usedQuantity.toLocaleString('vi-VN')} tấn`} />
      </div>
    </div>

    <div className="rounded-2xl border border-slate-800 bg-[radial-gradient(circle_at_30%_15%,rgba(34,211,238,0.12),transparent_32%),#081321] p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">Mô phỏng phân tầng</p>
          <h4 className="mt-1 text-xl font-bold text-white">Ô {selectedCell}</h4>
        </div>
        <span className="text-xs text-slate-500">CSS isometric preview</span>
      </div>
      <div className="grid gap-6 lg:grid-cols-[120px_1fr]">
        <div className="space-y-3 pt-4">
          {levelStats.map((group) => <button key={group.level} type="button" onClick={() => setSelectedLevel(group.level)} className={`block w-full rounded-lg border px-3 py-2 text-sm font-semibold transition ${
            selectedLevel === group.level
              ? 'border-cyan-300 bg-cyan-400/18 text-cyan-100 shadow-[0_0_18px_rgba(34,211,238,0.18)]'
              : group.items.length
                ? 'border-emerald-400/45 bg-emerald-500/10 text-emerald-200'
                : 'border-slate-800 bg-slate-950/50 text-slate-500 hover:border-slate-700'
          }`}>
            {group.level}
          </button>)}
        </div>
        <div className="relative min-h-[330px] overflow-hidden rounded-xl border border-slate-800 bg-slate-950/40">
          <div className="absolute inset-x-8 bottom-8 h-8 rounded-[40%] bg-black/35 blur-md" />
          <div className="absolute left-1/2 top-10 h-[260px] w-[360px] -translate-x-1/2">
            {levelStats.map((group, index) => <button type="button" onClick={() => setSelectedLevel(group.level)} key={group.level} className="absolute left-0 w-full text-left" style={{ top: `${index * 58}px` }}>
              <div className={`relative h-14 skew-x-[-18deg] rounded-lg border transition ${
                selectedLevel === group.level
                  ? 'border-cyan-200 bg-cyan-400/30 shadow-[0_0_34px_rgba(34,211,238,0.34)]'
                  : group.items.length
                    ? 'border-emerald-300/70 bg-emerald-400/16 shadow-[0_0_22px_rgba(16,185,129,0.16)]'
                    : 'border-slate-600/70 bg-slate-800/55'
              }`}>
                <div className="absolute inset-x-4 top-1/2 h-px bg-white/12" />
                <div className="absolute left-1/3 top-0 h-full w-px bg-white/12" />
                <div className="absolute left-2/3 top-0 h-full w-px bg-white/12" />
                <div className="absolute -left-4 top-2 h-14 w-4 skew-y-[35deg] rounded-l bg-slate-900/85" />
                <div className="absolute -right-4 top-2 h-14 w-4 skew-y-[35deg] rounded-r bg-slate-900/85" />
              </div>
              <div className="absolute -left-12 top-4 text-sm font-bold text-slate-400">{group.level}</div>
              <div className="absolute right-3 top-4 rounded bg-slate-950/60 px-2 py-1 text-[10px] text-slate-200">{group.items.length ? `${group.items.length} vật tư` : 'Trống'}</div>
            </button>)}
            <div className="absolute bottom-0 left-4 h-16 w-4 rounded bg-slate-700/70" />
            <div className="absolute bottom-0 right-4 h-16 w-4 rounded bg-slate-700/70" />
          </div>
        </div>
      </div>
      <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/50 p-3">
        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Vật tư trong tầng đang nổi bật</div>
        <div className="mt-2 space-y-2">
          {selectedLevelItems.length ? selectedLevelItems.map((item) => <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-900/55 px-3 py-2 text-sm">
            <span className="truncate text-slate-200">{item.code} · {item.name}</span>
            <span className="shrink-0 text-cyan-300">{n(item.quantity).toLocaleString('vi-VN')} {item.unitMaster?.symbol ?? item.unit ?? ''}</span>
          </div>) : <p className="text-sm text-slate-500">Tầng này chưa có vật tư.</p>}
        </div>
      </div>
    </div>
  </div>
}

function groupMaterialsByLevel(
  detail: WarehouseLocationDetail | null,
) {
  if (!detail) return []

  const items = buildMaterialsFromOccupancy(detail)

  const map = new Map<string, any[]>()

  items.forEach((item) => {
    const level = item.level || 'L1'
    const list = map.get(level) ?? []
    list.push(item)
    map.set(level, list)
  })

  return Array.from(map.entries())
    .map(([level, items]) => ({
      level,
      items,
    }))
    .sort((a, b) => b.level.localeCompare(a.level))
}

function normalizeSlotCell(slotId?: string | null) {
  const value = String(slotId ?? '').trim().toUpperCase()
  if (!value) return ''
  return value.includes(':') ? value.split(':')[0] : value
}
function buildMaterialsFromOccupancy(detail: WarehouseLocationDetail) {
  const rows: Array<{
    id: string
    code: string
    name: string
    quantity: number
    unit?: string | null
    slotId: string
    level: string
  }> = []

  ;(detail.cellOccupancy ?? []).forEach((cell) => {
    ;(cell.materials ?? []).forEach((material) => {
      rows.push({
        id: `${material.id}-${cell.slotId}-${cell.level}`,
        code: material.code,
        name: material.name,
        quantity: material.quantity,
        unit: material.unit,
        unitMaster: null,
        slotId: cell.slotId,
        level: cell.level,
      })
    })
  })

  return rows
}

function getOccupiedCellLevels(
  items: any[], detail?: WarehouseLocationDetail | null) {
  const keys = new Set<string>()
  items.forEach((item) => {
    const cell = normalizeSlotCell(item.slotId) || `${detail?.row ?? ''}${detail?.column ?? ''}` || 'A01'
    const level = item.level || 'L1'
    keys.add(`${cell}:${level}`)
  })
  return Array.from(keys)
}

function buildRowLabels(current?: string | null) {
  const base = LOCATION_ROWS
  const row = String(current ?? '').trim().toUpperCase()
  if (!row || base.includes(row)) return base
  return [row, ...base].slice(0, 6)
}

function buildColumnLabels(current?: string | null) {
  const base = LOCATION_COLUMNS
  const column = String(current ?? '').trim().padStart(2, '0')
  if (!column || base.includes(column)) return base
  return [column, ...base].slice(0, 6)
}

function countOccupiedFromOccupancy(cellOccupancy?: WarehouseLocation['cellOccupancy']) {
  const keys = new Set<string>()
  ;(cellOccupancy ?? []).forEach((entry) => {
    const cell = String(entry.slotId ?? '').trim().toUpperCase()
    const level = String(entry.level ?? 'L1').trim().toUpperCase()
    if (cell) keys.add(`${cell}:${level}`)
  })
  return keys.size
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
    <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</div>
    <div className="mt-1 text-base font-semibold text-slate-100">{value}</div>
  </div>
}
