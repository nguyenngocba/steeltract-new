import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Plus, Trash2 } from 'lucide-react'

import { useInventoryItems } from '../../inventory/hooks/useInventoryItems'
import { useProjects } from '../../inventory/hooks/useProjects'
import type { ProductionComponent } from '../api/production.api'
import { useCreateProductionBom, useProductionReservations } from '../hooks/useProductionCockpit'
import { nextLocalCode } from '@/shared/utils/code-format'
import { formatQuantity, formatQuantityInput, parseLocaleNumber } from '@/shared/utils/number-format'
import {
  EnterpriseField,
  EnterpriseAssistantPanel,
  EnterpriseFormGrid,
  EnterpriseFormSection,
  EnterpriseInput,
  EnterpriseModalForm,
  EnterpriseNumberField,
  EnterpriseSelect,
  EnterpriseSuggestionButton,
  enterpriseSecondaryButton,
} from '@/shared/forms'
import { warehouseAllows } from '../../inventory/utils/warehouse-capabilities'

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
  specification?: string
  unit?: string
  unitMaster?: { symbol?: string }
  materialUsageType?: 'PRIMARY' | 'SECONDARY' | 'CONSUMABLE'
  productionStock?: number
  mainStock?: number
  reservedQty?: number
  availableQty?: number
  productionLocations?: string[]
  mainLocations?: string[]
}

type LocationBalanceLike = {
  warehouseCode?: string
  warehouseName?: string
  zoneId?: string
  zoneCode?: string
  zoneName?: string
  slotId?: string
  level?: string | number
  quantity?: number | string
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

function numeric(value: unknown) {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function isProductionWarehouseBalance(location: LocationBalanceLike) {
  return warehouseAllows(location, 'allowProduction')
}

function isMainWarehouseBalance(location: LocationBalanceLike) {
  return warehouseAllows(location, 'allowReceipt') && !warehouseAllows(location, 'allowProduction')
}

function productionLocationLabel(location: LocationBalanceLike) {
  const zone = [location.zoneCode, location.zoneName].filter(Boolean).join(' - ') || location.zoneId || 'Kho SX'
  const slot = location.slotId ? ` / ${location.slotId}` : ''
  const level = location.level ? ` / ${String(location.level).startsWith('L') ? location.level : `L${location.level}`}` : ''
  return `${zone}${slot}${level}`
}

function mainLocationLabel(location: LocationBalanceLike) {
  const zone = [location.zoneCode, location.zoneName].filter(Boolean).join(' - ') || location.zoneId || 'Kho chính'
  const slot = location.slotId ? ` / ${location.slotId}` : ''
  const level = location.level ? ` / ${String(location.level).startsWith('L') ? location.level : `L${location.level}`}` : ''
  return `${zone}${slot}${level}`
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
  const { data: reservations = [] } = useProductionReservations()
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
  const materialOptions = useMemo(() => {
    const reservedByMaterial = new Map<string, number>()
    ;(reservations as any[])
      .filter((reservation) => ['RESERVED', 'PARTIALLY_ISSUED'].includes(String(reservation.status ?? '')))
      .forEach((reservation) => {
        ;(reservation.lines ?? []).forEach((line: any) => {
          const reserved = Math.max(
            0,
            numeric(line.reservedQty) -
              numeric(line.issuedQty) -
              numeric(line.returnedQty),
          )
          reservedByMaterial.set(
            String(line.inventoryItemId),
            (reservedByMaterial.get(String(line.inventoryItemId)) ?? 0) + reserved,
          )
        })
      })
    return (inventoryItems as any[])
      .map((item) => {
        const productionLocations = ((item.locationBalances ?? []) as LocationBalanceLike[])
          .filter(isProductionWarehouseBalance)
          .filter((location) => numeric(location.quantity) > 0)
        const mainLocations = ((item.locationBalances ?? []) as LocationBalanceLike[])
          .filter(isMainWarehouseBalance)
          .filter((location) => numeric(location.quantity) > 0)
        const productionStock = productionLocations.reduce((sum, location) => sum + numeric(location.quantity), 0)
        const mainStock = mainLocations.reduce((sum, location) => sum + numeric(location.quantity), 0)
        const reservedQty = reservedByMaterial.get(String(item.id)) ?? 0
        return {
          ...item,
          productionStock,
          mainStock,
          reservedQty,
          availableQty: Math.max(0, productionStock - reservedQty),
          productionLocations: productionLocations.map(productionLocationLabel),
          mainLocations: mainLocations.map(mainLocationLabel),
        }
      })
      .sort((a, b) => String(a.code).localeCompare(String(b.code)))
  }, [inventoryItems, reservations]) as ProductionMaterialOption[]

  const productionMaterialOptions = useMemo(
    () => materialOptions.filter((item) => numeric(item.productionStock) > 0),
    [materialOptions],
  )

  const materialOptionsByCategory = useMemo(() => {
    return productionMaterialOptions.reduce<Record<MaterialDraft['category'], ProductionMaterialOption[]>>((groups, item) => {
      groups[usageToBomCategory(item.materialUsageType)].push(item)
      return groups
    }, {
      MAIN_MATERIAL: [],
      SECONDARY_MATERIAL: [],
      CONSUMABLE: [],
    })
  }, [productionMaterialOptions])
  const selectedMaterialDraft = materials.find((item) => item.materialId)
  const selectedMaterial = selectedMaterialDraft
    ? materialOptions.find((row) => row.id === selectedMaterialDraft.materialId)
    : undefined
  const stockSuggestions = materialOptions
    .filter((row) => numeric(row.productionStock) > 0 && numeric(row.availableQty) > 0)
    .slice(0, 5)

  function updateMaterial(index: number, patch: Partial<MaterialDraft>) {
    setMaterials((rows) => rows.map((row, rowIndex) => rowIndex === index ? { ...row, ...patch } : row))
  }

  function selectMaterial(index: number, materialId: string) {
    const material = materialOptions.find((row) => row.id === materialId)
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
    const invalidProductionMaterials = validMaterials
      .map((item) => materialOptions.find((row) => row.id === item.materialId))
      .filter((item) => !item || numeric(item.productionStock) <= 0)
    if (invalidProductionMaterials.length > 0) {
      return toast.error('Vật tư BOM cần có tồn kho tại Kho vật tư sản xuất')
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
      toast.error('Không thể tạo BOM kỹ thuật')
    }
  }

  return <EnterpriseModalForm
    open
    title="Tạo BOM kỹ thuật cấu kiện"
    description="Chọn vật tư đang có trong Kho vật tư sản xuất; BOM chỉ lưu định mức, không lưu số tồn."
    onClose={onClose}
    onSubmit={(event) => { event.preventDefault(); void submit() }}
    submitLabel="Tạo BOM"
    pendingLabel="Đang tạo BOM..."
    pending={create.isPending}
    maxWidthClass="max-w-5xl"
  >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-4">
          <EnterpriseFormSection title="Hồ sơ kỹ thuật" description="Chọn hồ sơ cấu kiện và ngữ cảnh revision/BOM áp dụng.">
            <EnterpriseFormGrid columns={3}>
            <EnterpriseField label="Cấu kiện" required htmlFor="bom-component">
              <EnterpriseSelect id="bom-component" data-autofocus value={componentId} onChange={(event) => setComponentId(event.target.value)}>
                <option value="">Chọn cấu kiện</option>
                {components.map((item) => <option key={item.id} value={item.id}>{item.code} · {item.name}</option>)}
              </EnterpriseSelect>
            </EnterpriseField>
            <EnterpriseField label="Loại cấu kiện" htmlFor="bom-structure-type"><EnterpriseInput id="bom-structure-type" value={structureType} onChange={(event) => setStructureType(event.target.value)} placeholder="Theo hồ sơ kỹ thuật" /></EnterpriseField>
            <EnterpriseField label="Khối lượng ước tính (kg)" htmlFor="bom-estimated-weight"><EnterpriseNumberField id="bom-estimated-weight" value={estimatedWeight} onFocus={(event) => setEstimatedWeight(formatQuantityInput(event.target.value))} onBlur={(event) => setEstimatedWeight(formatQuantity(event.target.value))} onChange={(event) => setEstimatedWeight(formatQuantityInput(event.target.value))} /></EnterpriseField>
            <EnterpriseField label="Đơn vị" htmlFor="bom-unit"><EnterpriseInput id="bom-unit" value={unit} onChange={(event) => setUnit(event.target.value)} /></EnterpriseField>
            <EnterpriseField label="Phiên bản" htmlFor="bom-version"><EnterpriseInput id="bom-version" value={version} onChange={(event) => setVersion(event.target.value)} /></EnterpriseField>
            <div className="rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs">
              <div className="text-slate-500">Dự án liên kết</div>
              <div className="mt-2 text-cyan-200">{project ? `${project.code ?? project.name} · ${project.name}` : 'Chưa gán dự án'}</div>
            </div>
            </EnterpriseFormGrid>
          </EnterpriseFormSection>

          <section className="rounded-xl border border-slate-800 bg-[#04101d] p-4">
            <div className="mb-3 flex items-center justify-between">
            <div><h3 className="text-sm font-semibold">Vật tư BOM</h3><p className="mt-1 text-xs text-slate-500">Danh sách lấy từ InventoryLocationStock của Kho vật tư sản xuất.</p></div>
              <button type="button" onClick={() => setMaterials((rows) => [...rows, { materialId: '', quantity: '1', wastePercent: '0', category: 'MAIN_MATERIAL' }])} className={enterpriseSecondaryButton}><Plus size={14} /> Thêm vật tư</button>
            </div>
            <div className="overflow-x-auto"><table className="w-full min-w-[860px] text-left text-xs">
              <thead className="text-[10px] uppercase text-slate-500"><tr>{['Vật tư', 'Danh mục', 'Định mức', 'Hao hụt %', 'ĐVT', ''].map((item) => <th key={item} className="pb-2 pr-2">{item}</th>)}</tr></thead>
              <tbody>{materials.map((item, index) => {
                const material = materialOptions.find((row) => row.id === item.materialId)
                const groupOptions = materialOptionsByCategory[item.category]
                return <tr key={index} className="border-t border-slate-800">
                  <td className="py-2 pr-2">
                    <EnterpriseSelect aria-label={`Vật tư dòng ${index + 1}`} value={item.materialId} onChange={(event) => selectMaterial(index, event.target.value)}>
                      <option value="">Chọn {bomCategoryLabel(item.category).toLowerCase()}</option>
                      {groupOptions.length === 0 ? <option value="" disabled>Chưa có vật tư có tồn tại Kho vật tư sản xuất</option> : null}
                      {groupOptions.map((row) => <option key={row.id} value={row.id}>{row.code} · {row.name} · {row.specification ?? '-'} · {row.unitMaster?.symbol ?? row.unit ?? '-'} · Tồn kho SX {formatQuantity(row.productionStock ?? 0)} · Đã giữ chỗ {formatQuantity(row.reservedQty ?? 0)} · Khả dụng {formatQuantity(row.availableQty ?? 0)} · Kho vật tư {formatQuantity(row.mainStock ?? 0)}</option>)}
                    </EnterpriseSelect>
                  </td>
                  <td className="pr-2">
                    <EnterpriseSelect
                      aria-label={`Danh mục dòng ${index + 1}`}
                      value={item.category}
                      onChange={(event) => updateMaterial(index, { category: event.target.value as MaterialDraft['category'], materialId: '' })}
                    >
                      <option value="MAIN_MATERIAL">Vật tư chính ({materialOptionsByCategory.MAIN_MATERIAL.length})</option>
                      <option value="SECONDARY_MATERIAL">Vật tư phụ ({materialOptionsByCategory.SECONDARY_MATERIAL.length})</option>
                      <option value="CONSUMABLE">Tiêu hao ({materialOptionsByCategory.CONSUMABLE.length})</option>
                    </EnterpriseSelect>
                  </td>
                  <td className="pr-2"><EnterpriseNumberField aria-label={`Định mức dòng ${index + 1}`} value={item.quantity} onFocus={(event) => updateMaterial(index, { quantity: formatQuantityInput(event.target.value) })} onBlur={(event) => updateMaterial(index, { quantity: formatQuantity(event.target.value) })} onChange={(event) => updateMaterial(index, { quantity: formatQuantityInput(event.target.value) })} /></td>
                  <td className="pr-2"><EnterpriseNumberField aria-label={`Hao hụt dòng ${index + 1}`} value={item.wastePercent} onFocus={(event) => updateMaterial(index, { wastePercent: formatQuantityInput(event.target.value) })} onBlur={(event) => updateMaterial(index, { wastePercent: formatQuantity(event.target.value) })} onChange={(event) => updateMaterial(index, { wastePercent: formatQuantityInput(event.target.value) })} /></td>
                  <td className="pt-2 text-slate-300">
                    <div>{material?.unitMaster?.symbol ?? material?.unit ?? '-'}</div>
                    {material ? <div className="mt-1 text-[10px] text-slate-500">Tồn kho SX {formatQuantity(material.productionStock ?? 0)} · Đã giữ chỗ {formatQuantity(material.reservedQty ?? 0)} · Khả dụng {formatQuantity(material.availableQty ?? 0)} · Kho vật tư {formatQuantity(material.mainStock ?? 0)}</div> : null}
                  </td>
                  <td className="pt-2"><button type="button" onClick={() => setMaterials((rows) => rows.filter((_, rowIndex) => rowIndex !== index))} aria-label="Xóa vật tư" className="grid h-9 w-9 place-items-center rounded-lg text-red-300 hover:bg-red-500/10"><Trash2 size={15} /></button></td>
                </tr>
              })}</tbody>
            </table></div>
          </section>

          <section className="rounded-xl border border-slate-800 bg-[#04101d] p-4">
            <div className="mb-3 flex items-center justify-between">
              <div><h3 className="text-sm font-semibold">Routing / Công đoạn</h3><p className="mt-1 text-xs text-slate-500">MO sẽ tự sinh tiến độ công đoạn từ routing này.</p></div>
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
          <EnterpriseAssistantPanel title="Ngữ cảnh BOM" description="Readonly, không tạo reservation hoặc inventory movement.">
            <div className="text-slate-500">Cấu kiện áp dụng</div><div className="mt-2 text-cyan-200">{component ? `${component.code} · ${component.name}` : 'Chưa chọn'}</div>
            <div className="mt-4 text-slate-500">Vật tư BOM</div><div className="mt-2 text-xl font-semibold text-white">{materials.filter((item) => item.materialId).length}</div>
            <div className="mt-4 text-slate-500">Công đoạn routing</div><div className="mt-2 text-xl font-semibold text-white">{routing.filter((item) => item.stepName).length}</div>
          </EnterpriseAssistantPanel>
          <div className="rounded-xl border border-amber-900/70 bg-amber-950/20 p-4 text-xs text-amber-100">BOM kỹ thuật chỉ lưu định mức vật tư. Số tồn hiển thị ở đây đến từ Kho vật tư sản xuất để tránh chọn nhầm tồn Kho vật tư chính.</div>
          <EnterpriseAssistantPanel title="Vật tư đang chọn" description="Tồn kho SX là nguồn khả dụng vận hành; Kho vật tư chỉ là tham khảo.">
            {selectedMaterial ? <div className="space-y-2">
              <InfoLine label="Mã vật tư" value={selectedMaterial.code} />
              <InfoLine label="Tên" value={selectedMaterial.name} />
              <InfoLine label="Quy cách" value={selectedMaterial.specification ?? '-'} />
              <InfoLine label="ĐVT" value={selectedMaterial.unitMaster?.symbol ?? selectedMaterial.unit ?? '-'} />
              <InfoLine label="Tồn kho SX" value={formatQuantity(selectedMaterial.productionStock ?? 0)} />
              <InfoLine label="Đã giữ chỗ" value={formatQuantity(selectedMaterial.reservedQty ?? 0)} />
              <InfoLine label="Khả dụng" value={formatQuantity(selectedMaterial.availableQty ?? 0)} />
              <InfoLine label="Kho vật tư" value={formatQuantity(selectedMaterial.mainStock ?? 0)} />
              {numeric(selectedMaterial.productionStock) <= 0 ? (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-amber-200">
                  Kho SX = 0. Vật tư này không khả dụng cho sản xuất.
                </div>
              ) : null}
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-slate-500">
                Kho SX: {selectedMaterial.productionLocations?.join('; ') || 'Chưa có vị trí SX'}
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-slate-500">
                Kho chính: {selectedMaterial.mainLocations?.join('; ') || 'Chưa có vị trí Kho chính'}
              </div>
            </div> : <p className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-slate-500">Chọn một dòng vật tư để xem khả dụng.</p>}
          </EnterpriseAssistantPanel>
          {materials.filter((item) => item.materialId).length ? <EnterpriseAssistantPanel title="Khả dụng vật tư đã chọn">
            <div className="space-y-2">
              {materials.filter((item) => item.materialId).map((item, index) => {
                const material = materialOptions.find((row) => row.id === item.materialId)
                const quantity = parseLocaleNumber(item.quantity)
                const wastePercent = parseLocaleNumber(item.wastePercent || 0)
                const required = Number.isFinite(quantity) ? quantity * (1 + wastePercent / 100) : 0
                const shortage = Math.max(0, required - numeric(material?.availableQty))
                return <div key={`${item.materialId}-${index}`} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate font-semibold text-cyan-200">{material?.code ?? item.materialId}</span>
                    <span className={shortage > 0 ? 'text-amber-300' : 'text-emerald-300'}>{shortage > 0 ? `Thiếu ${formatQuantity(shortage)}` : 'Đủ theo tồn hiện tại'}</span>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-slate-400">
                    <span>Tồn SX {formatQuantity(material?.productionStock ?? 0)}</span>
                    <span>Giữ chỗ {formatQuantity(material?.reservedQty ?? 0)}</span>
                    <span>Khả dụng {formatQuantity(material?.availableQty ?? 0)}</span>
                  </div>
                  <div className="mt-1 truncate text-slate-500">Kho SX: {material?.productionLocations?.join('; ') || 'Chưa có vị trí SX'}</div>
                  <div className="mt-1 truncate text-slate-500">Kho chính: {formatQuantity(material?.mainStock ?? 0)} {material?.unitMaster?.symbol ?? material?.unit ?? ''}</div>
                </div>
              })}
            </div>
          </EnterpriseAssistantPanel> : null}
          <EnterpriseAssistantPanel title="Gợi ý từ dữ liệu thật">
            <div className="space-y-2">
              {stockSuggestions.length ? stockSuggestions.map((row) => (
                <EnterpriseSuggestionButton
                  key={row.id}
                  onClick={() => {
                    const targetIndex = materials.findIndex((item) => !item.materialId)
                    if (targetIndex === -1) {
                      setMaterials((rows) => [...rows, {
                        materialId: row.id,
                        quantity: '1',
                        wastePercent: '0',
                        category: usageToBomCategory(row.materialUsageType),
                      }])
                    } else {
                      selectMaterial(targetIndex, row.id)
                    }
                  }}
                >
                  <span className="block font-semibold text-cyan-200">{row.code} · {row.name}</span>
                  <span className="mt-1 block text-slate-400">Có tồn SX khả dụng {formatQuantity(row.availableQty ?? 0)} {row.unitMaster?.symbol ?? row.unit ?? ''}</span>
                  {numeric(row.mainStock) > 0 ? <span className="mt-1 block text-slate-500">Kho chính còn {formatQuantity(row.mainStock ?? 0)} {row.unitMaster?.symbol ?? row.unit ?? ''} - chỉ là thông tin, không tính vào khả dụng SX.</span> : null}
                </EnterpriseSuggestionButton>
              )) : <p className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-slate-500">Chưa có vật tư có tồn khả dụng tại Kho vật tư sản xuất.</p>}
            </div>
          </EnterpriseAssistantPanel>
          <EnterpriseAssistantPanel title="Vật tư có tồn kho SX theo nhóm">
            {(['MAIN_MATERIAL', 'SECONDARY_MATERIAL', 'CONSUMABLE'] as MaterialDraft['category'][]).map((category) => (
              <div key={category} className="mb-2 flex items-center justify-between text-slate-300">
                <span>{bomCategoryLabel(category)}</span>
                <span className="font-semibold text-cyan-300">{materialOptionsByCategory[category].length}</span>
              </div>
            ))}
            <div className="mt-3 rounded-lg border border-white/10 bg-white/[0.03] p-3 text-slate-500">
              {materialOptions.length - productionMaterialOptions.length} Material Master chưa có tồn tại Kho vật tư sản xuất.
            </div>
          </EnterpriseAssistantPanel>
        </aside>
      </div>

  </EnterpriseModalForm>
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
      <span className="text-slate-500">{label}</span>
      <b className="text-right font-medium text-slate-200">{value}</b>
    </div>
  )
}
