import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'

import {
  EnterpriseDatePicker,
  EnterpriseField,
  EnterpriseFormGrid,
  EnterpriseFormSection,
  EnterpriseModalForm,
  EnterpriseNumberField,
  EnterpriseSelect,
} from '@/shared/forms'
import { formatLocalDateTimeInput } from '@/shared/utils/date-time'
import { nextLocalCode } from '@/shared/utils/code-format'
import { formatQuantity, formatQuantityInput, parseLocaleNumber } from '@/shared/utils/number-format'

import type { ProductionBom, ProductionComponent } from '../api/production.api'
import { useCreateProductionOrder } from '../hooks/useProductionCockpit'

export function ManufacturingOrderModal({ components, boms, initialComponentId = '', onClose }: {
  components: ProductionComponent[]
  boms: ProductionBom[]
  initialComponentId?: string
  onClose: () => void
}) {
  const create = useCreateProductionOrder()
  const [componentId, setComponentId] = useState(initialComponentId)
  const [bomId, setBomId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [priority, setPriority] = useState('MEDIUM')
  const [start, setStart] = useState(formatLocalDateTimeInput())
  const [due, setDue] = useState('')
  const [validationError, setValidationError] = useState('')
  const component = components.find((item) => item.id === componentId)
  const matchingBoms = useMemo(() => boms.filter((bom) =>
    bom.status !== 'ARCHIVED' && (!component || bom.productCode === component.code)), [boms, component])
  const effectiveBomId = bomId || (matchingBoms.length === 1 ? matchingBoms[0].id : '')
  const selectedBom = matchingBoms.find((bom) => bom.id === effectiveBomId)

  async function submit() {
    const parsedQuantity = parseLocaleNumber(quantity)
    if (!component || parsedQuantity <= 0) {
      setValidationError('Chọn cấu kiện và nhập số lượng lớn hơn 0.')
      return
    }
    if (!selectedBom) {
      setValidationError('Chọn Production BOM của cấu kiện trước khi tạo lệnh.')
      return
    }
    setValidationError('')
    const orderNo = nextLocalCode('MO')
    try {
      await create.mutateAsync({
        orderNo,
        title: `Sản xuất ${component.name}`,
        componentId,
        projectId: component.projectId,
        bomId: selectedBom.id,
        quantity: parsedQuantity,
        priority,
        status: 'PLANNED',
        plannedStartAt: start || undefined,
        plannedEndAt: due || undefined,
      })
      toast.success(`Đã tạo ${orderNo}`)
      onClose()
    } catch {
      toast.error('Không thể tạo lệnh sản xuất')
    }
  }

  return (
    <EnterpriseModalForm
      open
      title="Tạo lệnh sản xuất cấu kiện"
      description="Chọn cấu kiện, Production BOM và lịch thực hiện."
      onClose={onClose}
      onSubmit={(event) => { event.preventDefault(); void submit() }}
      submitLabel="Tạo lệnh sản xuất"
      pendingLabel="Đang tạo lệnh..."
      pending={create.isPending}
      maxWidthClass="max-w-3xl"
    >
      <EnterpriseFormSection title="Thông tin lệnh" description="Các trường có dấu * là bắt buộc.">
        <EnterpriseFormGrid>
          <EnterpriseField label="Cấu kiện" required htmlFor="production-component">
            <EnterpriseSelect id="production-component" data-autofocus value={componentId} onChange={(event) => { setComponentId(event.target.value); setBomId(''); setValidationError('') }}>
              <option value="">Chọn cấu kiện</option>
              {components.map((item) => <option value={item.id} key={item.id}>{item.code} · {item.name}</option>)}
            </EnterpriseSelect>
          </EnterpriseField>
          <EnterpriseField label="Production BOM" required htmlFor="production-bom">
            <EnterpriseSelect id="production-bom" value={effectiveBomId} onChange={(event) => { setBomId(event.target.value); setValidationError('') }}>
              <option value="">Chọn BOM bắt buộc</option>
              {matchingBoms.map((item) => <option value={item.id} key={item.id}>{item.bomNo} · {item.productName}</option>)}
            </EnterpriseSelect>
          </EnterpriseField>
          <EnterpriseField label="Số lượng" required htmlFor="production-quantity">
            <EnterpriseNumberField id="production-quantity" value={quantity} onFocus={(event) => setQuantity(formatQuantityInput(event.target.value))} onBlur={(event) => setQuantity(formatQuantity(event.target.value))} onChange={(event) => { setQuantity(formatQuantityInput(event.target.value)); setValidationError('') }} />
          </EnterpriseField>
          <EnterpriseField label="Ưu tiên" htmlFor="production-priority">
            <EnterpriseSelect id="production-priority" value={priority} onChange={(event) => setPriority(event.target.value)}>
              <option>MEDIUM</option><option>HIGH</option><option>URGENT</option><option>LOW</option>
            </EnterpriseSelect>
          </EnterpriseField>
          <EnterpriseField label="Ngày bắt đầu" htmlFor="production-start">
            <EnterpriseDatePicker id="production-start" value={start} onFocus={() => setStart(formatLocalDateTimeInput())} onChange={(event) => setStart(event.target.value)} />
          </EnterpriseField>
          <EnterpriseField label="Ngày đến hạn" htmlFor="production-due">
            <EnterpriseDatePicker id="production-due" value={due} onFocus={() => setDue(formatLocalDateTimeInput())} onChange={(event) => setDue(event.target.value)} />
          </EnterpriseField>
        </EnterpriseFormGrid>
        {validationError ? <p role="alert" className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">{validationError}</p> : null}
      </EnterpriseFormSection>

      <EnterpriseFormSection title="Tóm tắt phát hành">
        {!component ? <p className="text-xs text-slate-500">Chọn cấu kiện để lọc BOM tương ứng.</p> : !selectedBom ? <p className="text-xs text-amber-300">Cấu kiện chưa có BOM được chọn. Hãy tạo BOM trước khi phát hành lệnh sản xuất.</p> : <div className="grid gap-4 md:grid-cols-2">
          <div><p className="text-[10px] uppercase text-slate-500">Vật tư theo BOM</p><div className="mt-2 space-y-1">{selectedBom.items.slice(0, 5).map((item) => <div key={item.id} className="flex justify-between text-xs"><span className="text-cyan-300">{item.material.code}</span><span>{item.quantity} {item.material.unitMaster?.symbol ?? item.material.unit ?? '-'}</span></div>)}</div></div>
          <div><p className="text-[10px] uppercase text-slate-500">Routing sẽ tự sinh công đoạn</p><div className="mt-2 flex flex-wrap gap-1">{selectedBom.routingSteps.map((step) => <span key={step.id} className="rounded border border-cyan-900 px-2 py-1 text-[10px] text-cyan-200">{step.stepNo}. {step.stepName}</span>)}</div></div>
        </div>}
      </EnterpriseFormSection>
    </EnterpriseModalForm>
  )
}
