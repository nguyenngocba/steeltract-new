import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Plus, Trash2, X } from 'lucide-react'

import { useInventoryItems } from '../../inventory/hooks/useInventoryItems'
import { useInventoryTransactions } from '../../inventory/hooks/useInventoryTransactions'
import { useProjects } from '../../inventory/hooks/useProjects'
import type { ProductionComponent } from '../api/production.api'
import { useCreateProductionBom, useProductionIssues } from '../hooks/useProductionCockpit'

const inputClass = 'mt-2 h-10 w-full rounded border border-slate-700 bg-slate-950 px-3 text-xs text-slate-100 outline-none focus:border-cyan-600'
const defaultRouting = [
  ['Cutting', 'Workshop Cutting', false],
  ['Drilling', 'Workshop Drilling', true],
  ['Assembly', 'Workshop Assembly', false],
  ['Welding', 'Workshop Welding', true],
  ['Painting', 'Workshop Painting', true],
  ['Packing', 'Finished Structure Stock', false],
] as const

type MaterialDraft = {
  materialId: string
  quantity: string
  wastePercent: string
  category: 'MAIN_MATERIAL' | 'SECONDARY_MATERIAL' | 'CONSUMABLE'
}

type RoutingDraft = {
  stepName: string
  workshop: string
  expectedHours: string
  qcRequired: boolean
}

type ProductionMaterialOption = {
  id: string
  code: string
  name: string
  unit?: string
  unitMaster?: { symbol?: string }
  materialUsageType?: 'PRIMARY' | 'SECONDARY' | 'CONSUMABLE'
  sxQty?: number
}

function usageToBomCategory(usage?: string): MaterialDraft['category'] {
  if (usage === 'SECONDARY') return 'SECONDARY_MATERIAL'
  if (usage === 'CONSUMABLE') return 'CONSUMABLE'
  return 'MAIN_MATERIAL'
}

function bomCategoryLabel(category: MaterialDraft['category']) {
  if (category === 'SECONDARY_MATERIAL') return 'Vật tư phụ'
  if (category === 'CONSUMABLE') return 'Tiêu hao'
  return 'Vật tư chính'
}

export function ProductionBomModal({
  components,
  initialComponentId = '',
  onClose,
}: {
  components: ProductionComponent[]
  initialComponentId?: string
  onClose: () => void
}) {
  const create = useCreateProductionBom()
  const { data: inventoryItems = [] } = useInventoryItems()
  const { data: materialIssues = [] } = useProductionIssues()
  const { data: transactionsData = [] } = useInventoryTransactions({})
  const { data: projects = [] } = useProjects()
  const [componentId, setComponentId] = useState(initialComponentId)
  const [structureType, setStructureType] = useState('')
  const [estimatedWeight, setEstimatedWeight] = useState('0')
  const [unit, setUnit] = useState('KIEN')
  const [version, setVersion] = useState('V1')
  const [materials, setMaterials] = useState<MaterialDraft[]>([
    { materialId: '', quantity: '1', wastePercent: '0', category: 'MAIN_MATERIAL' },
  ])
  const [routing, setRouting] = useState<RoutingDraft[]>(
    defaultRouting.map(([stepName, workshop, qcRequired]) => ({
      stepName,
      workshop,
      expectedHours: '1',
      qcRequired,
    })),
  )
  const component = components.find((item) => item.id === componentId)
  const project = useMemo(
    () => (projects as Array<{ id: string; code?: string; name: string }>).find((item) => item.id === component?.projectId),
    [component?.projectId, projects],
  )
  const productionMaterials = useMemo(() => {
    const itemById = new Map((inventoryItems as any[]).map((item) => [String(item.id), item]))
    const qtyByItem = new Map<string, number>()
    const transactionRows = Array.isArray(transactionsData)
      ? transactionsData
      : (transactionsData as any)?.data ?? []

    ;(materialIssues as any[]).forEach((issue) => {
      if (issue.status !== 'ISSUED') return
      const key = String(issue.inventoryItemId ?? '')
      if (!key) return
      qtyByItem.set(key, (qtyByItem.get(key) ?? 0) - Number(issue.issuedQty ?? 0))
    })

    ;(transactionRows as any[]).forEach((transaction) => {
      const remarks = String(transaction.remarks ?? transaction.note ?? '')
      const isReceipt = remarks.includes('[COMPONENT_PRODUCTION]')
      const isReturn = remarks.includes('[COMPONENT_PRODUCTION_RETURN]')
      if (!isReceipt && !isReturn) return

      ;(transaction.items ?? []).forEach((line: any) => {
        const key = String(line.inventoryItemId ?? line.inventoryItem?.id ?? '')
        const qty = Math.abs(Number(line.quantity ?? 0))
        if (!key || qty <= 0) return
        qtyByItem.set(key, (qtyByItem.get(key) ?? 0) + (isReturn ? -qty : qty))
        if (!itemById.has(key) && line.inventoryItem) itemById.set(key, line.inventoryItem)
      })
    })

    return Array.from(qtyByItem.entries())
      .map(([id, qty]) => ({ ...(itemById.get(id) ?? { id, code: id, name: id }), sxQty: qty }))
      .filter((item) => Number(item.sxQty ?? 0) > 0)
      .sort((a, b) => String(a.code).localeCompare(String(b.code)))
  }, [inventoryItems, materialIssues, transactionsData]) as ProductionMaterialOption[]

  const productionMaterialsByCategory = useMemo(() => {
    return productionMaterials.reduce<Record<MaterialDraft['category'], ProductionMaterialOption[]>>((groups, item) => {
      groups[usageToBomCategory(item.materialUsageType)].push(item)
      return groups
    }, {
      MAIN_MATERIAL: [],
      SECONDARY_MATERIAL: [],
      CONSUMABLE: [],
    })
  }, [productionMaterials])

  function updateMaterial(index: number, patch: Partial<MaterialDraft>) {
    setMaterials((rows) => rows.map((row, rowIndex) => rowIndex === index ? { ...row, ...patch } : row))
  }

  function selectMaterial(index: number, materialId: string) {
    const material = productionMaterials.find((row) => row.id === materialId)
    updateMaterial(index, {
      materialId,
      category: usageToBomCategory(material?.materialUsageType),
    })
  }

  function updateRouting(index: number, patch: Partial<RoutingDraft>) {
    setRouting((rows) => rows.map((row, rowIndex) => rowIndex === index ? { ...row, ...patch } : row))
  }

  async function submit() {
    const validMaterials = materials.filter((item) => item.materialId && Number(item.quantity) > 0)
    const validRouting = routing.filter((item) => item.stepName.trim())

    if (!component) return toast.error('Chọn cấu kiện áp dụng BOM')
    if (validMaterials.length === 0) return toast.error('BOM cần ít nhất một vật tư')
    if (validRouting.length === 0) return toast.error('BOM cần ít nhất một công đoạn')

    try {
      const stamp = Date.now().toString().slice(-6)
      await create.mutateAsync({
        bomNo: `BOM-${component.code}-${stamp}`,
        productCode: component.code,
        productName: component.name,
        structureType: structureType || undefined,
        projectId: component.projectId,
        unit,
        estimatedWeight: Number(estimatedWeight || 0),
        version,
        status: 'ACTIVE',
        items: validMaterials.map((item) => ({
          materialId: item.materialId,
          quantity: Number(item.quantity),
          wastePercent: Number(item.wastePercent || 0),
          category: item.category,
        })),
        routingSteps: validRouting.map((item, index) => ({
          stepNo: index + 1,
          stepName: item.stepName,
          workshop: item.workshop || undefined,
          expectedHours: Number(item.expectedHours || 0),
          qcRequired: item.qcRequired,
        })),
      })
      toast.success(`Đã tạo BOM cho ${component.code}`)
      onClose()
    } catch {
      toast.error('Không thể tạo Production BOM')
    }
  }

  return <div className="fixed inset-0 z-[70] overflow-y-auto bg-black/80 p-4">
    <div className="mx-auto max-w-7xl rounded-lg border border-cyan-900 bg-[#061421] shadow-2xl">
      <header className="flex items-start justify-between border-b border-slate-800 p-5">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-400">Production BOM</p>
          <h2 className="mt-1 text-xl font-semibold">Tạo định mức và routing cấu kiện</h2>
          <p className="mt-1 text-xs text-slate-400">BOM xác định vật tư tiêu hao; routing xác định chuỗi công đoạn sản xuất.</p>
        </div>
        <button onClick={onClose} aria-label="Đóng"><X size={20} /></button>
      </header>

      <div className="grid gap-4 p-5 xl:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          <section className="grid gap-3 rounded border border-slate-800 bg-[#04101d] p-4 md:grid-cols-3">
            <label className="text-xs text-slate-400">Cấu kiện
              <select value={componentId} onChange={(event) => setComponentId(event.target.value)} className={inputClass}>
                <option value="">Chọn cấu kiện</option>
                {components.map((item) => <option key={item.id} value={item.id}>{item.code} · {item.name}</option>)}
              </select>
            </label>
            <label className="text-xs text-slate-400">Loại cấu kiện<input value={structureType} onChange={(event) => setStructureType(event.target.value)} className={inputClass} placeholder="Dầm, cột, bản mã..." /></label>
            <label className="text-xs text-slate-400">Khối lượng ước tính (kg)<input value={estimatedWeight} onChange={(event) => setEstimatedWeight(event.target.value)} type="number" min="0" step="0.01" className={inputClass} /></label>
            <label className="text-xs text-slate-400">Đơn vị<input value={unit} onChange={(event) => setUnit(event.target.value)} className={inputClass} /></label>
            <label className="text-xs text-slate-400">Phiên bản<input value={version} onChange={(event) => setVersion(event.target.value)} className={inputClass} /></label>
            <div className="rounded border border-slate-800 bg-slate-950 p-3 text-xs">
              <div className="text-slate-500">Dự án liên kết</div>
              <div className="mt-2 text-cyan-200">{project ? `${project.code ?? project.name} · ${project.name}` : 'Chưa gán dự án'}</div>
            </div>
          </section>

          <section className="rounded border border-slate-800 bg-[#04101d] p-4">
            <div className="mb-3 flex items-center justify-between">
              <div><h3 className="text-sm font-semibold">Materials Grid</h3><p className="mt-1 text-xs text-slate-500">Vật tư lấy từ kho vật tư sản xuất khi cấp phát cho MO.</p></div>
              <button onClick={() => setMaterials((rows) => [...rows, { materialId: '', quantity: '1', wastePercent: '0', category: 'MAIN_MATERIAL' }])} className="flex items-center gap-1 rounded border border-cyan-800 px-3 py-2 text-xs text-cyan-200"><Plus size={14} /> Thêm vật tư</button>
            </div>
            <div className="overflow-x-auto"><table className="w-full min-w-[820px] text-left text-xs">
              <thead className="text-[10px] uppercase text-slate-500"><tr>{['Vật tư', 'Danh mục', 'Định mức', 'Hao hụt %', 'ĐVT', ''].map((item) => <th key={item} className="pb-2 pr-2">{item}</th>)}</tr></thead>
              <tbody>{materials.map((item, index) => {
                const material = productionMaterials.find((row) => row.id === item.materialId)
                const groupOptions = productionMaterialsByCategory[item.category]
                return <tr key={index} className="border-t border-slate-800">
                  <td className="py-2 pr-2">
                    <select value={item.materialId} onChange={(event) => selectMaterial(index, event.target.value)} className={inputClass}>
                      <option value="">Chọn {bomCategoryLabel(item.category).toLowerCase()} từ kho SX</option>
                      {groupOptions.length === 0 ? <option value="" disabled>Không có {bomCategoryLabel(item.category).toLowerCase()} trong kho SX</option> : null}
                      {groupOptions.map((row) => <option key={row.id} value={row.id}>{row.code} · {row.name} · tồn SX {Number(row.sxQty ?? 0).toLocaleString('vi-VN')}</option>)}
                    </select>
                  </td>
                  <td className="pr-2">
                    <select
                      value={item.category}
                      onChange={(event) => updateMaterial(index, { category: event.target.value as MaterialDraft['category'], materialId: '' })}
                      className={inputClass}
                    >
                      <option value="MAIN_MATERIAL">Vật tư chính ({productionMaterialsByCategory.MAIN_MATERIAL.length})</option>
                      <option value="SECONDARY_MATERIAL">Vật tư phụ ({productionMaterialsByCategory.SECONDARY_MATERIAL.length})</option>
                      <option value="CONSUMABLE">Tiêu hao ({productionMaterialsByCategory.CONSUMABLE.length})</option>
                    </select>
                  </td>
                  <td className="pr-2"><input value={item.quantity} onChange={(event) => updateMaterial(index, { quantity: event.target.value })} type="number" min="0.01" step="0.01" className={inputClass} /></td>
                  <td className="pr-2"><input value={item.wastePercent} onChange={(event) => updateMaterial(index, { wastePercent: event.target.value })} type="number" min="0" max="100" step="0.01" className={inputClass} /></td>
                  <td className="pt-2 text-slate-300">{material?.unitMaster?.symbol ?? material?.unit ?? '-'}</td>
                  <td className="pt-2"><button onClick={() => setMaterials((rows) => rows.filter((_, rowIndex) => rowIndex !== index))} aria-label="Xóa vật tư" className="text-red-300"><Trash2 size={15} /></button></td>
                </tr>
              })}</tbody>
            </table></div>
          </section>

          <section className="rounded border border-slate-800 bg-[#04101d] p-4">
            <div className="mb-3 flex items-center justify-between">
              <div><h3 className="text-sm font-semibold">Production Routing</h3><p className="mt-1 text-xs text-slate-500">MO sẽ tự sinh tiến độ công đoạn từ routing này.</p></div>
              <button onClick={() => setRouting((rows) => [...rows, { stepName: '', workshop: '', expectedHours: '1', qcRequired: false }])} className="flex items-center gap-1 rounded border border-cyan-800 px-3 py-2 text-xs text-cyan-200"><Plus size={14} /> Thêm bước</button>
            </div>
            <div className="space-y-2">{routing.map((item, index) => <div key={index} className="grid gap-2 rounded border border-slate-800 bg-slate-950 p-2 md:grid-cols-[36px_1fr_1fr_100px_90px_32px]">
              <div className="flex items-center justify-center text-xs text-cyan-300">{index + 1}</div>
              <input value={item.stepName} onChange={(event) => updateRouting(index, { stepName: event.target.value })} className={inputClass} placeholder="Tên công đoạn" />
              <input value={item.workshop} onChange={(event) => updateRouting(index, { workshop: event.target.value })} className={inputClass} placeholder="Xưởng" />
              <input value={item.expectedHours} onChange={(event) => updateRouting(index, { expectedHours: event.target.value })} type="number" min="0" step="0.25" className={inputClass} />
              <label className="flex items-center gap-2 pt-2 text-xs text-slate-300"><input checked={item.qcRequired} onChange={(event) => updateRouting(index, { qcRequired: event.target.checked })} type="checkbox" /> QC</label>
              <button onClick={() => setRouting((rows) => rows.filter((_, rowIndex) => rowIndex !== index))} aria-label="Xóa công đoạn" className="pt-2 text-red-300"><Trash2 size={15} /></button>
            </div>)}</div>
          </section>
        </div>

        <aside className="space-y-3">
          <div className="rounded border border-slate-800 bg-slate-950 p-4 text-xs">
            <div className="text-slate-500">Cấu kiện áp dụng</div><div className="mt-2 text-cyan-200">{component ? `${component.code} · ${component.name}` : 'Chưa chọn'}</div>
            <div className="mt-4 text-slate-500">Vật tư BOM</div><div className="mt-2 text-xl font-semibold text-white">{materials.filter((item) => item.materialId).length}</div>
            <div className="mt-4 text-slate-500">Công đoạn routing</div><div className="mt-2 text-xl font-semibold text-white">{routing.filter((item) => item.stepName).length}</div>
          </div>
          <div className="rounded border border-amber-900/70 bg-amber-950/20 p-4 text-xs text-amber-100">Production BOM chỉ chọn vật tư đã được xuất sang kho vật tư SX. Danh sách được tách theo Loại vật tư trong Material Master: chính, phụ, tiêu hao.</div>
          <div className="rounded border border-slate-800 bg-slate-950 p-4 text-xs">
            <div className="mb-3 font-semibold text-slate-100">Kho vật tư SX theo nhóm</div>
            {(['MAIN_MATERIAL', 'SECONDARY_MATERIAL', 'CONSUMABLE'] as MaterialDraft['category'][]).map((category) => (
              <div key={category} className="mb-2 flex items-center justify-between text-slate-300">
                <span>{bomCategoryLabel(category)}</span>
                <span className="font-semibold text-cyan-300">{productionMaterialsByCategory[category].length}</span>
              </div>
            ))}
          </div>
        </aside>
      </div>

      <footer className="flex justify-end gap-2 border-t border-slate-800 p-4">
        <button onClick={onClose} className="rounded border border-slate-700 px-4 py-2 text-xs">Hủy</button>
        <button disabled={create.isPending} onClick={submit} className="rounded bg-cyan-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">Tạo Production BOM</button>
      </footer>
    </div>
  </div>
}
