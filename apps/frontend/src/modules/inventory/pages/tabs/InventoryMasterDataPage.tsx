import { useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Edit3, Plus, Save, Trash2, X } from 'lucide-react'

import { EnterpriseModulePage } from '../../../../shared/runtime-tabs/EnterpriseModulePage'
import { InventoryTabWorkspace } from '../../components/InventoryTabWorkspace'
import { InventoryKpi, InventoryPanel, inventoryInput } from '../../components/InventoryVisuals'
import { inventoryApi } from '../../api/inventory.api'
import { useCategories } from '../../hooks/useCategories'
import { useUnits } from '../../hooks/useUnits'
import { useZones } from '../../hooks/useZones'
import { useMaterialTypes } from '../../hooks/useMaterialTypes'
import { useInventoryItems } from '../../hooks/useInventoryItems'

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

const buttonClass = 'inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-semibold text-slate-100 transition hover:bg-white/10'
const primaryButtonClass = 'inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-700'

function countBy(items: any[], key: string, value: string) {
  return items.filter((item) => String(item?.[key] ?? '') === String(value)).length
}

export function InventoryMasterDataPage() {
  const queryClient = useQueryClient()
  const { data: categories = [] } = useCategories()
  const { data: units = [] } = useUnits()
  const { data: zones = [] } = useZones()
  const { data: materialTypes = [] } = useMaterialTypes()
  const { data: materials = [] } = useInventoryItems()

  const [categoryForm, setCategoryForm] = useState<CategoryForm>(emptyCategory)
  const [materialTypeForm, setMaterialTypeForm] = useState<MaterialTypeForm>(emptyMaterialType)
  const [unitForm, setUnitForm] = useState<UnitForm>(emptyUnit)

  const categoryMutation = useMutation({
    mutationFn: async (payload: CategoryForm) => {
      const body = { code: payload.code.trim().toUpperCase(), name: payload.name.trim(), description: payload.description.trim() || undefined }
      if (payload.id) return inventoryApi.put(`/inventory/categories/${payload.id}`, body).then((res) => res.data)
      return inventoryApi.post('/inventory/categories', body).then((res) => res.data)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['inventory-categories'] })
      setCategoryForm(emptyCategory)
      toast.success('Đã lưu danh mục vật tư')
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
      toast.success('Đã lưu loại/quy cách vật tư')
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
      toast.success('Đã lưu đơn vị tính')
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
      toast.success('Đã ngừng sử dụng danh mục')
    },
  })

  const stats = useMemo(() => {
    return {
      categories: categories.length,
      materialTypes: materialTypes.length,
      units: units.length,
      zones: zones.length,
    }
  }, [categories.length, materialTypes.length, units.length, zones.length])

  function saveCategory() {
    if (!categoryForm.code.trim() || !categoryForm.name.trim()) return toast.error('Nhập mã và tên danh mục vật tư')
    categoryMutation.mutate(categoryForm)
  }

  function saveMaterialType() {
    if (!materialTypeForm.code.trim() || !materialTypeForm.name.trim() || !materialTypeForm.categoryId) return toast.error('Nhập đủ mã, tên và danh mục')
    materialTypeMutation.mutate(materialTypeForm)
  }

  function saveUnit() {
    if (!unitForm.code.trim() || !unitForm.name.trim()) return toast.error('Nhập mã và tên đơn vị')
    unitMutation.mutate(unitForm)
  }

  return (
    <EnterpriseModulePage>
      <InventoryTabWorkspace />
      <div className="grid gap-3 md:grid-cols-4">
        <InventoryKpi title="Danh mục vật tư" value={stats.categories.toLocaleString('vi-VN')} tone="cyan" note="nhóm quản trị" />
        <InventoryKpi title="Loại / quy cách" value={stats.materialTypes.toLocaleString('vi-VN')} tone="blue" note="gắn theo danh mục" />
        <InventoryKpi title="Đơn vị tính" value={stats.units.toLocaleString('vi-VN')} tone="emerald" note="Material Master dùng chung" />
        <InventoryKpi title="Zone kho" value={stats.zones.toLocaleString('vi-VN')} tone="amber" note="vị trí mặc định vật tư" />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <InventoryPanel title="Danh mục vật tư">
          <MasterFormActions editing={Boolean(categoryForm.id)} onReset={() => setCategoryForm(emptyCategory)} onSave={saveCategory} loading={categoryMutation.isPending} />
          <div className="grid gap-2">
            <input value={categoryForm.code} onChange={(event) => setCategoryForm((prev) => ({ ...prev, code: event.target.value }))} className={inventoryInput} placeholder="Mã danh mục, VD: STEEL" />
            <input value={categoryForm.name} onChange={(event) => setCategoryForm((prev) => ({ ...prev, name: event.target.value }))} className={inventoryInput} placeholder="Tên danh mục, VD: Thép hình" />
            <textarea value={categoryForm.description} onChange={(event) => setCategoryForm((prev) => ({ ...prev, description: event.target.value }))} className={`${inventoryInput} min-h-20 py-3`} placeholder="Mô tả" />
          </div>
          <MasterList
            rows={categories}
            empty="Chưa có danh mục vật tư"
            renderMeta={(row) => `${countBy(materials, 'categoryId', row.id)} vật tư đang dùng`}
            onEdit={(row) => setCategoryForm({ id: row.id, code: row.code ?? '', name: row.name ?? '', description: row.description ?? '' })}
            onDelete={(row) => deleteMutation.mutate({ type: 'category', id: row.id })}
          />
        </InventoryPanel>

        <InventoryPanel title="Loại vật tư / Quy cách">
          <MasterFormActions editing={Boolean(materialTypeForm.id)} onReset={() => setMaterialTypeForm(emptyMaterialType)} onSave={saveMaterialType} loading={materialTypeMutation.isPending} />
          <div className="grid gap-2">
            <input value={materialTypeForm.code} onChange={(event) => setMaterialTypeForm((prev) => ({ ...prev, code: event.target.value }))} className={inventoryInput} placeholder="Mã quy cách, VD: H_BEAM" />
            <input value={materialTypeForm.name} onChange={(event) => setMaterialTypeForm((prev) => ({ ...prev, name: event.target.value }))} className={inventoryInput} placeholder="Tên loại/quy cách" />
            <select value={materialTypeForm.categoryId} onChange={(event) => setMaterialTypeForm((prev) => ({ ...prev, categoryId: event.target.value }))} className={inventoryInput}>
              <option value="">Chọn danh mục vật tư</option>
              {categories.map((category: any) => <option key={category.id} value={category.id}>{category.code} - {category.name}</option>)}
            </select>
            <textarea value={materialTypeForm.description} onChange={(event) => setMaterialTypeForm((prev) => ({ ...prev, description: event.target.value }))} className={`${inventoryInput} min-h-20 py-3`} placeholder="Mô tả quy cách" />
          </div>
          <MasterList
            rows={materialTypes}
            empty="Chưa có loại/quy cách"
            renderMeta={(row) => `${row.category?.name ?? 'Chưa gán danh mục'} · ${countBy(materials, 'materialTypeId', row.id)} vật tư`}
            onEdit={(row) => setMaterialTypeForm({ id: row.id, code: row.code ?? '', name: row.name ?? '', description: row.description ?? '', categoryId: row.categoryId ?? row.category?.id ?? '' })}
            onDelete={(row) => deleteMutation.mutate({ type: 'materialType', id: row.id })}
          />
        </InventoryPanel>

        <InventoryPanel title="Đơn vị tính">
          <MasterFormActions editing={Boolean(unitForm.id)} onReset={() => setUnitForm(emptyUnit)} onSave={saveUnit} loading={unitMutation.isPending} />
          <div className="grid gap-2">
            <input value={unitForm.code} onChange={(event) => setUnitForm((prev) => ({ ...prev, code: event.target.value }))} className={inventoryInput} placeholder="Mã đơn vị, VD: KG" />
            <input value={unitForm.name} onChange={(event) => setUnitForm((prev) => ({ ...prev, name: event.target.value }))} className={inventoryInput} placeholder="Tên đơn vị, VD: Kilogram" />
            <div className="grid grid-cols-2 gap-2">
              <input value={unitForm.symbol} onChange={(event) => setUnitForm((prev) => ({ ...prev, symbol: event.target.value }))} className={inventoryInput} placeholder="Ký hiệu" />
              <input value={unitForm.precision} onChange={(event) => setUnitForm((prev) => ({ ...prev, precision: event.target.value }))} className={inventoryInput} type="number" min="0" max="6" placeholder="Số lẻ" />
            </div>
            <select value={unitForm.category} onChange={(event) => setUnitForm((prev) => ({ ...prev, category: event.target.value }))} className={inventoryInput}>
              <option value="WEIGHT">Khối lượng</option>
              <option value="LENGTH">Chiều dài</option>
              <option value="AREA">Diện tích</option>
              <option value="VOLUME">Thể tích</option>
              <option value="COUNT">Số lượng</option>
              <option value="OTHER">Khác</option>
            </select>
          </div>
          <MasterList
            rows={units}
            empty="Chưa có đơn vị tính"
            renderMeta={(row) => `${row.symbol ?? row.code} · ${row.category} · ${countBy(materials, 'unitId', row.id)} vật tư`}
            onEdit={(row) => setUnitForm({ id: row.id, code: row.code ?? '', name: row.name ?? '', symbol: row.symbol ?? '', category: row.category ?? 'OTHER', precision: String(row.precision ?? 0) })}
            onDelete={(row) => deleteMutation.mutate({ type: 'unit', id: row.id })}
          />
        </InventoryPanel>
      </div>
    </EnterpriseModulePage>
  )
}

function MasterFormActions({ editing, loading, onReset, onSave }: { editing: boolean; loading: boolean; onReset: () => void; onSave: () => void }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <div className="text-xs text-slate-400">{editing ? 'Đang sửa bản ghi' : 'Tạo bản ghi mới'}</div>
      <div className="flex gap-2">
        {editing ? <button onClick={onReset} className={buttonClass}><X size={14} /> Hủy</button> : null}
        <button disabled={loading} onClick={onSave} className={primaryButtonClass}>{editing ? <Save size={14} /> : <Plus size={14} />} {editing ? 'Lưu' : 'Tạo'}</button>
      </div>
    </div>
  )
}

function MasterList({
  rows,
  empty,
  renderMeta,
  onEdit,
  onDelete,
}: {
  rows: any[]
  empty: string
  renderMeta: (row: any) => string
  onEdit: (row: any) => void
  onDelete: (row: any) => void
}) {
  return (
    <div className="mt-4 space-y-2">
      {rows.length === 0 ? <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-400">{empty}</div> : null}
      {rows.map((row) => (
        <div key={row.id} className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-semibold text-slate-100">{row.name}</div>
              <div className="mt-1 text-xs text-cyan-300">{row.code}</div>
              <div className="mt-1 text-xs text-slate-500">{renderMeta(row)}</div>
            </div>
            <div className="flex shrink-0 gap-1">
              <button onClick={() => onEdit(row)} className="rounded-lg border border-white/10 p-2 text-slate-300 hover:bg-white/10" aria-label="Sửa"><Edit3 size={14} /></button>
              <button onClick={() => onDelete(row)} className="rounded-lg border border-red-400/20 p-2 text-red-300 hover:bg-red-400/10" aria-label="Xóa"><Trash2 size={14} /></button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
