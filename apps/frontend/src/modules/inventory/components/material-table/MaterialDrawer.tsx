import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

import { useCreateMaterial } from '../../hooks/useCreateMaterial'
import { useUpdateMaterial } from '../../hooks/useUpdateMaterial'
import { useCategories } from '../../hooks/useCategories'
import { useUnits } from '../../hooks/useUnits'
import { useMaterialTypes } from '../../hooks/useMaterialTypes'
import { useZones } from '../../hooks/useZones'

type Props = {
  open: boolean
  material?: any | null
  onClose: () => void
}

const drawerInput =
  'h-11 rounded-lg border border-white/12 bg-white/[0.06] px-3 text-sm text-slate-100 placeholder:text-slate-500'
const drawerTextarea =
  'min-h-24 rounded-lg border border-white/12 bg-white/[0.06] px-3 py-3 text-sm text-slate-100 placeholder:text-slate-500'

const MATERIAL_USAGE_OPTIONS = [
  { value: 'PRIMARY', label: 'Vật tư chính' },
  { value: 'SECONDARY', label: 'Vật tư phụ' },
  { value: 'CONSUMABLE', label: 'Vật tư tiêu hao' },
]

function usageLabel(value: string) {
  return MATERIAL_USAGE_OPTIONS.find((item) => item.value === value)?.label ?? 'Vật tư chính'
}

export function MaterialDrawer({ open, material, onClose }: Props) {
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [unit, setUnit] = useState('PCS')
  const [minimumStock, setMinimumStock] = useState(0)
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [materialTypeId, setMaterialTypeId] = useState('')
  const [materialUsageType, setMaterialUsageType] = useState('PRIMARY')
  const [zoneId, setZoneId] = useState('')
  const [error, setError] = useState('')
  const { data: materialTypes = [] } = useMaterialTypes()
  const { data: categories = [] } = useCategories()
  const { data: units = [] } = useUnits()
  const { data: zones = [] } = useZones()
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
      setMaterialUsageType('PRIMARY')
      setZoneId('')
      return
    }
    setCode(material.code ?? '')
    setName(material.name ?? '')
    setUnit(material.unit ?? 'PCS')
    setMinimumStock(material.minimumStock ?? 0)
    setDescription(material.description ?? '')
    setCategoryId(material.categoryId ?? '')
    setMaterialTypeId(material.materialTypeId ?? '')
    setMaterialUsageType(material.materialUsageType ?? 'PRIMARY')
    setZoneId(material.zoneId ?? '')
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
      materialUsageType,
      zoneId,
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

  return createPortal(
    <div className="inventory-material-drawer fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-slate-950/75 p-4 py-8 backdrop-blur-md">
      <style>{'.inventory-material-drawer select option{background:#0f172a;color:#e2e8f0}.inventory-material-drawer select:focus,.inventory-material-drawer input:focus,.inventory-material-drawer textarea:focus{outline:2px solid rgba(34,211,238,.55);outline-offset:1px}'}</style>
      <section className="w-full max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-slate-950/95 shadow-2xl shadow-black/50 backdrop-blur-xl">
        <header className="flex items-start justify-between border-b border-white/10 px-6 py-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300">Vật tư kho</p>
            <h2 className="mt-1 text-xl font-semibold text-white">{isEditMode ? 'Sửa vật tư' : 'Thêm vật tư mới'}</h2>
            <p className="mt-1 text-sm text-slate-400">Thông tin này đồng bộ với tồn kho, nhập xuất và BOM sản xuất.</p>
          </div>
          <button onClick={onClose} className="rounded-lg border border-white/10 bg-white/5 p-2 text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </header>

        <div className="p-6">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Mã vật tư" className={drawerInput} />
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tên vật tư" className={drawerInput} />
            <select value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setMaterialTypeId('') }} className={drawerInput}>
              <option value="">Danh mục vật tư</option>
              {categories.map((category: any) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
            <select value={materialUsageType} onChange={(e) => setMaterialUsageType(e.target.value)} className={drawerInput}>
              {MATERIAL_USAGE_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
            <select value={materialTypeId} onChange={(e) => setMaterialTypeId(e.target.value)} className={drawerInput}>
              <option value="">Quy cách / nhóm kỹ thuật</option>
              {materialTypes.filter((item: any) => !categoryId || item.categoryId === categoryId).map((item: any) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
            <select value={zoneId} onChange={(e) => setZoneId(e.target.value)} className={drawerInput}>
              <option value="">Vị trí kho mặc định</option>
              {zones.map((zone: any) => <option key={zone.id} value={zone.id}>{zone.code} - {zone.name}</option>)}
            </select>
            <select value={unit} onChange={(e) => setUnit(e.target.value)} className={drawerInput}>
              <option value="">Đơn vị tính</option>
              {units.map((item: any) => <option key={item.id} value={item.code}>{item.name} ({item.code})</option>)}
            </select>
            <input type="number" value={minimumStock} onChange={(e) => setMinimumStock(Number(e.target.value))} placeholder="Tồn tối thiểu" className={drawerInput} />
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 text-sm md:grid-cols-4">
            <MetricBox title="Loại vật tư" value={usageLabel(materialUsageType)} />
            <MetricBox title="Tồn tối thiểu" value={Number(minimumStock || 0).toLocaleString('vi-VN')} />
            <MetricBox title="Vị trí mặc định" value={zones.find((zone: any) => zone.id === zoneId)?.code ?? 'Chưa gán'} />
            <MetricBox title="Trạng thái" value={isEditMode ? 'Đang chỉnh sửa' : 'Tạo mới'} />
          </div>

          <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-300">
            Mã vật tư và loại vật tư sẽ được dùng xuyên suốt tồn kho, nhập xuất, BOM và sản xuất. Vị trí mặc định chỉ là nơi gợi ý khi nhập lần đầu, giao dịch thực tế vẫn có thể chọn zone khác.
          </div>

          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ghi chú quy cách, tiêu chuẩn, nguồn cung..." className={`${drawerTextarea} mt-3 w-full`} />
        </div>

        {error && <div className="mx-5 rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</div>}

        <footer className="flex justify-end gap-2 border-t border-white/10 px-6 py-4">
          <button onClick={onClose} className="rounded-lg border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-slate-200 hover:bg-white/10">Hủy</button>
          <button onClick={handleSave} className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 hover:bg-blue-500">{isEditMode ? 'Lưu thay đổi' : 'Tạo vật tư'}</button>
        </footer>
      </section>
    </div>,
    document.body,
  )
}

function MetricBox({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.06] p-3">
      <div className="text-xs text-slate-400">{title}</div>
      <div className="mt-1 truncate text-base font-semibold text-white">{value}</div>
    </div>
  )
}
