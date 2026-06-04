import { type ReactNode, useEffect, useState } from 'react'
import { X } from 'lucide-react'

import { inventoryInput } from '../InventoryVisuals'
import { useCreateMaterial } from '../../hooks/useCreateMaterial'
import { useUpdateMaterial } from '../../hooks/useUpdateMaterial'
import { useCategories } from '../../hooks/useCategories'
import { useUnits } from '../../hooks/useUnits'
import { useMaterialTypes } from '../../hooks/useMaterialTypes'

type Props = {
  open: boolean
  material?: any | null
  onClose: () => void
}

export function MaterialDrawer({ open, material, onClose }: Props) {
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [unit, setUnit] = useState('PCS')
  const [minimumStock, setMinimumStock] = useState(0)
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [materialTypeId, setMaterialTypeId] = useState('')
  const [error, setError] = useState('')
  const { data: materialTypes = [] } = useMaterialTypes()
  const { data: categories = [] } = useCategories()
  const { data: units = [] } = useUnits()
  const createMaterialMutation = useCreateMaterial()
  const updateMaterialMutation = useUpdateMaterial()
  const isEditMode = Boolean(material)

  useEffect(() => {
    setError('')
    if (!material) {
      setCode('')
      setName('')
      setUnit('PCS')
      setMinimumStock(0)
      setDescription('')
      setCategoryId('')
      setMaterialTypeId('')
      return
    }
    setCode(material.code ?? '')
    setName(material.name ?? '')
    setUnit(material.unit ?? 'PCS')
    setMinimumStock(material.minimumStock ?? 0)
    setDescription(material.description ?? '')
    setCategoryId(material.categoryId ?? '')
    setMaterialTypeId(material.materialTypeId ?? '')
  }, [material])

  if (!open) return null

  async function handleSave() {
    if (!code.trim()) {
      setError('Vui lòng nhập mã vật tư.')
      return
    }
    if (!name.trim()) {
      setError('Vui lòng nhập tên vật tư.')
      return
    }
    if (!categoryId) {
      setError('Vui lòng chọn danh mục vật tư.')
      return
    }

    const payload = {
      code,
      name,
      categoryId,
      unit,
      minimumStock,
      description,
      materialTypeId,
    }

    try {
      if (isEditMode && material?.id) {
        await updateMaterialMutation.mutateAsync({ id: material.id, payload })
      } else {
        await createMaterialMutation.mutateAsync(payload)
      }
      onClose()
    } catch (err) {
      console.error(err)
      setError('Không thể lưu vật tư. Vui lòng kiểm tra lại dữ liệu.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md">
      <section className="w-full max-w-3xl overflow-hidden rounded-xl border border-white/10 bg-[#0b1424]/95 shadow-[0_24px_70px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        <header className="flex items-start justify-between border-b border-white/10 px-5 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300">Vật tư kho</p>
            <h2 className="mt-1 text-xl font-semibold text-white">{isEditMode ? 'Sửa vật tư' : 'Thêm vật tư mới'}</h2>
            <p className="mt-1 text-sm text-slate-400">Thông tin này đồng bộ với tồn kho, nhập xuất và BOM sản xuất.</p>
          </div>
          <button onClick={onClose} className="rounded-lg border border-white/10 bg-white/5 p-2 text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </header>

        <div className="grid gap-4 p-5 md:grid-cols-2">
          <Field label="Mã vật tư">
            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="VD: VT-TH-001" className={inventoryInput} />
          </Field>
          <Field label="Tên vật tư">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tên vật tư" className={inventoryInput} />
          </Field>
          <Field label="Danh mục">
            <select value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setMaterialTypeId('') }} className={inventoryInput}>
              <option value="">Chọn danh mục</option>
              {categories.map((category: any) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </Field>
          <Field label="Loại vật tư">
            <select value={materialTypeId} onChange={(e) => setMaterialTypeId(e.target.value)} className={inventoryInput}>
              <option value="">Chọn loại vật tư</option>
              {materialTypes.filter((item: any) => !categoryId || item.categoryId === categoryId).map((item: any) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </Field>
          <Field label="Đơn vị">
            <select value={unit} onChange={(e) => setUnit(e.target.value)} className={inventoryInput}>
              {units.map((item: any) => <option key={item.id} value={item.code}>{item.name} ({item.code})</option>)}
            </select>
          </Field>
          <Field label="Tồn tối thiểu">
            <input type="number" value={minimumStock} onChange={(e) => setMinimumStock(Number(e.target.value))} placeholder="0" className={inventoryInput} />
          </Field>
          <Field label="Mô tả" className="md:col-span-2">
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ghi chú quy cách, tiêu chuẩn, nguồn cung..." className={`${inventoryInput} h-24 py-3`} />
          </Field>
        </div>

        {error && <div className="mx-5 rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</div>}

        <footer className="flex justify-end gap-2 px-5 py-4">
          <button onClick={onClose} className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 hover:text-white">Hủy</button>
          <button onClick={handleSave} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/20">{isEditMode ? 'Lưu thay đổi' : 'Tạo vật tư'}</button>
        </footer>
      </section>
    </div>
  )
}

function Field({ label, children, className = '' }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={`space-y-1.5 ${className}`}>
      <span className="text-xs font-medium text-slate-400">{label}</span>
      {children}
    </label>
  )
}
