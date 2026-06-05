import { type ReactNode, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell, Building2, CheckCircle2, DatabaseBackup, Edit3, FileDigit, Globe2, Link2, Plus, Save, Settings, ShieldCheck, SlidersHorizontal, Trash2, Workflow, XCircle } from 'lucide-react'

import { OperationalShell } from '@/shared/layouts/OperationalShell'
import { systemApi, type WorkflowCheck } from '@/modules/system/api/system.api'
import { inventoryApi } from '@/modules/inventory/api/inventory.api'
import { useCategories } from '@/modules/inventory/hooks/useCategories'
import { useInventoryItems } from '@/modules/inventory/hooks/useInventoryItems'
import { useMaterialTypes } from '@/modules/inventory/hooks/useMaterialTypes'
import { useUnits } from '@/modules/inventory/hooks/useUnits'

type Tab = 'overview' | 'general' | 'permissions' | 'master' | 'integrations' | 'notifications' | 'backup' | 'logs'

const tabs: Array<[Tab, string]> = [
  ['overview', 'Tổng quan'],
  ['general', 'Cấu hình chung'],
  ['permissions', 'Phân quyền'],
  ['master', 'Danh mục / Đơn vị'],
  ['integrations', 'Tích hợp'],
  ['notifications', 'Thông báo'],
  ['backup', 'Sao lưu & Phục hồi'],
  ['logs', 'Nhật ký cấu hình'],
]
const panel = 'rounded border border-slate-800 bg-[#071321]'
const input = 'h-10 rounded border border-slate-800 bg-slate-950/60 px-3 text-sm text-slate-100 outline-none focus:border-cyan-500'
const textarea = 'min-h-20 rounded border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-500'
const actionButton = 'inline-flex items-center gap-2 rounded border border-slate-700 bg-slate-950/70 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800'
const primaryButton = 'inline-flex items-center gap-2 rounded bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-50'
const fmt = (value = 0) => new Intl.NumberFormat('vi-VN').format(value)
const date = (value?: string) => value ? new Date(value).toLocaleString('vi-VN') : '-'

type CategoryForm = {
  id?: string
  code: string
  name: string
  description: string
}

type MaterialTypeForm = CategoryForm & {
  categoryId: string
}

type UnitForm = {
  id?: string
  code: string
  name: string
  symbol: string
  category: string
  precision: string
}

const emptyCategory: CategoryForm = { code: '', name: '', description: '' }
const emptyMaterialType: MaterialTypeForm = { code: '', name: '', description: '', categoryId: '' }
const emptyUnit: UnitForm = { code: '', name: '', symbol: '', category: 'WEIGHT', precision: '0' }

export function SettingsPage() {
  const [tab, setTab] = useState<Tab>('overview')
  const { data } = useQuery({ queryKey: ['system-overview'], queryFn: systemApi.overview, refetchInterval: 10000 })
  const { data: workflow } = useQuery({ queryKey: ['operational-workflow'], queryFn: systemApi.workflow, refetchInterval: 10000 })
  const stats = data?.stats ?? {}
  const category = useMemo(() => [
    ['Thông tin công ty', Building2],
    ['Cấu hình hệ thống', Settings],
    ['Đơn vị & Quy đổi', SlidersHorizontal],
    ['Mã vật tư', FileDigit],
    ['Trạng thái & Loại', ShieldCheck],
    ['Kho & Vị trí', DatabaseBackup],
    ['Số chứng từ', FileDigit],
    ['Email & SMTP', Bell],
    ['Tích hợp hệ thống', Link2],
    ['Giao diện & Hiển thị', Globe2],
  ] as const, [])

  return <OperationalShell>
    <main className="min-h-screen bg-[#020811] p-4 text-slate-100">
      <header className="flex flex-wrap items-end justify-between gap-3 pb-4">
        <div><h1 className="text-2xl font-semibold">Cài đặt hệ thống</h1><p className="mt-1 text-sm text-slate-500">Quản lý toàn bộ cấu hình và thiết lập hệ thống</p></div>
        <button className="inline-flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-sm font-semibold"><Save size={16} />Lưu thay đổi</button>
      </header>
      <nav className="mb-3 flex gap-1 overflow-x-auto rounded border border-slate-800 bg-[#06101b] p-1">{tabs.map(([id, label]) => <button key={id} onClick={() => setTab(id)} className={`whitespace-nowrap rounded px-4 py-2 text-sm ${tab === id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>{label}</button>)}</nav>
      {tab === 'overview' && <Overview data={data} workflow={workflow} category={category} stats={stats} />}
      {tab === 'general' && <ConfigGrid title="Cấu hình chung" values={data?.system} />}
      {tab === 'permissions' && <ConfigGrid title="Tổng quan phân quyền" values={{ users: fmt(stats.totalUsers), activeUsers: fmt(stats.activeUsers), roles: fmt(stats.roles), permissions: fmt(stats.permissions) }} />}
      {tab === 'master' && <SettingsCatalogs />}
      {tab === 'integrations' && <Integrations rows={data?.integrations ?? []} />}
      {tab === 'notifications' && <Toggles rows={data?.notifications ?? {}} />}
      {tab === 'backup' && <ConfigGrid title="Sao lưu dữ liệu" values={data?.backup} />}
      {tab === 'logs' && <Activities rows={data?.recentActivities ?? []} />}
    </main>
  </OperationalShell>
}

function Overview({ data, workflow, category, stats }: { data: any; workflow?: WorkflowCheck; category: ReadonlyArray<readonly [string, any]>; stats: Record<string, number> }) {
  return <div className="grid gap-3 xl:grid-cols-[300px_1fr]">
    <aside className={`${panel} p-4`}><h2 className="text-sm font-semibold">Danh mục cài đặt</h2><div className="mt-3 space-y-1">{category.map(([label, Icon], index) => <div key={label} className={`flex items-center gap-3 rounded px-3 py-2 text-sm ${index === 0 ? 'bg-blue-600/30 text-blue-200' : 'text-slate-400'}`}><Icon size={16} />{label}</div>)}</div></aside>
    <section className="grid gap-3 xl:grid-cols-2">
      <Card title="Thông tin công ty" icon={Building2}><Info k="Tên công ty" v={data?.company?.name || 'STEELTRACK'} /><Info k="Mã số thuế" v={data?.company?.taxCode || '-'} /><Info k="Địa chỉ" v={data?.company?.address || '-'} /><Info k="Điện thoại" v={data?.company?.phone || '-'} /><Info k="Email" v={data?.company?.email || '-'} /></Card>
      <Card title="Cấu hình hệ thống" icon={Settings}>{Object.entries(data?.system ?? {}).map(([k, v]) => <Info key={k} k={label(k)} v={String(v)} />)}</Card>
      <Card title="Cấu hình chứng từ" icon={FileDigit}>{Object.entries(data?.documents ?? {}).map(([k, v]) => <Info key={k} k={label(k)} v={String(v)} />)}</Card>
      <Card title="Kiểm tra workflow vận hành" icon={Workflow}><WorkflowPanel workflow={workflow} /></Card>
      <Card title="Tích hợp hệ thống" icon={Link2}>{(data?.integrations ?? []).map((row: any) => <Info key={row.name} k={row.name} v={row.status} tone={row.status === 'ENABLED' || row.status === 'CONNECTED' ? 'ok' : 'warn'} />)}</Card>
      <Card title="Thống kê hệ thống" icon={DatabaseBackup}><Info k="Tổng người dùng" v={fmt(stats.totalUsers)} /><Info k="Tổng vai trò" v={fmt(stats.roles)} /><Info k="Tổng quyền" v={fmt(stats.permissions)} /><Info k="Tổng nhật ký" v={fmt(stats.activityTotal)} /></Card>
    </section>
  </div>
}

function WorkflowPanel({ workflow }: { workflow?: WorkflowCheck }) {
  if (!workflow) return <p className="text-sm text-slate-500">Đang kiểm tra workflow...</p>
  return <div className="space-y-2">{workflow.steps.map((step) => <div key={step.code} className="grid grid-cols-[22px_1fr] gap-2 rounded border border-slate-800 bg-slate-950/40 p-2 text-xs"><span className={step.status === 'OK' ? 'text-emerald-400' : step.status === 'WARN' ? 'text-amber-400' : 'text-red-400'}>{step.status === 'OK' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}</span><span><b className="block text-slate-200">{step.name}</b><span className="text-slate-500">{step.detail}</span></span></div>)}</div>
}

function SettingsCatalogs() {
  const queryClient = useQueryClient()
  const { data: categories = [] } = useCategories()
  const { data: materialTypes = [] } = useMaterialTypes()
  const { data: units = [] } = useUnits()
  const { data: materials = [] } = useInventoryItems()
  const [categoryForm, setCategoryForm] = useState<CategoryForm>(emptyCategory)
  const [materialTypeForm, setMaterialTypeForm] = useState<MaterialTypeForm>(emptyMaterialType)
  const [unitForm, setUnitForm] = useState<UnitForm>(emptyUnit)

  const categoryMutation = useMutation({
    mutationFn: async (payload: CategoryForm) => {
      const body = {
        code: payload.code.trim().toUpperCase(),
        name: payload.name.trim(),
        description: payload.description.trim() || undefined,
      }
      if (payload.id) return inventoryApi.put(`/inventory/categories/${payload.id}`, body).then((res) => res.data)
      return inventoryApi.post('/inventory/categories', body).then((res) => res.data)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['inventory-categories'] })
      setCategoryForm(emptyCategory)
    },
  })

  const materialTypeMutation = useMutation({
    mutationFn: async (payload: MaterialTypeForm) => {
      const body = {
        code: payload.code.trim().toUpperCase(),
        name: payload.name.trim(),
        description: payload.description.trim() || undefined,
        categoryId: payload.categoryId,
      }
      if (payload.id) return inventoryApi.put(`/inventory/material-types/${payload.id}`, body).then((res) => res.data)
      return inventoryApi.post('/inventory/material-types', body).then((res) => res.data)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['inventory-material-types'] })
      setMaterialTypeForm(emptyMaterialType)
    },
  })

  const unitMutation = useMutation({
    mutationFn: async (payload: UnitForm) => {
      const body = {
        code: payload.code.trim().toUpperCase(),
        name: payload.name.trim(),
        symbol: payload.symbol.trim() || payload.code.trim(),
        category: payload.category.trim().toUpperCase(),
        precision: Number(payload.precision || 0),
      }
      if (payload.id) return inventoryApi.put(`/inventory/units/${payload.id}`, body).then((res) => res.data)
      return inventoryApi.post('/inventory/units', body).then((res) => res.data)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['inventory-units'] })
      setUnitForm(emptyUnit)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async ({ type, id }: { type: 'category' | 'materialType' | 'unit'; id: string }) => {
      const path = type === 'category'
        ? `/inventory/categories/${id}`
        : type === 'materialType'
          ? `/inventory/material-types/${id}`
          : `/inventory/units/${id}`
      return inventoryApi.delete(path).then((res) => res.data)
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['inventory-categories'] }),
        queryClient.invalidateQueries({ queryKey: ['inventory-material-types'] }),
        queryClient.invalidateQueries({ queryKey: ['inventory-units'] }),
      ])
    },
  })

  const usageRows = [
    ['PRIMARY', 'Vật tư chính', 'Dùng cho kết cấu chính, BOM và định mức sản xuất.'],
    ['SECONDARY', 'Vật tư phụ', 'Dùng cho liên kết, phụ kiện và chi tiết phụ trợ.'],
    ['CONSUMABLE', 'Vật tư tiêu hao', 'Dùng cho hàn, sơn, đá mài, mũi khoan và vật tư xưởng.'],
  ] as const

  function countBy(key: string, value: string) {
    return (materials as any[]).filter((row) => String(row?.[key] ?? '') === String(value)).length
  }

  function saveCategory() {
    if (!categoryForm.code.trim() || !categoryForm.name.trim()) return
    categoryMutation.mutate(categoryForm)
  }

  function saveMaterialType() {
    if (!materialTypeForm.code.trim() || !materialTypeForm.name.trim() || !materialTypeForm.categoryId) return
    materialTypeMutation.mutate(materialTypeForm)
  }

  function saveUnit() {
    if (!unitForm.code.trim() || !unitForm.name.trim()) return
    unitMutation.mutate(unitForm)
  }

  return (
    <section className="space-y-3">
      <div className="grid gap-3 md:grid-cols-4">
        <MiniKpi label="Danh mục vật tư" value={fmt(categories.length)} />
        <MiniKpi label="Nhóm sử dụng" value="3" />
        <MiniKpi label="Quy cách / loại" value={fmt(materialTypes.length)} />
        <MiniKpi label="Đơn vị" value={fmt(units.length)} />
      </div>

      <div className="grid gap-3 xl:grid-cols-2">
        <section className={`${panel} p-4`}>
          <HeaderLine title="Danh mục vật tư" editing={Boolean(categoryForm.id)} onReset={() => setCategoryForm(emptyCategory)} onSave={saveCategory} loading={categoryMutation.isPending} />
          <div className="grid gap-2 md:grid-cols-2">
            <input value={categoryForm.code} onChange={(event) => setCategoryForm((prev) => ({ ...prev, code: event.target.value }))} className={input} placeholder="Mã danh mục, VD: STEEL_PROFILE" />
            <input value={categoryForm.name} onChange={(event) => setCategoryForm((prev) => ({ ...prev, name: event.target.value }))} className={input} placeholder="Tên danh mục" />
            <textarea value={categoryForm.description} onChange={(event) => setCategoryForm((prev) => ({ ...prev, description: event.target.value }))} className={`${textarea} md:col-span-2`} placeholder="Mô tả" />
          </div>
          <RecordList
            rows={categories}
            meta={(row) => `${countBy('categoryId', row.id)} vật tư đang dùng`}
            onEdit={(row) => setCategoryForm({ id: row.id, code: row.code ?? '', name: row.name ?? '', description: row.description ?? '' })}
            onDelete={(row) => deleteMutation.mutate({ type: 'category', id: row.id })}
          />
        </section>

        <section className={`${panel} p-4`}>
          <h2 className="mb-3 text-sm font-semibold">Nhóm sử dụng vật tư</h2>
          <div className="grid gap-2">
            {usageRows.map(([code, name, note]) => (
              <div key={code} className="rounded border border-slate-800 bg-slate-950/50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-slate-100">{name}</div>
                    <div className="mt-1 text-xs text-cyan-300">{code}</div>
                    <div className="mt-1 text-xs text-slate-500">{note}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-white">{fmt(countBy('materialUsageType', code))}</div>
                    <div className="text-[10px] uppercase tracking-wide text-slate-500">vật tư</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 rounded border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-100">
            Ba nhóm này là chuẩn hệ thống đang liên kết BOM và sản xuất. Nếu cần tạo thêm nhóm ngoài chính/phụ/tiêu hao thì cần Phase DB mở rộng enum thành bảng danh mục động.
          </p>
        </section>

        <section className={`${panel} p-4`}>
          <HeaderLine title="Quy cách / loại vật tư" editing={Boolean(materialTypeForm.id)} onReset={() => setMaterialTypeForm(emptyMaterialType)} onSave={saveMaterialType} loading={materialTypeMutation.isPending} />
          <div className="grid gap-2 md:grid-cols-2">
            <input value={materialTypeForm.code} onChange={(event) => setMaterialTypeForm((prev) => ({ ...prev, code: event.target.value }))} className={input} placeholder="Mã quy cách, VD: H_BEAM" />
            <input value={materialTypeForm.name} onChange={(event) => setMaterialTypeForm((prev) => ({ ...prev, name: event.target.value }))} className={input} placeholder="Tên quy cách" />
            <select value={materialTypeForm.categoryId} onChange={(event) => setMaterialTypeForm((prev) => ({ ...prev, categoryId: event.target.value }))} className={input}>
              <option value="">Chọn danh mục vật tư</option>
              {(categories as any[]).map((category) => <option key={category.id} value={category.id}>{category.code} - {category.name}</option>)}
            </select>
            <textarea value={materialTypeForm.description} onChange={(event) => setMaterialTypeForm((prev) => ({ ...prev, description: event.target.value }))} className={textarea} placeholder="Mô tả" />
          </div>
          <RecordList
            rows={materialTypes}
            meta={(row) => `${row.category?.name ?? 'Chưa gán danh mục'} · ${countBy('materialTypeId', row.id)} vật tư`}
            onEdit={(row) => setMaterialTypeForm({ id: row.id, code: row.code ?? '', name: row.name ?? '', description: row.description ?? '', categoryId: row.categoryId ?? row.category?.id ?? '' })}
            onDelete={(row) => deleteMutation.mutate({ type: 'materialType', id: row.id })}
          />
        </section>

        <section className={`${panel} p-4`}>
          <HeaderLine title="Đơn vị tính" editing={Boolean(unitForm.id)} onReset={() => setUnitForm(emptyUnit)} onSave={saveUnit} loading={unitMutation.isPending} />
          <div className="grid gap-2 md:grid-cols-2">
            <input value={unitForm.code} onChange={(event) => setUnitForm((prev) => ({ ...prev, code: event.target.value }))} className={input} placeholder="Mã đơn vị, VD: KG" />
            <input value={unitForm.name} onChange={(event) => setUnitForm((prev) => ({ ...prev, name: event.target.value }))} className={input} placeholder="Tên đơn vị" />
            <input value={unitForm.symbol} onChange={(event) => setUnitForm((prev) => ({ ...prev, symbol: event.target.value }))} className={input} placeholder="Ký hiệu" />
            <input value={unitForm.precision} onChange={(event) => setUnitForm((prev) => ({ ...prev, precision: event.target.value }))} className={input} type="number" min="0" max="6" placeholder="Số lẻ" />
            <select value={unitForm.category} onChange={(event) => setUnitForm((prev) => ({ ...prev, category: event.target.value }))} className={`${input} md:col-span-2`}>
              <option value="WEIGHT">Khối lượng</option>
              <option value="LENGTH">Chiều dài</option>
              <option value="AREA">Diện tích</option>
              <option value="VOLUME">Thể tích</option>
              <option value="COUNT">Số lượng</option>
              <option value="OTHER">Khác</option>
            </select>
          </div>
          <RecordList
            rows={units}
            meta={(row) => `${row.symbol ?? row.code} · ${row.category} · ${countBy('unitId', row.id)} vật tư`}
            onEdit={(row) => setUnitForm({ id: row.id, code: row.code ?? '', name: row.name ?? '', symbol: row.symbol ?? '', category: String(row.category ?? 'OTHER').toUpperCase(), precision: String(row.precision ?? 0) })}
            onDelete={(row) => deleteMutation.mutate({ type: 'unit', id: row.id })}
          />
        </section>
      </div>
    </section>
  )
}

function MiniKpi({ label, value }: { label: string; value: string }) {
  return <div className={`${panel} p-3`}><div className="text-[10px] uppercase tracking-[0.14em] text-slate-500">{label}</div><div className="mt-1 text-xl font-semibold text-white">{value}</div></div>
}

function HeaderLine({ title, editing, loading, onReset, onSave }: { title: string; editing: boolean; loading: boolean; onReset: () => void; onSave: () => void }) {
  return <div className="mb-3 flex items-center justify-between gap-2">
    <h2 className="text-sm font-semibold">{title}</h2>
    <div className="flex gap-2">
      {editing ? <button onClick={onReset} className={actionButton}>Hủy</button> : null}
      <button disabled={loading} onClick={onSave} className={primaryButton}>{editing ? <Save size={14} /> : <Plus size={14} />}{editing ? 'Lưu' : 'Tạo'}</button>
    </div>
  </div>
}

function RecordList({ rows, meta, onEdit, onDelete }: { rows: any[]; meta: (row: any) => string; onEdit: (row: any) => void; onDelete: (row: any) => void }) {
  return <div className="mt-3 max-h-[360px] space-y-2 overflow-auto pr-1">
    {rows.map((row) => <div key={row.id} className="rounded border border-slate-800 bg-slate-950/50 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-slate-100">{row.name}</div>
          <div className="mt-1 text-xs text-cyan-300">{row.code}</div>
          <div className="mt-1 text-xs text-slate-500">{meta(row)}</div>
        </div>
        <div className="flex shrink-0 gap-1">
          <button onClick={() => onEdit(row)} className="rounded border border-slate-700 p-2 text-slate-300 hover:bg-slate-800" aria-label="Sửa"><Edit3 size={14} /></button>
          <button onClick={() => onDelete(row)} className="rounded border border-red-700/50 p-2 text-red-300 hover:bg-red-900/20" aria-label="Xóa"><Trash2 size={14} /></button>
        </div>
      </div>
    </div>)}
  </div>
}

function Card({ title, icon: Icon, children }: { title: string; icon: any; children: ReactNode }) {
  return <section className={`${panel} p-4`}><div className="mb-3 flex items-center justify-between"><h2 className="inline-flex items-center gap-2 text-sm font-semibold"><Icon size={16} className="text-cyan-400" />{title}</h2><button className="rounded bg-slate-900 px-3 py-1 text-xs text-slate-400">Chỉnh sửa</button></div>{children}</section>
}

function ConfigGrid({ title, values }: { title: string; values?: Record<string, unknown> }) {
  return <section className={`${panel} p-4`}><h2 className="mb-4 text-sm font-semibold">{title}</h2><div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">{Object.entries(values ?? {}).map(([k, v]) => <div key={k} className="rounded border border-slate-800 bg-slate-950/40 p-3"><p className="text-xs text-slate-500">{label(k)}</p><p className="mt-2 text-sm font-semibold">{String(v)}</p></div>)}</div></section>
}

function Integrations({ rows }: { rows: Array<{ name: string; status: string }> }) {
  return <section className={`${panel} p-4`}><h2 className="mb-4 text-sm font-semibold">Tích hợp hệ thống</h2><div className="space-y-2">{rows.map((row) => <Info key={row.name} k={row.name} v={row.status} tone={row.status === 'ENABLED' || row.status === 'CONNECTED' ? 'ok' : 'warn'} />)}</div></section>
}

function Toggles({ rows }: { rows: Record<string, boolean> }) {
  return <section className={`${panel} p-4`}><h2 className="mb-4 text-sm font-semibold">Cài đặt thông báo</h2><div className="grid gap-2 md:grid-cols-2">{Object.entries(rows).map(([k, enabled]) => <div key={k} className="flex items-center justify-between rounded border border-slate-800 bg-slate-950/40 p-3 text-sm"><span>{label(k)}</span><span className={`h-5 w-9 rounded-full p-1 ${enabled ? 'bg-blue-600' : 'bg-slate-700'}`}><span className={`block h-3 w-3 rounded-full bg-white ${enabled ? 'ml-4' : ''}`} /></span></div>)}</div></section>
}

function Activities({ rows }: { rows: any[] }) {
  return <section className={`${panel} overflow-hidden`}><h2 className="border-b border-slate-800 px-4 py-3 text-sm font-semibold">Nhật ký cấu hình gần đây</h2><div className="divide-y divide-slate-800">{rows.map((row) => <div key={row.id} className="grid gap-2 px-4 py-3 text-xs md:grid-cols-[170px_140px_140px_1fr]"><span className="text-slate-500">{date(row.createdAt)}</span><span className="text-cyan-300">{row.module ?? '-'}</span><span>{row.action}</span><span className="text-slate-400">{row.entity} {row.entityId ?? ''}</span></div>)}</div></section>
}

function Info({ k, v, tone }: { k: string; v: string; tone?: 'ok' | 'warn' }) {
  return <div className="flex items-center justify-between gap-3 border-b border-slate-800/70 py-2 text-sm last:border-0"><span className="text-slate-500">{k}</span><span className={tone === 'ok' ? 'text-emerald-400' : tone === 'warn' ? 'text-amber-400' : 'text-slate-100'}>{v}</span></div>
}

function label(value: string) {
  return value.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())
}
