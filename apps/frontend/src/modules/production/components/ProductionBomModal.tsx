import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Plus, Trash2 } from 'lucide-react'

import { useInventoryItems } from '../../inventory/hooks/useInventoryItems'
import { useInventoryTransactions } from '../../inventory/hooks/useInventoryTransactions'
import { useProjects } from '../../inventory/hooks/useProjects'
import type { ProductionComponent } from '../api/production.api'
import { useCreateProductionBom, useProductionIssues } from '../hooks/useProductionCockpit'
import { nextLocalCode } from '@/shared/utils/code-format'
import { formatQuantity, formatQuantityInput, parseLocaleNumber } from '@/shared/utils/number-format'
import {
  EnterpriseField,
  EnterpriseFormGrid,
  EnterpriseFormSection,
  EnterpriseInput,
  EnterpriseModalForm,
  EnterpriseNumberField,
  EnterpriseSelect,
  enterpriseSecondaryButton,
} from '@/shared/forms'

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

function isProductionWarehouseLine(line: any, transaction: any) {
  const warehouseCode = String(line.warehouse?.code ?? transaction.warehouse?.code ?? '').toUpperCase()
  const warehouseName = String(line.warehouse?.name ?? transaction.warehouse?.name ?? '').toLowerCase()
  return warehouseCode === 'PRODUCTION' || warehouseName.includes('sản xuất')
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
        const qty = Number(line.quantity ?? 0)
        if (!key || !Number.isFinite(qty) || qty === 0) return
        if (!isProductionWarehouseLine(line, transaction)) return
        if (isReceipt && !isReturn && qty <= 0) return
        if (isReturn && qty >= 0) return
        qtyByItem.set(key, (qtyByItem.get(key) ?? 0) + qty)
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

  const requiredByMaterial = useMemo(() => {
    const required = new Map<string, number>()
    materials.forEach((item) => {
      if (!item.materialId) return
      const quantity = parseLocaleNumber(item.quantity)
      const wastePercent = parseLocaleNumber(item.wastePercent || 0)
      if (!Number.isFinite(quantity) || quantity <= 0) return
      required.set(
        item.materialId,
        (required.get(item.materialId) ?? 0) + quantity * (1 + wastePercent / 100),
      )
    })
    return required
  }, [materials])

  const stockWarnings = useMemo(() => {
    return Array.from(requiredByMaterial.entries())
      .map(([materialId, required]) => {
        const material = productionMaterials.find((item) => item.id === materialId)
        const available = Number(material?.sxQty ?? 0)
        return { materialId, material, required, available, shortage: Math.max(0, required - available) }
      })
      .filter((item) => item.shortage > 0)
  }, [productionMaterials, requiredByMaterial])

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
    const validMaterials = materials.filter((item) => item.materialId && parseLocaleNumber(item.quantity) > 0)
    const validRouting = routing.filter((item) => item.stepName.trim())

    if (!component) return toast.error('Chọn cấu kiện áp dụng BOM')
    if (validMaterials.length === 0) return toast.error('BOM cần ít nhất một vật tư')
    if (validRouting.length === 0) return toast.error('BOM cần ít nhất một công đoạn')
    if (stockWarnings.length > 0) {
      const warning = stockWarnings[0]
      return toast.error(
        `${warning.material?.code ?? 'Vật tư'} vượt tồn kho SX: cần ${formatQuantity(warning.required)}, còn ${formatQuantity(warning.available)}`,
      )
    }

    try {
      await create.mutateAsync({
        bomNo: nextLocalCode('BOM'),
        productCode: component.code,
        productName: component.name,
        structureType: structureType || undefined,
        projectId: component.projectId,
        unit,
        estimatedWeight: parseLocaleNumber(estimatedWeight || 0),
        version,
        status: 'ACTIVE',
        items: validMaterials.map((item) => ({
          materialId: item.materialId,
          quantity: parseLocaleNumber(item.quantity),
          wastePercent: parseLocaleNumber(item.wastePercent || 0),
          category: item.category,
        })),
        routingSteps: validRouting.map((item, index) => ({
          stepNo: index + 1,
          stepName: item.stepName,
          workshop: item.workshop || undefined,
          expectedHours: parseLocaleNumber(item.expectedHours || 0),
          qcRequired: item.qcRequired,
        })),
      })
      toast.success(`Đã tạo BOM cho ${component.code}`)
      onClose()
    } catch {
      toast.error('Không thể tạo Production BOM')
    }
  }

  return <EnterpriseModalForm
    open
    title="Tạo định mức và routing cấu kiện"
    description="BOM xác định vật tư tiêu hao; routing xác định chuỗi công đoạn sản xuất."
    onClose={onClose}
    onSubmit={(event) => { event.preventDefault(); void submit() }}
    submitLabel="Tạo Production BOM"
    pendingLabel="Đang tạo BOM..."
    pending={create.isPending}
    maxWidthClass="max-w-7xl"
  >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-4">
          <EnterpriseFormSection title="Thông tin BOM" description="Chọn cấu kiện và thông tin định mức áp dụng.">
            <EnterpriseFormGrid columns={3}>
            <EnterpriseField label="Cấu kiện" required htmlFor="bom-component">
              <EnterpriseSelect id="bom-component" data-autofocus value={componentId} onChange={(event) => setComponentId(event.target.value)}>
                <option value="">Chọn cấu kiện</option>
                {components.map((item) => <option key={item.id} value={item.id}>{item.code} · {item.name}</option>)}
              </EnterpriseSelect>
            </EnterpriseField>
            <EnterpriseField label="Loại cấu kiện" htmlFor="bom-structure-type"><EnterpriseInput id="bom-structure-type" value={structureType} onChange={(event) => setStructureType(event.target.value)} placeholder="Dầm, cột, bản mã..." /></EnterpriseField>
            <EnterpriseField label="Khối lượng ước tính (kg)" htmlFor="bom-estimated-weight"><EnterpriseNumberField id="bom-estimated-weight" value={estimatedWeight} onFocus={(event) => setEstimatedWeight(formatQuantityInput(event.target.value))} onBlur={(event) => setEstimatedWeight(formatQuantity(event.target.value))} onChange={(event) => setEstimatedWeight(formatQuantityInput(event.target.value))} /></EnterpriseField>
            <EnterpriseField label="Đơn vị" htmlFor="bom-unit"><EnterpriseInput id="bom-unit" value={unit} onChange={(event) => setUnit(event.target.value)} /></EnterpriseField>
            <EnterpriseField label="Phiên bản" htmlFor="bom-version"><EnterpriseInput id="bom-version" value={version} onChange={(event) => setVersion(event.target.value)} /></EnterpriseField>
            <div className="rounded border border-slate-800 bg-slate-950 p-3 text-xs">
              <div className="text-slate-500">Dự án liên kết</div>
              <div className="mt-2 text-cyan-200">{project ? `${project.code ?? project.name} · ${project.name}` : 'Chưa gán dự án'}</div>
            </div>
            </EnterpriseFormGrid>
          </EnterpriseFormSection>

          <section className="rounded border border-slate-800 bg-[#04101d] p-4">
            <div className="mb-3 flex items-center justify-between">
              <div><h3 className="text-sm font-semibold">Materials Grid</h3><p className="mt-1 text-xs text-slate-500">Vật tư lấy từ kho vật tư sản xuất khi cấp phát cho MO.</p></div>
              <button type="button" onClick={() => setMaterials((rows) => [...rows, { materialId: '', quantity: '1', wastePercent: '0', category: 'MAIN_MATERIAL' }])} className={enterpriseSecondaryButton}><Plus size={14} /> Thêm vật tư</button>
            </div>
            <div className="overflow-x-auto"><table className="w-full min-w-[920px] text-left text-xs">
              <thead className="text-[10px] uppercase text-slate-500"><tr>{['Vật tư', 'Danh mục', 'Định mức', 'Hao hụt %', 'Tồn SX', 'ĐVT', ''].map((item) => <th key={item} className="pb-2 pr-2">{item}</th>)}</tr></thead>
              <tbody>{materials.map((item, index) => {
                const material = productionMaterials.find((row) => row.id === item.materialId)
                const groupOptions = productionMaterialsByCategory[item.category]
                const requiredTotal = item.materialId ? requiredByMaterial.get(item.materialId) ?? 0 : 0
                const available = Number(material?.sxQty ?? 0)
                const isOverStock = item.materialId && requiredTotal > available
                return <tr key={index} className="border-t border-slate-800">
                  <td className="py-2 pr-2">
                    <EnterpriseSelect aria-label={`Vật tư dòng ${index + 1}`} value={item.materialId} onChange={(event) => selectMaterial(index, event.target.value)}>
                      <option value="">Chọn {bomCategoryLabel(item.category).toLowerCase()} từ kho SX</option>
                      {groupOptions.length === 0 ? <option value="" disabled>Không có {bomCategoryLabel(item.category).toLowerCase()} trong kho SX</option> : null}
                      {groupOptions.map((row) => <option key={row.id} value={row.id}>{row.code} · {row.name} · tồn SX {formatQuantity(row.sxQty ?? 0)}</option>)}
                    </EnterpriseSelect>
                  </td>
                  <td className="pr-2">
                    <EnterpriseSelect
                      aria-label={`Danh mục dòng ${index + 1}`}
                      value={item.category}
                      onChange={(event) => updateMaterial(index, { category: event.target.value as MaterialDraft['category'], materialId: '' })}
                    >
                      <option value="MAIN_MATERIAL">Vật tư chính ({productionMaterialsByCategory.MAIN_MATERIAL.length})</option>
                      <option value="SECONDARY_MATERIAL">Vật tư phụ ({productionMaterialsByCategory.SECONDARY_MATERIAL.length})</option>
                      <option value="CONSUMABLE">Tiêu hao ({productionMaterialsByCategory.CONSUMABLE.length})</option>
                    </EnterpriseSelect>
                  </td>
                  <td className="pr-2"><EnterpriseNumberField aria-label={`Định mức dòng ${index + 1}`} value={item.quantity} onFocus={(event) => updateMaterial(index, { quantity: formatQuantityInput(event.target.value) })} onBlur={(event) => updateMaterial(index, { quantity: formatQuantity(event.target.value) })} onChange={(event) => updateMaterial(index, { quantity: formatQuantityInput(event.target.value) })} /></td>
                  <td className="pr-2"><EnterpriseNumberField aria-label={`Hao hụt dòng ${index + 1}`} value={item.wastePercent} onFocus={(event) => updateMaterial(index, { wastePercent: formatQuantityInput(event.target.value) })} onBlur={(event) => updateMaterial(index, { wastePercent: formatQuantity(event.target.value) })} onChange={(event) => updateMaterial(index, { wastePercent: formatQuantityInput(event.target.value) })} /></td>
                  <td className={`pt-2 ${isOverStock ? 'text-red-300' : 'text-emerald-300'}`}>
                    {item.materialId ? `${formatQuantity(requiredTotal)} / ${formatQuantity(available)}` : '-'}
                  </td>
                  <td className="pt-2 text-slate-300">{material?.unitMaster?.symbol ?? material?.unit ?? '-'}</td>
                  <td className="pt-2"><button type="button" onClick={() => setMaterials((rows) => rows.filter((_, rowIndex) => rowIndex !== index))} aria-label="Xóa vật tư" className="grid h-9 w-9 place-items-center rounded-lg text-red-300 hover:bg-red-500/10"><Trash2 size={15} /></button></td>
                </tr>
              })}</tbody>
            </table></div>
          </section>

          <section className="rounded border border-slate-800 bg-[#04101d] p-4">
            <div className="mb-3 flex items-center justify-between">
              <div><h3 className="text-sm font-semibold">Production Routing</h3><p className="mt-1 text-xs text-slate-500">MO sẽ tự sinh tiến độ công đoạn từ routing này.</p></div>
              <button type="button" onClick={() => setRouting((rows) => [...rows, { stepName: '', workshop: '', expectedHours: '1', qcRequired: false }])} className={enterpriseSecondaryButton}><Plus size={14} /> Thêm bước</button>
            </div>
            <div className="space-y-2">{routing.map((item, index) => <div key={index} className="grid gap-2 rounded border border-slate-800 bg-slate-950 p-2 md:grid-cols-[36px_1fr_1fr_100px_90px_32px]">
              <div className="flex items-center justify-center text-xs text-cyan-300">{index + 1}</div>
              <EnterpriseInput aria-label={`Tên công đoạn ${index + 1}`} value={item.stepName} onChange={(event) => updateRouting(index, { stepName: event.target.value })} placeholder="Tên công đoạn" />
              <EnterpriseInput aria-label={`Xưởng công đoạn ${index + 1}`} value={item.workshop} onChange={(event) => updateRouting(index, { workshop: event.target.value })} placeholder="Xưởng" />
              <EnterpriseNumberField aria-label={`Số giờ công đoạn ${index + 1}`} value={item.expectedHours} onFocus={(event) => updateRouting(index, { expectedHours: formatQuantityInput(event.target.value) })} onBlur={(event) => updateRouting(index, { expectedHours: formatQuantity(event.target.value) })} onChange={(event) => updateRouting(index, { expectedHours: formatQuantityInput(event.target.value) })} />
              <label className="flex items-center gap-2 pt-2 text-xs text-slate-300"><input checked={item.qcRequired} onChange={(event) => updateRouting(index, { qcRequired: event.target.checked })} type="checkbox" /> QC</label>
              <button type="button" onClick={() => setRouting((rows) => rows.filter((_, rowIndex) => rowIndex !== index))} aria-label="Xóa công đoạn" className="grid h-9 w-9 place-items-center rounded-lg text-red-300 hover:bg-red-500/10"><Trash2 size={15} /></button>
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
          {stockWarnings.length > 0 ? <div className="rounded border border-red-900/70 bg-red-950/25 p-4 text-xs text-red-100">
            <div className="mb-2 font-semibold">Không đủ tồn kho SX</div>
            <div className="space-y-1">
              {stockWarnings.map((warning) => (
                <div key={warning.materialId}>
                  {warning.material?.code ?? warning.materialId}: cần {formatQuantity(warning.required)}, còn {formatQuantity(warning.available)}, thiếu {formatQuantity(warning.shortage)}
                </div>
              ))}
            </div>
          </div> : null}
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

  </EnterpriseModalForm>
}
